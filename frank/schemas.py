import enum
from datetime import datetime, timezone
from typing import Annotated, Literal
from pydantic_ai.messages import ModelMessage
from pydantic import BaseModel, Field, Discriminator


class ChatModel(BaseModel):
    """LLM model configuration"""

    id: str
    label: str
    is_default: bool = Field(default=False, alias="isDefault")


class AgentQuery(BaseModel):
    prompt: str
    model: str
    result: str | None = None
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Chat(BaseModel):
    id: str
    user_id: str = Field(alias="userId")
    history: list[ModelMessage] = Field(default_factory=list, exclude=True)
    cur_query: AgentQuery | None = Field(default=None, alias="curQuery")
    pending: bool = False
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatEntry(BaseModel):
    """Minimal chat entry for client-side history"""

    role: Literal["user", "assistant"]
    content: str
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserChat(Chat):
    history: list[ChatEntry] = Field(default_factory=list)

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
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InitializeAckEvent(BaseModel):
    type: Literal[EventType.INITIALIZE_ACK] = EventType.INITIALIZE_ACK
    chat_id: str | None = Field(default=None, alias="chatId")
    models: list[ChatModel]
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NewChatEvent(BaseModel):
    type: Literal[EventType.NEW_CHAT] = EventType.NEW_CHAT
    message: str
    model: str
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NewChatAckEvent(BaseModel):
    type: Literal[EventType.NEW_CHAT_ACK] = EventType.NEW_CHAT_ACK
    chat_id: str = Field(alias="chatId")
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SendEvent(BaseModel):
    type: Literal[EventType.SEND] = EventType.SEND
    chat_id: str = Field(alias="chatId")
    message: str
    model: str | None
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReplyEvent(BaseModel):
    type: Literal[EventType.REPLY] = EventType.REPLY
    text: str = ""
    done: bool = False
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorEvent(BaseModel):
    type: Literal[EventType.ERROR] = EventType.ERROR
    code: str
    detail: str
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
