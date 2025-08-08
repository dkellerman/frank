import json
import uuid
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
    Chat,
    NewChatEvent,
    NewChatAckEvent,
)


IGNORE_ERRORS = {
    "Cannot call 'receive' once a disconnect message has been received",
}


router = APIRouter()


@router.websocket("/ws/chat")
async def chat_ws(ws: WebSocket):
    await ws.accept()
    logfire.info("WebSocket connected")

    chat: Chat | None = None

    try:
        while True:
            data = await ws.receive_text()
            if data:
                try:
                    event = pydantic.TypeAdapter(ChatEvent).validate_python(
                        json.loads(data)
                    )

                    if not chat and event.type not in (
                        EventType.INITIALIZE,
                        EventType.NEW_CHAT,
                    ):
                        await send_error(ws, "No chat initialized", "no_chat")
                        return

                except pydantic.ValidationError as e:
                    logfire.info(f"Message validation error: {e}")
                    await send_error(ws, f"Error: {e}", "validation_error")
                    continue

                if event.type == EventType.INITIALIZE:
                    chat = await handle_initialize(ws, event)

                elif event.type == EventType.NEW_CHAT:
                    await handle_new_chat(ws, event)

                elif event.type == EventType.SEND:
                    if chat is None:
                        await send_error(ws, "No chat initialized", "no_chat")
                        return
                    await handle_send(ws, event, chat)

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


async def handle_initialize(ws: WebSocket, event: InitializeEvent) -> Chat | None:
    chat: Chat | None = None
    if event.chat_id:
        chat = await load_chat(event.chat_id)

    await send_to_user(ws, event)
    if chat and chat.pending and chat.cur_query:
        await stream_response(ws, chat.cur_query, chat)
    return chat


async def handle_new_chat(ws: WebSocket, event: NewChatEvent):
    chat_id = str(uuid.uuid4())
    chat = Chat(id=chat_id, pending=True)
    chat.cur_query = AgentQuery(prompt=event.message, model=event.model)
    await save_chat(chat)
    await send_to_user(ws, NewChatAckEvent(chatId=chat_id))


async def handle_send(ws: WebSocket, event: SendEvent, chat: Chat | None):
    if chat is None:
        await send_error(ws, "No chat initialized", "no_chat")
        return

    async def _on_done(query: AgentQuery, result: StreamedRunResult):
        await handle_agent_done(ws, query, result, chat)

    async for chunk in stream_agent_response(
        event.message,
        model=event.model,
        history=chat.history,
        on_done=_on_done,
    ):
        await send_to_user(ws, ReplyEvent(text=chunk, done=False))


async def handle_agent_done(
    ws: WebSocket,
    query: AgentQuery,
    result: StreamedRunResult,
    chat: Chat,
):
    logfire.info(f"\n\n*** Agent query: {query.model_dump_json()}")
    await send_to_user(ws, ReplyEvent(done=True))
    chat.history.extend(result.new_messages())
    chat.history = chat.history[-20:]
    chat.cur_query = query
    chat.pending = False
    await save_chat(chat)


async def send_to_user(ws: WebSocket, response: ChatEvent):
    await ws.send_json(response.model_dump(by_alias=True))


async def send_error(ws: WebSocket, detail: str, code: str):
    await send_to_user(ws, ErrorEvent(detail=detail, code=code))


async def save_chat(chat: Chat):
    redis = get_redis()
    try:
        await redis.setex(
            _skey(chat.id),
            60 * 60 * 24,
            chat.model_dump_json(by_alias=True),
        )
    except Exception as e:
        logfire.error(f"Error saving session: {e}")


def _skey(sid: str) -> str:
    return f"chat:{sid}"


async def load_chat(chat_id: str) -> Chat | None:
    redis = get_redis()
    chat_data = await redis.get(_skey(chat_id))
    return Chat.model_validate_json(chat_data) if chat_data else None


async def stream_response(ws: WebSocket, query: AgentQuery, chat: Chat):
    async def _on_done(q: AgentQuery, result: StreamedRunResult):
        await handle_agent_done(ws, q, result, chat)

    async for chunk in stream_agent_response(
        query.prompt,
        model=query.model,
        history=chat.history,
        on_done=_on_done,
    ):
        await send_to_user(ws, ReplyEvent(text=chunk, done=False))
