import json
import pydantic
import logfire
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic_ai.result import StreamedRunResult
from frank.core.redis import get_redis
from frank.agents import stream_agent_response
from frank.schemas import (
    AgentQuery,
    ChatEvent,
    InitializeEvent,
    EventType,
    SendEvent,
    ReplyEvent,
    ErrorEvent,
    Session,
)


IGNORE_ERRORS = [
    "Cannot call 'receive' once a disconnect message has been received",
]


router = APIRouter()


@router.websocket("/ws/chat")
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
    redis = get_redis()
    session_data = await redis.get(_skey(event.session_id))
    if session_data:
        try:
            session = Session.model_validate_json(session_data)
        except pydantic.ValidationError:
            session = Session.model_validate_json(
                session_data, by_alias=False, by_name=True
            )
            await save_session(session)
    else:
        session = Session(id=event.session_id)
        await save_session(session)

    await send_to_user(ws, event)
    return session


async def handle_send(ws: WebSocket, event: SendEvent, session: Session):
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
    logfire.info(f"\n\n*** Agent query: {query.model_dump_json()}")
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
    redis = get_redis()
    try:
        await redis.setex(
            _skey(session.id),
            60 * 60 * 24,
            session.model_dump_json(by_alias=True),
        )
    except Exception as e:
        logfire.error(f"Error saving session: {e}")


def _skey(sid: str) -> str:
    return f"session:{sid}"
