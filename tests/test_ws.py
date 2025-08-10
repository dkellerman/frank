import json
from fastapi.testclient import TestClient


def test_websocket_basic_flow_and_fetch(client: TestClient):
    with client.websocket_connect("/ws/chat") as ws:
        # Start a new chat
        ws.send_text(
            json.dumps({
                "type": "new_chat",
                "message": "hi",
                "model": "stub-model",
            })
        )
        ack = ws.receive_json()
        assert ack["type"] == "new_chat_ack"
        chat_id = ack["chatId"]
        assert isinstance(chat_id, str) and chat_id

        # Initialize with the returned chat id (should echo initialize and then stream)
        ws.send_text(json.dumps({"type": "initialize", "chatId": chat_id}))

        init_resp = ws.receive_json()
        assert init_resp["type"] == "initialize"
        assert init_resp.get("chatId") == chat_id or init_resp.get("chatId") is None

        # Receive streamed chunks
        chunk1 = ws.receive_json()
        assert chunk1["type"] == "reply" and chunk1["done"] is False
        assert chunk1["text"] == "Hello"

        chunk2 = ws.receive_json()
        assert chunk2["type"] == "reply" and chunk2["done"] is False
        assert chunk2["text"] == " world"

        done_msg = ws.receive_json()
        assert done_msg["type"] == "reply" and done_msg["done"] is True

    # After WS completes, the chat should be persisted and fetchable
    resp = client.get(f"/api/chats/{chat_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == chat_id
    assert body["pending"] is False
    assert body["curQuery"] is not None