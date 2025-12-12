from typing import Annotated
from fastapi import Depends, HTTPException, status, Query, Header
from supabase_auth.types import User
from frank.core.supabase import get_supabase_client


async def get_user_from_token(token: str) -> User | None:
    try:
        user = get_supabase_client().auth.get_user(token)
        return user.user
    except Exception:
        return None


async def get_user(token: str = Query(None), authorization: str = Header(None)) -> User:
    token_to_try = token or (
        authorization.replace("Bearer ", "")
        if authorization and authorization.startswith("Bearer ")
        else None
    )

    if token_to_try:
        user = await get_user_from_token(token_to_try)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
    )


UserRequired = Annotated[User, Depends(get_user)]
