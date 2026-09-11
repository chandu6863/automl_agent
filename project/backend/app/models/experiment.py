import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ExperimentStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class StepName(str, enum.Enum):
    PROFILING = "PROFILING"
    PREPROCESSING = "PREPROCESSING"
    MODEL_SELECTION = "MODEL_SELECTION"
    TRAINING = "TRAINING"
    HPO = "HPO"
    EVALUATION = "EVALUATION"


class StepStatus(str, enum.Enum):
    WAITING = "WAITING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    WARNING = "WARNING"
    FAILED = "FAILED"


class TrialStatus(str, enum.Enum):
    COMPLETE = "COMPLETE"
    PRUNED = "PRUNED"
    FAILED = "FAILED"


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    dataset_version_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("dataset_versions.id"), nullable=False
    )
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_column: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ExperimentStatus] = mapped_column(
        Enum(ExperimentStatus), default=ExperimentStatus.RUNNING, nullable=False
    )
    best_model_result_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("model_results.id", use_alter=True), nullable=True
    )
    random_seed: Mapped[int] = mapped_column(Integer, default=42, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="experiments")
    iterations: Mapped[list["ExperimentIteration"]] = relationship(back_populates="experiment")
    model_results: Mapped[list["ModelResult"]] = relationship(
        back_populates="experiment", foreign_keys="ModelResult.experiment_id"
    )


class ExperimentIteration(Base):
    __tablename__ = "experiment_iterations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id: Mapped[str] = mapped_column(String(36), ForeignKey("experiments.id"), nullable=False)
    step_name: Mapped[StepName] = mapped_column(Enum(StepName), nullable=False)
    status: Mapped[StepStatus] = mapped_column(Enum(StepStatus), default=StepStatus.WAITING, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    log_json: Mapped[dict] = mapped_column(JSON, default=dict)

    experiment: Mapped["Experiment"] = relationship(back_populates="iterations")


class ModelResult(Base):
    __tablename__ = "model_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    experiment_id: Mapped[str] = mapped_column(String(36), ForeignKey("experiments.id"), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hyperparameters_json: Mapped[dict] = mapped_column(JSON, default=dict)
    metrics_json: Mapped[dict] = mapped_column(JSON, default=dict)
    training_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    feature_importance_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confusion_matrix_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    experiment: Mapped["Experiment"] = relationship(
        back_populates="model_results", foreign_keys=[experiment_id]
    )
    trials: Mapped[list["OptunaTrial"]] = relationship(back_populates="model_result")


class OptunaTrial(Base):
    __tablename__ = "optuna_trials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_result_id: Mapped[str] = mapped_column(String(36), ForeignKey("model_results.id"), nullable=False)
    trial_number: Mapped[int] = mapped_column(Integer, nullable=False)
    params_json: Mapped[dict] = mapped_column(JSON, default=dict)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[TrialStatus] = mapped_column(Enum(TrialStatus), default=TrialStatus.COMPLETE)

    model_result: Mapped["ModelResult"] = relationship(back_populates="trials")
