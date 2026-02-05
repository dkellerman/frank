import secrets
from datetime import datetime, timezone
from typing import Annotated
from fastapi import Depends, HTTPException, status, Query, Header
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from frank.core.db import get_session
from frank.db.models import User as DbUser, AuthToken as DbAuthToken
from frank.schemas import AuthUserOut


async def get_user_from_token(token: str, session: AsyncSession) -> AuthUserOut | None:
    stmt = (
        select(DbUser.id)
        .join(DbAuthToken, DbAuthToken.user_id == DbUser.id)
        .where(
            DbAuthToken.token == token,
            or_(
                DbAuthToken.expires_at.is_(None),
                DbAuthToken.expires_at > datetime.now(timezone.utc),
            ),
        )
    )
    result = await session.execute(stmt)
    user_id = result.scalar_one_or_none()
    if not user_id:
        return None
    return AuthUserOut(id=str(user_id))


async def get_user(
    token: str = Query(None),
    authorization: str = Header(None),
    session: AsyncSession = Depends(get_session),
) -> AuthUserOut:
    token_to_try = token or (
        authorization.replace("Bearer ", "")
        if authorization and authorization.startswith("Bearer ")
        else None
    )

    if token_to_try:
        user = await get_user_from_token(token_to_try, session)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
    )


async def create_anonymous_user(
    session: AsyncSession = Depends(get_session),
) -> tuple[DbUser, DbAuthToken]:
    user = DbUser()
    token = DbAuthToken(token=secrets.token_hex(32))
    token.user = user
    session.add(user)
    await session.commit()
    return user, token


UserRequired = Annotated[AuthUserOut, Depends(get_user)]
