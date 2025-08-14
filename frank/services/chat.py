import logfire
from typing import Annotated
from fastapi import Depends, HTTPException
from frank.core.redis import get_redis
from frank.schemas import Chat


class ChatService:
    """Service for managing chat sessions"""

    HISTORY_LENGTH = 80
    CHAT_TTL = 60 * 60 * 24  # 24 hours

    @staticmethod
    async def load(chat_id: str) -> Chat | None:
        """Load a chat session from Redis"""
        redis = get_redis()
        chat_data = await redis.get(_make_key(chat_id))
        return Chat.model_validate_json(chat_data) if chat_data else None

    @staticmethod
    async def save(chat: Chat) -> None:
        """Save a chat session to Redis"""
        redis = get_redis()
        try:
            await redis.setex(
                _make_key(chat.id),
                ChatService.CHAT_TTL,
                chat.model_dump_json(by_alias=True),
            )
        except Exception as e:
            logfire.error(f"Error saving chat session: {e}")
            raise

    @staticmethod
    async def exists(chat_id: str) -> bool:
        """Check if a chat session exists"""
        redis = get_redis()
        return await redis.exists(_make_key(chat_id)) > 0


def _make_key(chat_id: str) -> str:
    """Create Redis key for chat session"""
    return f"chat:{chat_id}"


async def get_chat_optional(chat_id: str) -> Chat | None:
    """Dependency that loads a chat or returns None"""
    return await ChatService.load(chat_id)


async def get_chat_required(chat_id: str) -> Chat:
    """Dependency that loads a chat or raises 404"""
    chat = await ChatService.load(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


ChatOptional = Annotated[Chat | None, Depends(get_chat_optional)]
ChatRequired = Annotated[Chat, Depends(get_chat_required)]
