from datetime import datetime
import uuid
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from frank.core.db import Base


class BaseModel(Base):
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(BaseModel):
    __tablename__ = "users"

    tokens: Mapped[list["AuthToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class AuthToken(BaseModel):
    __tablename__ = "auth_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        sa.Uuid(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    token: Mapped[str] = mapped_column(sa.String(64), unique=True, index=True)
    expires_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True))

    user: Mapped[User] = relationship(back_populates="tokens")
