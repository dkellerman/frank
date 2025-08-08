from fastapi import APIRouter, HTTPException
from frank.ws import ChatWebSocketHandler


router = APIRouter()


@router.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str):
    """Fetch chat session"""
    chat = await ChatWebSocketHandler.load_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat.model_dump(by_alias=True)


@router.get("/api/healthz")
async def healthz():
    return {"status": "ok"}
