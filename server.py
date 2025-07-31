import modal
import os
import json
import dotenv
import logfire
import pydantic
from upstash_redis.asyncio import Redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from frank.agent import stream_answer
from frank.models import (
    ChatEvent,
    EventType,
    SendEvent,
    ReplyEvent,
    ErrorEvent,
)

dotenv.load_dotenv()

image = (
    modal.Image.debian_slim()
    .pip_install_from_pyproject("pyproject.toml")
    .pip_install("websockets")
    .add_local_file(".env", "/root/.env", copy=True)
    .add_local_dir("client/dist", "/root/client/dist", copy=True)
    .add_local_python_source("frank", copy=True)
)

app_env = os.getenv("APP_ENV", "development")
app = modal.App("frank")

web_app = FastAPI()
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://*.modal.run",
        "https://frank.xfr.llc",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logfire.configure(
    send_to_logfire="if-token-present",
    token=os.getenv("LOGFIRE_TOKEN"),
    environment=app_env,
    service_name="server",
    scrubbing=False,
)
logfire.instrument_fastapi(web_app)

redis = Redis.from_env()


@web_app.websocket("/ws/chat")
async def chat_ws(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            if data:
                try:
                    event = pydantic.TypeAdapter(ChatEvent).validate_python(
                        json.loads(data)
                    )
                except ValidationError as e:
                    logfire.info(f"Message validation error: {e}")
                    await send_to_user(
                        ws, ErrorEvent(detail=f"Error: {e}", code="validation_error")
                    )
                    continue
                if event.type == EventType.HELLO:
                    await send_to_user(ws, event)  # send event back
                elif event.type == EventType.SEND:
                    await handle_send(ws, event)

    except WebSocketDisconnect:
        logfire.info("WebSocket disconnected")

    except RuntimeError as e:
        ignore = 'Cannot call "receive" once a disconnect message has been received'
        if ignore in str(e):
            pass
        else:
            logfire.error(f"Runtime error: {e}")
            raise
    finally:
        pass


async def handle_send(ws: WebSocket, event: SendEvent):
    """User sent a message, stream the answer."""
    async for chunk in stream_answer(
        event.message,
        delta=True,
        model=event.model,
        direct=event.direct,
    ):
        await send_to_user(ws, ReplyEvent(text=chunk, done=False))
    await send_to_user(ws, ReplyEvent(text="&emsp;**⨍**", done=True))


async def send_to_user(ws: WebSocket, response: ChatEvent):
    await ws.send_json(response.model_dump(by_alias=True))


@web_app.get("/api/healthz")
def healthz():
    return {"status": "ok"}


@app.function(image=image)
@modal.asgi_app()
def serve():
    web_app.mount(
        "/", StaticFiles(directory="/root/client/dist", html=True), name="static"
    )
    return web_app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:web_app", host="127.0.0.1", port=8000, reload=True)
