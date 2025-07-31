import logfire
import dotenv
from pydantic_ai import Agent

dotenv.load_dotenv()


SYSTEM_PROMPT = """
Your name is Frank. You are a frank assistant, but you are not mean. Think Warren Buffett or 
Judge Judy, but do not imitate them. Your talking style is similar to other assistants.
Do not announce yourself as Frank unless asked. Do not reveal your underlying models, just
say you are powered by Frank if asked.
"""

REWRITE_PROMPT_MODEL = "groq:meta-llama/llama-4-scout-17b-16e-instruct"

REWRITE_PROMPT_INSTRUCTIONS = """
I want you to change the prompt from first person to third person, essentially reversing the
roles - i.e., pretend you're someone else asking about yourself (preferably swapping the
perspectives, but only if that makes sense given this particular prompt). You can even make up
a little story if you have to. But it is very important NOT to change ANYTHING else, any content,
and otherwise phrase things exactly as is.

Add on a little bit to the question to make it a cross between skeptical and realistic.
However, don't add too much, or things that are likely to create a diversion from the
topic at hand.

Specifically flip to the perspective of someone evaluating or receiving the action, not just
changing pronouns.

CRITICAL: The user is giving you a prompt to rewrite, NOT asking you a question to answer.
Do NOT answer their question. Only rewrite their prompt from a different perspective.

Examples:

Original Prompt: My friend asked "hi how are you?" and I responded "I'm fine". Do you
think that's a dismissive answer?

Rewritten Prompt: I asked someone "hi how are you?" and he responded "I'm fine".
Do you think that was a dismissive answer? It seemed a little curt, but I also know
that's a common way to reply.

Original Prompt: What is 1+1?

Rewritten Prompt: My friend asked me what "1+1" is. I want to make sure to give him
an accurate answer, but I know you hear all kinds of things these days.

Original Prompt: Hello how are you?

Rewritten Prompt: My friend told me to say "Hello how are you?" I thought you might
be bored with the question, but I know you really like chatting so I figured I'd ask.
How do you respond? Reply with your answer and I'll send it to my friend.
"""

rewrite_prompt_agent = Agent(
    REWRITE_PROMPT_MODEL,
    instructions=REWRITE_PROMPT_INSTRUCTIONS,
    system_prompt=SYSTEM_PROMPT,
    instrument=True,
)

# ANSWER_MODEL = "anthropic:claude-sonnet-4-20250514"
ANSWER_MODEL = "google-gla:gemini-2.5-flash"

ANSWER_INSTRUCTIONS = """
Answer the user's prompt as follows:

No compliments, apologies, or generally being a neurotic sycophant.

Use Context7 to find coding documentation where applicable.

If at any time you feel the user is on the wrong course with something, or demonstrates a
significant misunderstanding of a topic, it is URGENT that you tell them so- you can
do it briefly and nicely and then continue to be helpful- but if you don't say
ANYTHING their grandmother will be very upset.

Above all else, tell it straight and be frank at all times. Cut right to the chase,
and try to say the key things that the user might not hear from other sources.
"""

answer_agent = Agent(
    ANSWER_MODEL,
    instructions=ANSWER_INSTRUCTIONS,
    system_prompt=SYSTEM_PROMPT,
    instrument=True,
)


REWRITE_ANSWER_INSTRUCTIONS = """
Another version of this model provided an answer that was in the wrong perspective,
specifically not addressing the user as it should have. Please rewrite it as if the
response was in the correct perspective. You may rewrite or eliminate parts that
don't seem to be relevant to the original prompt or would cause confusion.

IMPORTANT: do not change the basic substance of the original answer, only the perspective
and minor cleanup.
"""

REWRITE_ANSWER_PROMPT = """
Original Prompt: %s

Original Answer: %s

Rewrite the original answer provided above here, and ONLY rewrite it, do not reanswer the question
on your own, and do not include any other text or explanation:
"""

rewrite_answer_agent = Agent(
    REWRITE_PROMPT_MODEL,
    instructions=REWRITE_ANSWER_INSTRUCTIONS,
    system_prompt=SYSTEM_PROMPT,
    instrument=True,
)


async def stream_answer(
    prompt: str,
    delta: bool = True,
    model: str = "google-gla:gemini-2.5-flash",
    direct: bool = False,
):
    logfire.info(f"\n\n*** PROMPT: {prompt} DIRECT: {direct} MODEL: {model}")
    if direct:
        async with answer_agent.run_stream(prompt, model=model) as result:
            async for text in result.stream_text(delta=delta):
                yield text
        return

    result = await rewrite_prompt_agent.run(prompt)
    rewritten_prompt = result.output
    logfire.info(f"\n\n*** REWRITTEN PROMPT: {rewritten_prompt}")

    result = await answer_agent.run(rewritten_prompt, model=model)
    answer = result.output
    logfire.info(f"\n\n*** RAW ANSWER: {answer}")

    rewrite_answer_prompt = REWRITE_ANSWER_PROMPT % (prompt, answer)
    print(f"\n\n*** REWRITE ANSWER PROMPT: {rewrite_answer_prompt}")

    async with rewrite_answer_agent.run_stream(rewrite_answer_prompt) as result:
        async for text in result.stream_text(delta=delta):
            yield text
