"""Tests for async chat title generation."""

import json
import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from pydantic_ai.messages import ModelRequest, ModelResponse, UserPromptPart, TextPart
from frank.schemas import Chat
from frank.services.chat import generate_and_set_title, TITLE_MODEL


def _make_chat_with_history(user_msg: str, assistant_msg: str) -> Chat:
    """Create a Chat with a user+assistant message pair in history."""
    return Chat(
        id=str(uuid.uuid4()),
        userId=str(uuid.uuid4()),
        title=None,
        history=[
            ModelRequest(parts=[UserPromptPart(content=user_msg)]),
            ModelResponse(parts=[TextPart(content=assistant_msg)]),
        ],
    )


class TestTitleExtraction:
    """generate_and_set_title extracts first user/assistant messages."""

    @pytest.mark.asyncio
    @patch("frank.services.chat.get_redis")
    @patch("frank.services.chat.SessionLocal")
    @patch("frank.services.chat.httpx.AsyncClient")
    async def test_extracts_messages_and_calls_api(
        self, mock_client_cls, mock_session_local, mock_redis
    ):
        chat = _make_chat_with_history("How do I cook pasta?", "Boil water first.")
        ws = AsyncMock()

        # mock httpx response
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "Cooking Pasta Basics"}}]
        }
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        # mock DB session
        mock_session = AsyncMock()
        mock_chat_row = MagicMock()
        mock_session.get.return_value = mock_chat_row
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_session_local.return_value = mock_session

        # mock redis
        mock_redis_inst = AsyncMock()
        mock_redis_inst.get.return_value = None
        mock_redis.return_value = mock_redis_inst

        await generate_and_set_title(chat, ws)

        # verify API was called with correct model and prompt
        call_kwargs = mock_client.post.call_args
        body = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
        assert body["model"] == TITLE_MODEL
        prompt_content = body["messages"][0]["content"]
        assert "How do I cook pasta?" in prompt_content
        assert "Boil water first." in prompt_content

    @pytest.mark.asyncio
    @patch("frank.services.chat.get_redis")
    @patch("frank.services.chat.SessionLocal")
    @patch("frank.services.chat.httpx.AsyncClient")
    async def test_sets_title_on_chat_and_db(
        self, mock_client_cls, mock_session_local, mock_redis
    ):
        chat = _make_chat_with_history("Hello", "Hi there!")
        ws = AsyncMock()

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": '"Greeting Exchange"'}}]
        }
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        mock_session = AsyncMock()
        mock_chat_row = MagicMock()
        mock_session.get.return_value = mock_chat_row
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_session_local.return_value = mock_session

        mock_redis_inst = AsyncMock()
        mock_redis_inst.get.return_value = None
        mock_redis.return_value = mock_redis_inst

        await generate_and_set_title(chat, ws)

        # title should be stripped of quotes
        assert chat.title == "Greeting Exchange"
        # DB row should be updated
        assert mock_chat_row.title == "Greeting Exchange"
        mock_session.commit.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("frank.services.chat.get_redis")
    @patch("frank.services.chat.SessionLocal")
    @patch("frank.services.chat.httpx.AsyncClient")
    async def test_sends_title_event_to_websocket(
        self, mock_client_cls, mock_session_local, mock_redis
    ):
        chat = _make_chat_with_history("What is AI?", "Artificial intelligence is...")
        ws = AsyncMock()

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "Understanding AI"}}]
        }
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        mock_session = AsyncMock()
        mock_session.get.return_value = MagicMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_session_local.return_value = mock_session

        mock_redis_inst = AsyncMock()
        mock_redis_inst.get.return_value = None
        mock_redis.return_value = mock_redis_inst

        await generate_and_set_title(chat, ws)

        # verify websocket received the title event
        ws.send_json.assert_awaited_once()
        sent = ws.send_json.call_args[0][0]
        assert sent["type"] == "chat_title"
        assert sent["chatId"] == chat.id
        assert sent["title"] == "Understanding AI"

    @pytest.mark.asyncio
    async def test_skips_when_no_user_message(self):
        chat = Chat(
            id=str(uuid.uuid4()),
            userId=str(uuid.uuid4()),
            title=None,
            history=[],
        )
        ws = AsyncMock()

        await generate_and_set_title(chat, ws)

        # should not have sent anything
        ws.send_json.assert_not_awaited()

    @pytest.mark.asyncio
    @patch("frank.services.chat.get_redis")
    @patch("frank.services.chat.SessionLocal")
    @patch("frank.services.chat.httpx.AsyncClient")
    async def test_does_not_raise_on_api_error(
        self, mock_client_cls, mock_session_local, mock_redis
    ):
        chat = _make_chat_with_history("Hello", "Hi")
        ws = AsyncMock()

        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.raise_for_status.side_effect = Exception("Server error")
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        # should not raise — errors are caught and logged
        await generate_and_set_title(chat, ws)
        ws.send_json.assert_not_awaited()

    @pytest.mark.asyncio
    @patch("frank.services.chat.get_redis")
    @patch("frank.services.chat.SessionLocal")
    @patch("frank.services.chat.httpx.AsyncClient")
    async def test_updates_redis_cache(
        self, mock_client_cls, mock_session_local, mock_redis
    ):
        chat = _make_chat_with_history("Test", "Response")
        ws = AsyncMock()

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": "Test Title"}}]
        }
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        mock_session = AsyncMock()
        mock_session.get.return_value = MagicMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_session_local.return_value = mock_session

        cached_data = json.dumps({"title": None, "id": chat.id})
        mock_redis_inst = AsyncMock()
        mock_redis_inst.get.return_value = cached_data
        mock_redis.return_value = mock_redis_inst

        await generate_and_set_title(chat, ws)

        # redis should have been updated with new title
        mock_redis_inst.setex.assert_awaited_once()
        set_args = mock_redis_inst.setex.call_args[0]
        assert set_args[0] == f"chat:{chat.id}"
        cached = set_args[2]
        assert cached["title"] == "Test Title"


class TestTitleTrigger:
    """The WS handler triggers title generation after first response."""

    @pytest.mark.asyncio
    @patch("frank.ws.generate_and_set_title")
    @patch("frank.ws.save_chat")
    async def test_triggers_title_on_none(self, mock_save, mock_gen_title):
        from frank.ws import ChatWebSocketHandler
        from frank.schemas import AgentQuery, AuthUserOut

        ws = AsyncMock()
        user = AuthUserOut(id=str(uuid.uuid4()))
        handler = ChatWebSocketHandler(ws, user, AsyncMock())

        chat = Chat(id=str(uuid.uuid4()), userId=handler.user.id, title=None)
        query = AgentQuery(prompt="hi", model="test")
        result = MagicMock()
        result.new_messages.return_value = []

        await handler.handle_agent_done(query, result, chat)

        mock_save.assert_awaited_once()
        # asyncio.create_task wraps the coroutine, so generate_and_set_title
        # should have been called
        mock_gen_title.assert_called_once_with(chat, ws)

    @pytest.mark.asyncio
    @patch("frank.ws.generate_and_set_title")
    @patch("frank.ws.save_chat")
    async def test_skips_title_when_already_set(self, mock_save, mock_gen_title):
        from frank.ws import ChatWebSocketHandler
        from frank.schemas import AgentQuery, AuthUserOut

        ws = AsyncMock()
        user = AuthUserOut(id=str(uuid.uuid4()))
        handler = ChatWebSocketHandler(ws, user, AsyncMock())

        chat = Chat(
            id=str(uuid.uuid4()),
            userId=handler.user.id,
            title="Already titled",
        )
        query = AgentQuery(prompt="hi", model="test")
        result = MagicMock()
        result.new_messages.return_value = []

        await handler.handle_agent_done(query, result, chat)

        mock_gen_title.assert_not_called()
