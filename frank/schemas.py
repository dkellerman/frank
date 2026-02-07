import enum
from datetime import datetime, timezone
from typing import Annotated, Literal
from pydantic_ai.messages import ModelMessage
from pydantic import BaseModel, Field, Discriminator


class Chat(BaseModel):
    """Chat session for server"""

    id: str = ""
    user_id: str = Field(alias="userId")
    title: str | None = None
    model: str | None = None
    cur_query: "AgentQuery | None" = Field(default=None, alias="curQuery")
    pending: bool = False
    last_seq: int = Field(default=0, exclude=True, alias="lastSeq")
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt"
    )
    # server-side history has pydantic-ai ModelMessage list, which needs to be
    # serialized to json for storage (using type adapter)
    history: list[ModelMessage] = Field(default_factory=list, exclude=True)


class UserChat(Chat):
    """Chat session for client, with history converted to ChatEntry list"""

    history: list["ChatEntry"] = Field(default_factory=list)

    class Config:
        arbitrary_types_allowed = True
        extra = "forbid"


class ChatEntry(BaseModel):
    """Minimal chat entry for client-side history"""

    role: Literal["user", "assistant"]
    content: str
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatModel(BaseModel):
    """LLM model configuration"""

    id: str
    label: str
    is_default: bool = Field(default=False, alias="isDefault")


class AgentQuery(BaseModel):
    """User query to the agent and result"""

    prompt: str
    model: str
    result: str | None = None
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuthUserOut(BaseModel):
    id: str


class AuthAnonymousResponse(BaseModel):
    user: AuthUserOut
    auth_token: str = Field(alias="authToken")


# --------- Events ---------


class EventType(str, enum.Enum):
    INITIALIZE = "initialize"
    INITIALIZE_ACK = "initialize_ack"
    SEND = "send"
    NEW_CHAT = "new_chat"
    NEW_CHAT_ACK = "new_chat_ack"
    REPLY = "reply"
    ERROR = "error"


class InitializeEvent(BaseModel):
    """Client sends this first to initialize a chat session"""

    type: Literal[EventType.INITIALIZE] = EventType.INITIALIZE
    chat_id: str | None = Field(default=None, alias="chatId")
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InitializeAckEvent(BaseModel):
    """Server sends this to acknowledge the client's initialization request"""

    type: Literal[EventType.INITIALIZE_ACK] = EventType.INITIALIZE_ACK
    chat_id: str | None = Field(default=None, alias="chatId")
    models: list[ChatModel]
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NewChatEvent(BaseModel):
    """Client sends this to start a new chat session"""

    type: Literal[EventType.NEW_CHAT] = EventType.NEW_CHAT
    message: str
    model: str | None = None
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NewChatAckEvent(BaseModel):
    """Server sends this to acknowledge the client's new chat request and
    send the new chat ID"""

    type: Literal[EventType.NEW_CHAT_ACK] = EventType.NEW_CHAT_ACK
    chat_id: str = Field(alias="chatId")
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SendEvent(BaseModel):
    """Client sends this to send a message to the agent"""

    type: Literal[EventType.SEND] = EventType.SEND
    chat_id: str = Field(alias="chatId")
    message: str
    model: str | None
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReplyEvent(BaseModel):
    """Server sends this to reply (partially) to the client's message"""

    type: Literal[EventType.REPLY] = EventType.REPLY
    text: str = ""
    done: bool = False
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorEvent(BaseModel):
    type: Literal[EventType.ERROR] = EventType.ERROR
    code: str
    detail: str
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
