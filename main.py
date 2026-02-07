import uvicorn
from fastapi import Depends, FastAPI, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession
from frank.ws import ChatWebSocketHandler
from frank.core.logging import configure_logging
from frank.api.routes import router as api_router
from frank.core.db import get_session
from frank.services.auth import UserRequired

app = FastAPI()
configure_logging(app)

app.include_router(api_router)


@app.websocket("/ws/chat")
async def chat_ws(
    ws: WebSocket,
    user: UserRequired,
    session: AsyncSession = Depends(get_session),
):
    await ChatWebSocketHandler(ws, user, session).run()


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
