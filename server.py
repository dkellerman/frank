import modal
import os
import json
import dotenv
import logfire
import pydantic
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic_ai.result import StreamedRunResult
from upstash_redis.asyncio import Redis
from frank.agent import stream_agent_response
from frank.models import (
    AgentQuery,
    ChatEvent,
    InitializeEvent,
    EventType,
    SendEvent,
    ReplyEvent,
    ErrorEvent,
    Session,
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

IGNORE_ERRORS = [
    "Cannot call 'receive' once a disconnect message has been received",
]


@web_app.websocket("/ws/chat")
async def chat_ws(ws: WebSocket):
    await ws.accept()
    logfire.info("WebSocket connected")

    session: Session | None = None

    try:
        while True:
            data = await ws.receive_text()
            if data:
                try:
                    event = pydantic.TypeAdapter(ChatEvent).validate_python(
                        json.loads(data)
                    )

                    # first message must be initialize to establish session
                    if not session and event.type != EventType.INITIALIZE:
                        await send_error(ws, "No session initialized", "no_session")
                        return

                except pydantic.ValidationError as e:
                    logfire.info(f"Message validation error: {e}")
                    await send_error(ws, f"Error: {e}", "validation_error")
                    continue

                if event.type == EventType.INITIALIZE:
                    session = await handle_initialize(ws, event)

                elif event.type == EventType.SEND:
                    await handle_send(ws, event, session)

    except WebSocketDisconnect:
        logfire.info("WebSocket disconnected")

    except RuntimeError as e:
        if any(ignore in str(e) for ignore in IGNORE_ERRORS):
            pass
        else:
            logfire.error(f"Runtime error: {e}")
            raise
    finally:
        pass


async def handle_initialize(ws: WebSocket, event: InitializeEvent) -> Session:
    # load/create session
    session_data = await redis.get(_skey(event.session_id))
    if session_data:
        try:
            # Try loading with aliases first (new format)
            session = Session.model_validate_json(session_data)
        except pydantic.ValidationError:
            # Fallback to loading without aliases (old format)
            session = Session.model_validate_json(
                session_data, by_alias=False, by_name=True
            )
            # Re-save with new format
            await save_session(session)
    else:
        session = Session(id=event.session_id)
        await save_session(session)

    # echo back response
    await send_to_user(ws, event)
    return session


async def handle_send(ws: WebSocket, event: SendEvent, session: Session):
    """User sent a message, stream the answer."""

    async def _on_done(query: AgentQuery, result: StreamedRunResult):
        await handle_agent_done(ws, query, result, session)

    async for chunk in stream_agent_response(
        event.message,
        model=event.model,
        history=session.chat_history,
        on_done=_on_done,
    ):
        await send_to_user(ws, ReplyEvent(text=chunk, done=False))


async def handle_agent_done(
    ws: WebSocket,
    query: AgentQuery,
    result: StreamedRunResult,
    session: Session,
):
    """User sent a message, stream the answer."""

    logfire.info(f"\n\n*** Agent query: {query.model_dump_json()}")

    # send stream done message to user
    await send_to_user(ws, ReplyEvent(done=True))

    session.chat_history.extend(result.new_messages())
    session.chat_history = session.chat_history[-20:]
    session.cur_query = query

    await save_session(session)


async def send_to_user(ws: WebSocket, response: ChatEvent):
    await ws.send_json(response.model_dump(by_alias=True))


async def send_error(ws: WebSocket, detail: str, code: str):
    await send_to_user(ws, ErrorEvent(detail=detail, code=code))


async def save_session(session: Session):
    try:
        await redis.setex(
            _skey(session.id),
            60 * 60 * 24,
            session.model_dump_json(by_alias=True),
        )
    except Exception as e:
        logfire.error(f"Error saving session: {e}")


def _skey(sid: str) -> str:
    """Redis key for session"""
    return f"session:{sid}"


@web_app.get("/api/healthz")
async def healthz():
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
