import json
import uuid
import pydantic
import logfire
from fastapi import WebSocket, WebSocketDisconnect
from pydantic_ai.result import StreamedRunResult
from frank.agents import stream_agent_response, MODELS
from frank.services.chat import ChatService
from frank.services.auth import UserRequired
from frank.schemas import (
    AgentQuery,
    ChatEvent,
    InitializeEvent,
    InitializeAckEvent,
    EventType,
    SendEvent,
    ReplyEvent,
    ErrorEvent,
    Chat,
    NewChatEvent,
    NewChatAckEvent,
)


class ChatWebSocketHandler:
    IGNORE_ERRORS = {
        "Cannot call 'receive' once a disconnect message has been received",
    }

    def __init__(self, ws: WebSocket, user: UserRequired):
        self.ws = ws
        self.user = user
        self.chat: Chat | None = None

    async def run(self):
        await self.ws.accept()
        logfire.info(f"WebSocket connected for user {self.user.id}")

        try:
            while True:
                data = await self.ws.receive_text()
                if not data:
                    continue
                try:
                    # parse event
                    event = pydantic.TypeAdapter(ChatEvent).validate_python(
                        json.loads(data)
                    )

                    if not self.chat and event.type not in (
                        EventType.INITIALIZE,
                        EventType.NEW_CHAT,
                    ):
                        await self.send_error("No chat initialized", "no_chat")
                        return
                except pydantic.ValidationError as e:
                    logfire.info(f"Message validation error: {e}")
                    await self.send_error(f"Error: {e}", "validation_error")
                    continue

                # dispatch to event handler
                if event.type == EventType.INITIALIZE:
                    await self.handle_initialize(event)
                elif event.type == EventType.NEW_CHAT:
                    await self.handle_new_chat(event)
                elif event.type == EventType.SEND:
                    await self.handle_send(event)

        except WebSocketDisconnect:
            logfire.info("WebSocket disconnected")

        except RuntimeError as e:
            if any(ignore in str(e) for ignore in self.IGNORE_ERRORS):
                pass
            else:
                logfire.error(f"Runtime error: {e}")
                raise

    async def handle_initialize(self, event: InitializeEvent):
        chat: Chat | None = None
        if event.chat_id:
            chat = await ChatService.load(event.chat_id)
            if chat and chat.user_id != self.user.id:
                await self.send_error("Access denied", "access_denied")
                return
            self.chat = chat

        # send ack event back to client with models
        ack_event = InitializeAckEvent(chatId=event.chat_id, models=MODELS)
        await self.send_to_user(ack_event)

        # if chat is pending and has a query, stream response
        if chat and chat.pending and chat.cur_query:
            await self.stream_response(chat.cur_query, chat)

    async def handle_new_chat(self, event: NewChatEvent):
        # create/save new chat and send back ack
        chat_id = str(uuid.uuid4())
        chat = Chat(id=chat_id, userId=self.user.id, pending=True)
        chat.cur_query = AgentQuery(prompt=event.message, model=event.model)
        await ChatService.save(chat)

        await self.send_to_user(NewChatAckEvent(chatId=chat_id))

    async def handle_send(self, event: SendEvent):
        """Handle message from the user"""

        if self.chat is None:
            await self.send_error("No chat initialized", "no_chat")
            return

        async def _on_done(query: AgentQuery, result: StreamedRunResult):
            await self.handle_agent_done(query, result, self.chat)

        async for chunk in stream_agent_response(
            event.message,
            model=event.model if event.model else None,
            history=self.chat.history,
            on_done=_on_done,
        ):
            await self.send_to_user(ReplyEvent(text=chunk, done=False))

    async def handle_agent_done(
        self,
        query: AgentQuery,
        result: StreamedRunResult,
        chat: Chat,
    ):
        logfire.info(f"\n\n*** Agent query: {query.model_dump_json()}")

        # send done event to client
        await self.send_to_user(ReplyEvent(done=True))

        # update chat state
        chat.history.extend(result.new_messages())
        chat.history = chat.history[-ChatService.HISTORY_LENGTH :]
        chat.cur_query = query
        chat.pending = False
        await ChatService.save(chat)

    async def send_to_user(self, response: ChatEvent):
        await self.ws.send_json(response.model_dump(by_alias=True))

    async def send_error(self, detail: str, code: str):
        await self.send_to_user(ErrorEvent(detail=detail, code=code))

    async def stream_response(self, query: AgentQuery, chat: Chat):
        async def _on_done(q: AgentQuery, result: StreamedRunResult):
            await self.handle_agent_done(q, result, chat)

        async for chunk in stream_agent_response(
            query.prompt,
            model=query.model,
            history=chat.history,
            on_done=_on_done,
        ):
            await self.send_to_user(ReplyEvent(text=chunk, done=False))
