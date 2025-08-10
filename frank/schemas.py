from pydantic import BaseModel, Field, Discriminator
from pydantic_ai.messages import ModelMessage
from typing import Annotated, Literal
import enum


class ChatModel(BaseModel):
    id: str
    label: str
    is_default: bool = Field(default=False, alias="isDefault")


class AgentQuery(BaseModel):
    prompt: str
    model: str
    result: str | None = None


class Chat(BaseModel):
    id: str
    history: list[ModelMessage] = Field(default_factory=list, alias="history")
    cur_query: AgentQuery | None = Field(default=None, alias="curQuery")
    pending: bool = False

    class Config:
        arbitrary_types_allowed = True
        extra = "forbid"


class EventType(str, enum.Enum):
    INITIALIZE = "initialize"
    INITIALIZE_ACK = "initialize_ack"
    SEND = "send"
    NEW_CHAT = "new_chat"
    NEW_CHAT_ACK = "new_chat_ack"
    REPLY = "reply"
    ERROR = "error"


class InitializeEvent(BaseModel):
    type: Literal[EventType.INITIALIZE] = EventType.INITIALIZE
    chat_id: str | None = Field(default=None, alias="chatId")


class InitializeAckEvent(BaseModel):
    type: Literal[EventType.INITIALIZE_ACK] = EventType.INITIALIZE_ACK
    chat_id: str | None = Field(default=None, alias="chatId")
    models: list[ChatModel]


class SendEvent(BaseModel):
    type: Literal[EventType.SEND] = EventType.SEND
    chat_id: str = Field(alias="chatId")
    message: str
    model: str | None


class NewChatEvent(BaseModel):
    type: Literal[EventType.NEW_CHAT] = EventType.NEW_CHAT
    message: str
    model: str


class NewChatAckEvent(BaseModel):
    type: Literal[EventType.NEW_CHAT_ACK] = EventType.NEW_CHAT_ACK
    chat_id: str = Field(alias="chatId")


class ReplyEvent(BaseModel):
    type: Literal[EventType.REPLY] = EventType.REPLY
    text: str = ""
    done: bool = False


class ErrorEvent(BaseModel):
    type: Literal[EventType.ERROR] = EventType.ERROR
    code: str
    detail: str


ChatEvent = Annotated[
    InitializeEvent
    | InitializeAckEvent
    | NewChatEvent
    | NewChatAckEvent
    | SendEvent
    | ReplyEvent
    | ErrorEvent,
    Discriminator("type"),
]
