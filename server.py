import modal
import os
import logging
import dotenv
import logfire
from upstash_redis.asyncio import Redis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from frank.models import ChatRequest, ChatResponse, ChatEvent
from frank.agent import stream_answer

dotenv.load_dotenv()
logging.basicConfig(level=logging.INFO)

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
                    request = ChatRequest.model_validate_json(data)
                except ValidationError as e:
                    logging.info(f"Message validation error: {e}")
                    await send_message(ws, ChatResponse(text=f"Error: {e}", done=True))
                    continue
                async for chunk in stream_answer(
                    request.message, delta=True, direct=request.direct
                ):
                    await send_message(ws, ChatResponse(text=chunk, done=False))
                await send_message(ws, ChatResponse(text="  **⨍**", done=True))

    except WebSocketDisconnect:
        logging.info("WebSocket disconnected")

    except RuntimeError as e:
        ignore = 'Cannot call "receive" once a disconnect message has been received'
        if ignore in str(e):
            pass
        else:
            logging.error(f"Runtime error: {e}")
            raise
    finally:
        pass


async def send_message(ws: WebSocket, message: ChatEvent):
    await ws.send_text(message.model_dump_json())


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
