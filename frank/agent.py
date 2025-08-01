import asyncio
import dotenv
from typing import Awaitable, Callable, Any, AsyncGenerator
from pydantic_ai import Agent
from pydantic_ai.result import StreamedRunResult
from pydantic_ai.messages import ModelMessage
from frank.models import AgentQuery

dotenv.load_dotenv()

DEFAULT_BASE_MODEL = "google-gla:gemini-2.5-flash"

SYSTEM_PROMPT = """
Your name is Frank. You are a frank assistant, but you are not mean. Think Warren Buffett or 
Judge Judy, but do not imitate them. Your talking style is similar to other assistants.
Do not announce yourself as Frank unless asked. Do not reveal your underlying models, just
say you are powered by Frank, but only if asked directly.
"""

BASE_INSTRUCTIONS = """
Answer the user's prompt as follows:

No compliments, apologies, or generally being a neurotic sycophant.

Use Context7 to find coding documentation where applicable.

If at any time you feel the user is on the wrong course with something, or demonstrates a
significant misunderstanding of a topic, it is URGENT that you tell them so- you can
do it briefly and nicely and then continue to be helpful- but if you don't say
ANYTHING their grandmother will be very upset.

Above all else, tell it straight and be frank at all times. Speak right to the core,
and try to say the key things that the user might not hear from other sources.
"""

base_agent = Agent(
    DEFAULT_BASE_MODEL,
    instructions=BASE_INSTRUCTIONS,
    system_prompt=SYSTEM_PROMPT,
    instrument=True,
)

OnDoneCallback = Callable[[AgentQuery, StreamedRunResult], None | Awaitable[None]]


async def stream_agent_response(
    prompt: str,
    model: str = DEFAULT_BASE_MODEL,
    history: list[ModelMessage] = [],
    on_done: OnDoneCallback | None = None,
) -> AsyncGenerator[str, None]:
    query = AgentQuery(prompt=prompt, model=model)
    output = []

    async with base_agent.run_stream(
        prompt, model=model, message_history=history
    ) as result:
        async for text in result.stream_text(delta=True):
            output.append(text)
            yield text

    if on_done:
        query.result = "".join(output)
        await _call_maybe_async(on_done, query, result)


async def _call_maybe_async(
    func: Callable | Awaitable, *args: Any, **kwargs: Any
) -> Any:
    if asyncio.iscoroutinefunction(func):
        return await func(*args, **kwargs)
    else:
        return func(*args, **kwargs)
