"""Tests for new chat creation flow.

Verifies that submitting a chat from the home page correctly creates a chat
and returns a NewChatAckEvent with the new chat id.
"""

import json
import uuid
import pytest
import pydantic
from unittest.mock import AsyncMock, patch
from frank.schemas import (
    Chat,
    NewChatEvent,
    AgentQuery,
    ChatEvent,
    EventType,
    AuthUserOut,
)


class TestNewChatCreation:
    """Creating a new Chat without an id (as handle_new_chat does) must work."""

    def test_create_chat_without_id(self):
        """handle_new_chat creates Chat(userId=..., pending=True) with no id."""
        chat = Chat(userId=str(uuid.uuid4()), pending=True)
        assert chat.pending is True

    def test_new_chat_id_is_falsy(self):
        """_create_or_update_chat uses `if chat.id:` to decide whether to
        INSERT or UPDATE — new chats need a falsy id."""
        chat = Chat(userId=str(uuid.uuid4()))
        assert not chat.id


class TestNewChatEventParsing:
    """The WebSocket handler parses incoming JSON through a Pydantic
    discriminated union. The frontend sends model as null when no model
    is selected yet."""

    def test_parse_new_chat_null_model(self):
        """Frontend sends: {type: "new_chat", message: "hi", model: null}"""
        raw = {"type": "new_chat", "message": "hi", "model": None, "ts": "2025-01-01T00:00:00Z"}
        event = pydantic.TypeAdapter(ChatEvent).validate_python(raw)
        assert isinstance(event, NewChatEvent)

    def test_parse_new_chat_with_model(self):
        raw = {"type": "new_chat", "message": "hi", "model": "google/gemini-2.5-flash", "ts": "2025-01-01T00:00:00Z"}
        event = pydantic.TypeAdapter(ChatEvent).validate_python(raw)
        assert isinstance(event, NewChatEvent)
        assert event.model == "google/gemini-2.5-flash"


class TestHandleNewChat:
    """End-to-end: handle_new_chat must create a chat, save it, and ack."""

    @pytest.fixture
    def handler(self):
        from frank.ws import ChatWebSocketHandler

        ws = AsyncMock()
        user = AuthUserOut(id=str(uuid.uuid4()))
        session = AsyncMock()
        return ChatWebSocketHandler(ws, user, session)

    @pytest.mark.asyncio
    @patch("frank.ws.save_chat")
    async def test_handle_new_chat_with_model(self, mock_save, handler):
        fake_id = str(uuid.uuid4())
        mock_save.return_value = fake_id

        event = NewChatEvent(message="hello", model="google/gemini-2.5-flash")
        await handler.handle_new_chat(event)

        mock_save.assert_awaited_once()
        saved_chat = mock_save.call_args[0][0]
        assert isinstance(saved_chat, Chat)
        assert saved_chat.user_id == handler.user.id
        assert saved_chat.cur_query.prompt == "hello"

        handler.ws.send_json.assert_awaited_once()
        ack = handler.ws.send_json.call_args[0][0]
        assert ack["type"] == "new_chat_ack"
        assert ack["chatId"] == fake_id

    @pytest.mark.asyncio
    @patch("frank.ws.save_chat")
    async def test_handle_new_chat_null_model_uses_default(self, mock_save, handler):
        """When frontend sends model: null, should fall back to default model."""
        from frank.agents import DEFAULT_MODEL

        mock_save.return_value = str(uuid.uuid4())

        event = NewChatEvent(message="hello", model=None)
        await handler.handle_new_chat(event)

        saved_chat = mock_save.call_args[0][0]
        assert saved_chat.cur_query.model == DEFAULT_MODEL.id
