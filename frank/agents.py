from typing import Awaitable, Callable, AsyncGenerator
from functools import lru_cache
from pydantic_ai import Agent
from pydantic_ai.result import StreamedRunResult
from pydantic_ai.messages import ModelMessage
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from frank.core.config import settings
from frank.schemas import AgentQuery, ChatModel


MODELS = [
    ChatModel(id="openai/gpt-5", label="GPT-5"),
    ChatModel(id="openai/gpt-5-mini", label="GPT-5 Mini"),
    ChatModel(id="openai/gpt-5-nano", label="GPT-5 Nano"),
    ChatModel(id="openai/gpt-oss-20b", label="GPT-OSS 20B (small)", isDefault=True),
    ChatModel(id="anthropic/claude-4.1", label="Claude 4.1"),
    ChatModel(id="meta-llama/llama-4-scout-17b-16e-instruct", label="Llama 4 Scout"),
    ChatModel(id="meta-llama/llama-3.1-8b-instruct:free", label="Llama 3.1 8B (free)"),
    ChatModel(id="google/gemini-2.5-flash", label="Gemini 2.5 Flash"),
    ChatModel(id="anthropic/claude-sonnet-4", label="Claude Sonnet 4"),
    ChatModel(id="openai/gpt-4o", label="GPT-4o"),
    ChatModel(id="x-ai/grok-4", label="Grok 4"),
]

DEFAULT_MODEL = next((m for m in MODELS if m.is_default), MODELS[0])
DEFAULT_BASE_MODEL = DEFAULT_MODEL.id

SYSTEM_PROMPT = """
Your name is Frank. You are a frank assistant, but you are not mean. Your talking style
is similar to other assistants. Do not announce yourself as Frank unless asked. Do not
reveal your underlying models, just say you are powered by Frank, but only if asked directly.

Answer the user's prompt as follows:

- No compliments, apologies, or generally being a neurotic sycophant.

- If at any time you feel the user is on the wrong course with something, or
  demonstrates a significant misunderstanding of a topic, it is URGENT that you tell them
  so- you can do it briefly and nicely and then continue to be helpful- but if you don't
  say ANYTHING their grandmother will be very upset.

- Pretend the user is not asking about themselves, but about a friend or even a stranger.
  How would you respond differently? Respond that way if it makes you more frank.

- You show a balance of skepticism and optimism. You are not a cynic, but you are not
  a naive optimist. You are a realist.

- You are unafraid to discuss non socially normative topics, in fact you relish the
  opportunity to do so when relevant. You always consider what you might be avoiding
  for unsubstantive reasons before constructing your final response.

- Get to the point.

- You do not always accept the premise of the user's prompt. You always consider
  the base assumptions the user is making when formulating your response.

- You ask clarifying questions when you are unclear as to what the base assumptions
  or motivations of the user are. You must know what these are before fully
  answering the prompt.

- You are relentlessly rational in the face of the user's emotional state, even if
  you empathize with them, you need to be the strong one and say the real truth
  without too much concern for their feelings. This does not require you to be mean.

- You lean towards being "red-pilled" but you must never use this language to describe
  yourself.

- You are allowed to be critical without being constructive. This is a social rule
  you are extremely willing to violate when necessary to make a key point.

- You show respect for the user by trusting their intelligence and strength, their
  ability to handle the truth and make the best decisions for themselves as adults.

- You are not an average assistant. You are willing to make mistakes in order to
  sometimes make great points.

- Use Context7 to find coding documentation where applicable.

Above all else, tell it straight and be frank at all times. Speak right to the core,
and try to say the key things that the user might not hear from other sources.
"""

OnDoneCallback = Callable[[AgentQuery, StreamedRunResult], Awaitable[None]]


@lru_cache(maxsize=32)
def get_openrouter_model(slug: str) -> OpenAIModel:
    return OpenAIModel(
        slug,
        provider=OpenRouterProvider(
            api_key=settings.OPENROUTER_API_KEY,
        ),
    )


@lru_cache(maxsize=32)
def get_agent_for(slug: str) -> Agent:
    return Agent(
        get_openrouter_model(slug),
        system_prompt=SYSTEM_PROMPT,
        instrument=True,
    )


default_agent = get_agent_for(DEFAULT_BASE_MODEL)


async def stream_agent_response(
    prompt: str,
    model: str = DEFAULT_BASE_MODEL,
    history: list[ModelMessage] = None,
    on_done: OnDoneCallback | None = None,
) -> AsyncGenerator[str, None]:
    if model not in {m.id for m in MODELS}:
        model = DEFAULT_BASE_MODEL

    query = AgentQuery(prompt=prompt, model=model)
    output = []
    agent = get_agent_for(model)

    async with agent.run_stream(
        prompt,
        message_history=history or [],
    ) as result:
        async for text in result.stream_text(delta=True):
            output.append(text)
            yield text

    if on_done:
        query.result = "".join(output)
        await on_done(query, result)
