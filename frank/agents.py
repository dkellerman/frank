from typing import Awaitable, Callable, AsyncGenerator
from cachetools import LRUCache, cached
from openai import AsyncOpenAI
from pydantic_ai import Agent
from pydantic_ai.messages import ModelMessage
from pydantic_ai.result import StreamedRunResult
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from frank.core.config import settings
from frank.prompts import SYSTEM_PROMPT
from frank.schemas import AgentQuery, ChatModel


# openrouter models
MODELS = [
    ChatModel(id="google/gemini-3-flash-preview", label="Gemini 3 Flash"),
    ChatModel(id="openai/gpt-5.2", label="GPT-5.2"),
    ChatModel(id="anthropic/claude-sonnet-4.5", label="Claude Sonnet 4.5"),
    ChatModel(id="x-ai/grok-4.1-fast", label="Grok 4.1 Fast"),
    ChatModel(id="deepseek/deepseek-v3.2", label="DeepSeek V3.2"),
    ChatModel(
        id="meta-llama/llama-4-maverick",
        label="Llama 4 Maverick",
        isDefault=True,
    ),
]

DEFAULT_MODEL = next((m for m in MODELS if m.is_default), MODELS[0])

base_agent = Agent(instrument=True)


@cached(cache=LRUCache(maxsize=32))
def get_model(slug: str) -> OpenAIModel:
    client = AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url="https://openrouter.helicone.ai/api/v1",
        default_headers={
            "Helicone-Auth": f"Bearer {settings.HELICONE_API_KEY}",
            "X-Title": "Frank",
            "HTTP-Referer": (
                "https://frank.xfr.llc"
                if settings.APP_ENV == "production"
                else "https://frankdev.xfr.llc"
            ),
        },
    )
    return OpenAIModel(
        slug,
        provider=OpenAIProvider(openai_client=client),
    )


@base_agent.system_prompt
def base_agent_system_prompt() -> str:
    return SYSTEM_PROMPT


OnDoneCallback = Callable[[AgentQuery, StreamedRunResult], Awaitable[None]]


async def stream_agent_response(
    prompt: str,
    model: str = DEFAULT_MODEL.id,
    history: list[ModelMessage] = None,
    on_done: OnDoneCallback | None = None,
) -> AsyncGenerator[str, None]:
    if model not in {m.id for m in MODELS}:
        model = DEFAULT_MODEL.id

    query = AgentQuery(prompt=prompt, model=model)
    output = []

    async with base_agent.run_stream(
        prompt,
        message_history=history or [],
        model=get_model(model),
    ) as result:
        async for text in result.stream_text(delta=True):
            output.append(text)
            yield text

    if on_done:
        query.result = "".join(output)
        await on_done(query, result)
