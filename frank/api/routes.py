from fastapi import APIRouter, HTTPException
from frank.ws import load_chat


router = APIRouter()


@router.get("/api/healthz")
async def healthz():
    return {"status": "ok"}


@router.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str):
    chat = await load_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat.model_dump(by_alias=True)
