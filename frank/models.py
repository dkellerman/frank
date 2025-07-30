from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    direct: bool = False


class ChatResponse(BaseModel):
    text: str = ""
    done: bool = False


ChatEvent = ChatResponse | ChatRequest
