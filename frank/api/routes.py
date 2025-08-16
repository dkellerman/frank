from fastapi import APIRouter, HTTPException
from frank.services.chat import ChatRequired, make_user_chat
from frank.services.auth import UserRequired
from frank.schemas import UserChat


router = APIRouter()


@router.get("/api/chats/{chat_id}")
async def get_chat(chat: ChatRequired, user: UserRequired) -> UserChat:
    """Fetch user-facing chat session"""
    if chat.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    user_chat = make_user_chat(chat)
    return user_chat.model_dump(by_alias=True, mode="json")


@router.get("/api/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}
