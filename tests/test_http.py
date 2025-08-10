from fastapi.testclient import TestClient


def test_healthz(client: TestClient):
    resp = client.get("/api/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_get_chat_not_found(client: TestClient):
    resp = client.get("/api/chats/does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Chat not found"