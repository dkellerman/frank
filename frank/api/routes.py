from fastapi import APIRouter, HTTPException
from frank.services.chat import ChatRequired
from frank.services.auth import UserRequired


router = APIRouter()


@router.get("/api/chats/{chat_id}")
async def get_chat(chat: ChatRequired, user: UserRequired):
    """Fetch chat session"""
    if chat.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return chat.model_dump(by_alias=True)


@router.get("/api/healthz")
async def healthz():
    return {"status": "ok"}
