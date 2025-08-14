from fastapi import APIRouter
from frank.services.chat import ChatRequired


router = APIRouter()


@router.get("/api/chats/{chat_id}")
async def get_chat(chat: ChatRequired):
    """Fetch chat session"""
    return chat.model_dump(by_alias=True)


@router.get("/api/healthz")
async def healthz():
    return {"status": "ok"}
