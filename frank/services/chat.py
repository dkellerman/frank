import json
import logfire
import uuid
from datetime import datetime, timezone
from typing import Annotated
from fastapi import Depends, HTTPException
from pydantic_ai.messages import (
    ModelMessagesTypeAdapter,
    ModelRequest,
    TextPart,
    UserPromptPart,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from frank.core.db import get_session
from frank.core.redis import get_redis
from frank.db.models import ChatMessage, ChatRole, ChatSession
from frank.schemas import Chat, UserChat, ChatEntry


HISTORY_LENGTH = 80
CHAT_TTL = 60 * 60 * 24


async def load_chat(chat_id: str, session: AsyncSession) -> Chat | None:
    """Load a chat session from Redis, falling back to DB"""
    redis = get_redis()

    # fetch from cache
    try:
        cached = await redis.get(_make_key(chat_id))

        if cached:
            if isinstance(cached, (str, bytes)):
                return Chat.model_validate_json(cached)
            return Chat.model_validate(cached)
    except Exception as e:
        logfire.error(f"Error reading chat from Redis: {e}")

    chat = await _fetch_chat(session, chat_id)
    if chat:
        try:
            chat_data = chat.model_dump(by_alias=True, mode="json")
            chat_data["history"] = json.loads(
                ModelMessagesTypeAdapter.dump_json(chat.history)
            )
            await redis.setex(_make_key(chat.id), CHAT_TTL, chat_data)
        except Exception as e:
            logfire.error(f"Error caching chat to Redis: {e}")

    return chat


async def save_chat(chat: Chat, session: AsyncSession) -> str:
    """Save a chat session to Redis"""
    await _create_or_update_chat(session, chat)

    # add to redis
    chat_data = chat.model_dump(by_alias=True, mode="json")
    chat_data["history"] = json.loads(ModelMessagesTypeAdapter.dump_json(chat.history))
    try:
        await get_redis().setex(_make_key(chat.id), CHAT_TTL, chat_data)
    except Exception as e:
        logfire.error(f"Error saving chat session: {e}")
        # not catastrophic, don't reraise exception
    return chat.id


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


async def _fetch_chat(session: AsyncSession, chat_id: str) -> Chat | None:
    try:
        chat_uuid = uuid.UUID(chat_id)
    except ValueError:
        return None

    chat_row = await session.get(ChatSession, chat_uuid)
    if not chat_row:
        return None

    result = await session.execute(
        select(ChatMessage)
        .where(ChatMessage.chat_id == chat_row.id)
        .order_by(ChatMessage.seq.asc())
    )
    rows = result.scalars().all()

    history: list = []
    for row in rows:
        history.extend(ModelMessagesTypeAdapter.validate_python(row.content))

    return Chat(
        id=str(chat_row.id),
        userId=str(chat_row.user_id),
        title=chat_row.title,
        model=chat_row.model,
        ts=chat_row.ts,
        updatedAt=chat_row.updated_at,
        history=history,
        lastSeq=rows[-1].seq if rows else 0,
    )


async def _create_or_update_chat(session: AsyncSession, chat: Chat) -> None:
    chat.updated_at = datetime.now(timezone.utc)

    if chat.id:
        chat_uuid = uuid.UUID(chat.id)
        chat_row = await session.get(ChatSession, chat_uuid)
    else:
        chat_row = None

    if not chat_row:
        chat_row = ChatSession(
            id=uuid.uuid4(),
            user_id=uuid.UUID(chat.user_id),
            title=chat.title,
            model=chat.model,
            ts=chat.ts,
        )
        session.add(chat_row)
        await session.flush()
        chat.id = str(chat_row.id)
    else:
        chat_row.title = chat.title
        chat_row.model = chat.model
        chat_row.ts = chat.ts

    result = await session.execute(
        select(ChatMessage.seq)
        .where(ChatMessage.chat_id == chat_row.id)
        .order_by(ChatMessage.seq.desc())
        .limit(1)
    )
    last_seq = result.scalar_one_or_none() or 0

    new_messages = chat.history[last_seq:]
    if new_messages:
        for i, msg in enumerate(new_messages, start=last_seq + 1):
            session.add(
                ChatMessage(
                    chat_id=chat_row.id,
                    seq=i,
                    role=ChatRole.USER.value
                    if isinstance(msg, ModelRequest)
                    else ChatRole.ASSISTANT.value,
                    content=json.loads(ModelMessagesTypeAdapter.dump_json([msg])),
                )
            )
        chat.last_seq = last_seq + len(new_messages)
    else:
        chat.last_seq = last_seq

    await session.commit()


async def get_chat_optional(
    chat_id: str, session: AsyncSession = Depends(get_session)
) -> Chat | None:
    return await load_chat(chat_id, session)


async def get_chat_required(
    chat_id: str, session: AsyncSession = Depends(get_session)
) -> Chat:
    chat = await load_chat(chat_id, session)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


ChatOptional = Annotated[Chat | None, Depends(get_chat_optional)]
ChatRequired = Annotated[Chat, Depends(get_chat_required)]
