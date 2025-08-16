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
from frank.schemas import Chat, UserChat, ChatEntry


HISTORY_LENGTH = 80
CHAT_TTL = 60 * 60 * 24


async def load_chat(chat_id: str) -> Chat | None:
    """Load a chat session from Redis"""
    redis = get_redis()
    chat_data = await redis.get(_make_key(chat_id))
    return Chat.model_validate_json(chat_data) if chat_data else None


async def save_chat(chat: Chat) -> None:
    """Save a chat session to Redis"""
    redis = get_redis()

    chat.updated = datetime.now(timezone.utc)
    chat_data = chat.model_dump(by_alias=True, mode="json")
    chat_data["history"] = json.loads(ModelMessagesTypeAdapter.dump_json(chat.history))

    try:
        await redis.setex(_make_key(chat.id), CHAT_TTL, chat_data)
    except Exception as e:
        logfire.error(f"Error saving chat session: {e}")
        raise


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
                created=getattr(
                    msg.parts[0],
                    "timestamp",
                    getattr(msg, "timestamp", datetime.now(timezone.utc)),
                ),
            )
            for msg in chat.history
            if len(msg.parts) > 0
        ],
    )


async def get_chat_optional(chat_id: str) -> Chat | None:
    return await load_chat(chat_id)


async def get_chat_required(chat_id: str) -> Chat:
    chat = await load_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


def _make_key(chat_id: str) -> str:
    """Create Redis key for chat session"""
    return f"chat:{chat_id}"


ChatOptional = Annotated[Chat | None, Depends(get_chat_optional)]
ChatRequired = Annotated[Chat, Depends(get_chat_required)]
