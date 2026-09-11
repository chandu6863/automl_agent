import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ChainAction(str, enum.Enum):
    DATASET_REGISTERED = "DATASET_REGISTERED"
    DATASET_VERIFIED = "DATASET_VERIFIED"
    DATASET_REVOKED = "DATASET_REVOKED"


class ChainStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"


class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_version_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("dataset_versions.id"), nullable=False
    )
    tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    block_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    action: Mapped[ChainAction] = mapped_column(Enum(ChainAction), nullable=False)
    chain_status: Mapped[ChainStatus] = mapped_column(
        Enum(ChainStatus), default=ChainStatus.PENDING, nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
