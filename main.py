import uvicorn
from fastapi import FastAPI, WebSocket
from frank.ws import ChatWebSocketHandler
from frank.core.logging import configure_logging
from frank.api.routes import router as api_router
from frank.services.auth import UserRequired

app = FastAPI()
configure_logging(app)

app.include_router(api_router)


@app.websocket("/ws/chat")
async def chat_ws(ws: WebSocket, user: UserRequired):
    await ChatWebSocketHandler(ws, user).run()


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
