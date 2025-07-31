import enum
from typing import Annotated, Literal
from pydantic import BaseModel, Discriminator, Field


class EventType(str, enum.Enum):
    HELLO = "hello"
    SEND = "send"
    REPLY = "reply"
    ERROR = "error"


class HelloEvent(BaseModel):
    type: Literal[EventType.HELLO] = EventType.HELLO
    session_id: str = Field(alias="sessionId")


class SendEvent(BaseModel):
    type: Literal[EventType.SEND] = EventType.SEND
    message: str
    model: str | None
    direct: bool = False


class ReplyEvent(BaseModel):
    type: Literal[EventType.REPLY] = EventType.REPLY
    text: str = ""
    done: bool = False


class ErrorEvent(BaseModel):
    type: Literal[EventType.ERROR] = EventType.ERROR
    code: str
    detail: str


ChatEvent = Annotated[
    HelloEvent | SendEvent | ReplyEvent | ErrorEvent,
    Discriminator("type"),
]
