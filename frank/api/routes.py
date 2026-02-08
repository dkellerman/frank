import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from frank.services.chat import ChatRequired, make_user_chat
from frank.services.auth import UserRequired, create_anonymous_user
from frank.core.db import get_session
from frank.schemas import UserChat, AuthAnonymousResponse, AuthUserOut
from frank.db.models import AuthToken as DbAuthToken


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


@router.get("/api/auth/me")
async def auth_me(user: UserRequired) -> AuthUserOut:
    return user


@router.post("/api/auth/anonymous", response_model=AuthAnonymousResponse)
async def auth_anonymous(
    session: AsyncSession = Depends(get_session),
) -> AuthAnonymousResponse:
    user, token = await create_anonymous_user(session)
    return AuthAnonymousResponse(user={"id": str(user.id)}, authToken=token.token)


@router.post("/api/auth/logout")
async def auth_logout(
    user: UserRequired,
    session: AsyncSession = Depends(get_session),
) -> dict[str, bool]:
    await session.execute(
        delete(DbAuthToken).where(DbAuthToken.user_id == uuid.UUID(user.id))
    )
    await session.commit()
    return {"ok": True}
