from typing import Awaitable, Callable, AsyncGenerator
from cachetools.func import LRUCache, TTLCache, cached
from pydantic_ai import Agent
from pydantic_ai.result import StreamedRunResult
from pydantic_ai.messages import ModelMessage
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from promptlayer import PromptLayer
from frank.core.config import settings
from frank.schemas import AgentQuery, ChatModel


# openrouter models
MODELS = [
    ChatModel(id="google/gemini-2.5-flash", label="Gemini 2.5 Flash", isDefault=True),
    ChatModel(id="openai/gpt-5", label="GPT-5"),
    ChatModel(id="openai/gpt-5-mini", label="GPT-5 Mini"),
    ChatModel(id="openai/gpt-5-nano", label="GPT-5 Nano"),
    ChatModel(id="openai/gpt-4o", label="GPT-4o"),
    ChatModel(id="openai/gpt-oss-20b", label="GPT-OSS 20B (small)"),
    ChatModel(id="anthropic/claude-sonnet-4", label="Claude Sonnet 4"),
    ChatModel(id="anthropic/claude-4.1", label="Claude 4.1"),
    ChatModel(id="x-ai/grok-4", label="Grok 4"),
    ChatModel(id="meta-llama/llama-4-scout-17b-16e-instruct", label="Llama 4 Scout"),
    ChatModel(id="meta-llama/llama-3.1-8b-instruct:free", label="Llama 3.1 8B (free)"),
]

DEFAULT_MODEL = next((m for m in MODELS if m.is_default), MODELS[0])

OnDoneCallback = Callable[[AgentQuery, StreamedRunResult], Awaitable[None]]

promptlayer = PromptLayer(api_key=settings.PROMPTLAYER_API_KEY)
base_agent = Agent(instrument=True)


@cached(cache=LRUCache(maxsize=32))
def get_openrouter_model(slug: str) -> OpenAIModel:
    return OpenAIModel(
        slug,
        provider=OpenRouterProvider(api_key=settings.OPENROUTER_API_KEY),
    )


@base_agent.system_prompt
@cached(cache=TTLCache(maxsize=32, ttl=300))
def base_agent_system_prompt():
    return str(promptlayer.templates.get("Frank System Prompt"))


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
        model=get_openrouter_model(model),
    ) as result:
        async for text in result.stream_text(delta=True):
            output.append(text)
            yield text

    if on_done:
        query.result = "".join(output)
        await on_done(query, result)
