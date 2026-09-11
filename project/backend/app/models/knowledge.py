import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class MemoryType(str, enum.Enum):
    RECOMMENDATION = "RECOMMENDATION"
    PREFERENCE = "PREFERENCE"
    PAST_DECISION = "PAST_DECISION"


class ConversationRole(str, enum.Enum):
    USER = "USER"
    AGENT = "AGENT"


class KnowledgeMemory(Base):
    __tablename__ = "knowledge_memory"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    dataset_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("datasets.id"), nullable=True)
    memory_type: Mapped[MemoryType] = mapped_column(Enum(MemoryType), nullable=False)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class AgentConversation(Base):
    __tablename__ = "agent_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    session_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    role: Mapped[ConversationRole] = mapped_column(Enum(ConversationRole), nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    related_experiment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("experiments.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
