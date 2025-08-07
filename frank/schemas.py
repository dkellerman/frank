from pydantic import BaseModel, Field, Discriminator
from pydantic_ai.messages import ModelMessage
from typing import Annotated, Literal
import enum


class AgentQuery(BaseModel):
    prompt: str
    model: str
    result: str | None = None


class Session(BaseModel):
    id: str
    chat_history: list[ModelMessage] = Field(default_factory=list, alias="chatHistory")
    cur_query: AgentQuery | None = Field(default=None, alias="curQuery")

    class Config:
        arbitrary_types_allowed = True
        extra = "forbid"


class EventType(str, enum.Enum):
    INITIALIZE = "initialize"
    SEND = "send"
    REPLY = "reply"
    ERROR = "error"


class InitializeEvent(BaseModel):
    type: Literal[EventType.INITIALIZE] = EventType.INITIALIZE
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
    InitializeEvent | SendEvent | ReplyEvent | ErrorEvent,
    Discriminator("type"),
]
