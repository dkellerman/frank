import json
import logfire
from datetime import datetime, timezone
from typing import Annotated
from fastapi import Depends, HTTPException
from pydantic_ai.messages import (
    ModelMessagesTypeAdapter,
    ModelRequest,
    TextPart,
    UserPromptPart,
)
from frank.core.redis import get_redis
from frank.core.supabase import get_supabase_client
from frank.schemas import Chat, UserChat, ChatEntry


HISTORY_LENGTH = 80
CHAT_TTL = 60 * 60 * 24


async def load_chat(chat_id: str) -> Chat | None:
    """Load a chat session from Redis"""
    redis = get_redis()
    supa = get_supabase_client()

    # fetch from cache
    chat_data = await redis.get(_make_key(chat_id))

    if not chat_data:
        # query db & add to cache
        # make _fetch method here:
        #   db fetch -> join history & return as pydantic model
        chat_data = supa.table("chat").select("*").eq("id", chat_id).execute().data[0]
        await redis.setex(_make_key(chat_id), CHAT_TTL, chat_data)

    return Chat.model_validate_json(chat_data) if chat_data else None


async def save_chat(chat: Chat) -> str:
    """Save a chat session to Redis"""
    supa = get_supabase_client()

    with supa.postgrest.rpc("begin").execute() as transaction:
        chat.updated_at = datetime.now(timezone.utc)
        chat.id = await _upsert_chat(chat)
        chat.last_seq = await _sync_chat_messages(chat.id, chat.history)
        transaction.postgrest.rpc("commit").execute()

    # add to redis
    chat_data = chat.model_dump(by_alias=True, mode="json")
    chat_data["history"] = json.loads(ModelMessagesTypeAdapter.dump_json(chat.history))
    try:
        await get_redis().setex(_make_key(chat.id), CHAT_TTL, chat_data)
    except Exception as e:
        logfire.error(f"Error saving chat session: {e}")
        # not catastrophic, don't reraise exception


def make_user_chat(chat: Chat) -> UserChat:
    """Make a UserChat model from a Chat model to send to the client"""
    return UserChat(
        **chat.model_dump(by_alias=True),
        history=[
            ChatEntry(
                role="user" if isinstance(msg, ModelRequest) else "assistant",
                content=" ".join(
                    part.content
                    for part in msg.parts
                    if isinstance(part, (UserPromptPart, TextPart))
                    and getattr(part, "content", None)
                ),
                ts=getattr(
                    msg.parts[0],
                    "timestamp",
                    getattr(msg, "timestamp", datetime.now(timezone.utc)),
                ),
            )
            for msg in chat.history
            if len(msg.parts) > 0
        ],
    )


def _make_key(chat_id: str) -> str:
    """Create Redis key for chat session"""
    return f"chat:{chat_id}"


async def _upsert_chat(chat: Chat) -> str:
    """Insert or update a chat in the database and return the chat ID"""
    supa = get_supabase_client()

    chat_data = {
        "id": chat.id,
        "user_id": chat.user_id,
        "title": chat.title,
        "model": chat.model,
        "ts": chat.ts,
        "updated_at": datetime.now(timezone.utc),
    }

    result = supa.table("chat").upsert(chat_data, on_conflict="id").execute()

    if result.data:
        return result.data[0]["id"]
    else:
        raise Exception("Failed to upsert chat")


async def _sync_chat_messages(chat_id: str, history: list) -> int:
    """Sync chat messages to the database and return the latest order"""
    supa = get_supabase_client()

    msg_ct = (
        supa.table("chat_message")
        .select("id", count="exact")
        .eq("chat_id", chat_id)
        .execute()
    ).count or 0

    if len(history) > msg_ct:
        new_messages = history[msg_ct:]
        message_data = []
        for msg in new_messages:
            message_data.append(
                {
                    "chat_id": chat_id,
                    "role": "user" if isinstance(msg, ModelRequest) else "assistant",
                    "content": json.loads(ModelMessagesTypeAdapter.dump_json([msg])),
                }
            )

        if message_data:
            insert_result = supa.table("chat_message").insert(message_data).execute()
            if insert_result.data:
                return insert_result.data[-1]["order"]

    latest_order_result = (
        supa.table("chat_message")
        .select("order")
        .eq("chat_id", chat_id)
        .order("order", desc=True)
        .limit(1)
        .execute()
    )

    return latest_order_result.data[0]["order"] if latest_order_result.data else 0


async def get_chat_optional(chat_id: str) -> Chat | None:
    return await load_chat(chat_id)


async def get_chat_required(chat_id: str) -> Chat:
    chat = await load_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


ChatOptional = Annotated[Chat | None, Depends(get_chat_optional)]
ChatRequired = Annotated[Chat, Depends(get_chat_required)]
