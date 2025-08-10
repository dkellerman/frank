import asyncio
from collections.abc import AsyncGenerator
from typing import Any, Dict

import os
import sys
from pathlib import Path
import types

import pytest
from fastapi.testclient import TestClient

# Ensure project root is on sys.path so `import main` works
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


# Pre-inject a minimal stub for frank.agents before importing main to avoid model provider init
async def _preimport_stub_stream_agent_response(*args: Any, **kwargs: Any):
    # simple async generator that yields two chunks and calls on_done if provided
    on_done = kwargs.get("on_done")
    yield "Hello"
    yield " world"
    if on_done is not None:
        await on_done(types.SimpleNamespace(prompt="hi", model="stub-model", result=None), types.SimpleNamespace(new_messages=lambda: []))

_fake_agents_mod = types.ModuleType("frank.agents")
setattr(_fake_agents_mod, "stream_agent_response", _preimport_stub_stream_agent_response)
sys.modules.setdefault("frank.agents", _fake_agents_mod)

from main import app as fastapi_app  # noqa: E402
from frank.schemas import AgentQuery  # noqa: E402

# --- Fake Redis (async) ---

class FakeRedis:
    def __init__(self):
        self._store: Dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def setex(self, key: str, ttl_seconds: int, value: str) -> None:  # noqa: ARG002
        self._store[key] = value


@pytest.fixture(autouse=True)
def _mock_redis(monkeypatch: pytest.MonkeyPatch) -> None:
    fake = FakeRedis()

    def _get_redis() -> FakeRedis:  # type: ignore[override]
        return fake

    import frank.core.redis as redis_module
    import frank.ws as ws_module

    # Clear cache on original function if present, then patch in both modules
    try:
        redis_module.get_redis.cache_clear()  # type: ignore[attr-defined]
    except Exception:
        pass

    monkeypatch.setattr(redis_module, "get_redis", _get_redis, raising=True)
    monkeypatch.setattr(ws_module, "get_redis", _get_redis, raising=True)


# --- Stub agent streaming ---

class _FakeResult:
    def new_messages(self) -> list[Any]:  # minimal to satisfy handler
        return []


async def _stub_stream_agent_response(
    prompt: str,
    model: str = "stub-model",
    history: list[Any] | None = None,
    on_done: Any | None = None,
) -> AsyncGenerator[str, None]:
    del history
    # Yield a couple of chunks to simulate streaming
    yield "Hello"
    yield " world"
    if on_done is not None:
        await on_done(AgentQuery(prompt=prompt, model=model, result=None), _FakeResult())


@pytest.fixture(autouse=True)
def _mock_agent_stream(monkeypatch: pytest.MonkeyPatch) -> None:
    import frank.agents as agents_module
    import frank.ws as ws_module

    async def _gen(*args: Any, **kwargs: Any):  # wrapper to return async generator
        async for chunk in _stub_stream_agent_response(*args, **kwargs):
            yield chunk

    # Patch both the source module and the place where it was imported
    monkeypatch.setattr(agents_module, "stream_agent_response", _gen, raising=True)
    monkeypatch.setattr(ws_module, "stream_agent_response", _gen, raising=True)


@pytest.fixture()
def app():
    return fastapi_app


@pytest.fixture()
def client(app) -> TestClient:  # type: ignore[override]
    return TestClient(app)