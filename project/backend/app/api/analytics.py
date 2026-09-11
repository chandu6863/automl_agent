from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.dataset import Dataset
from app.models.experiment import Experiment, ExperimentStatus, ModelResult
from app.models.user import User

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/summary")
def get_analytics_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    datasets = db.query(Dataset).filter(Dataset.owner_id == current_user.id).all()
    experiments = (
        db.query(Experiment)
        .filter(Experiment.user_id == current_user.id)
        .order_by(Experiment.started_at.desc())
        .all()
    )
    results = (
        db.query(ModelResult)
        .join(Experiment, ModelResult.experiment_id == Experiment.id)
        .filter(Experiment.user_id == current_user.id)
        .all()
    )

    model_wins = Counter(
        model.model_name
        for experiment in experiments
        for model in experiment.model_results
        if model.id == experiment.best_model_result_id
    )
    task_counts = Counter(experiment.task_type for experiment in experiments)
    metric_values = [
        float(value)
        for result in results
        for key, value in result.metrics_json.items()
        if key in {"accuracy", "f1", "r2"} and isinstance(value, (int, float))
    ]

    return {
        "datasets": {"total": len(datasets), "modeled": sum(bool(dataset.target_column) for dataset in datasets)},
        "experiments": {
            "total": len(experiments),
            "completed": sum(experiment.status == ExperimentStatus.COMPLETED for experiment in experiments),
            "task_breakdown": dict(task_counts),
        },
        "models": {
            "evaluated": len(results),
            "average_training_time_ms": round(sum(result.training_time_ms for result in results) / len(results), 1) if results else 0,
            "best_model_wins": dict(model_wins),
            "average_primary_score": round(sum(metric_values) / len(metric_values), 4) if metric_values else None,
        },
        "recent_experiments": [
            {
                "id": experiment.id,
                "task_type": experiment.task_type,
                "target_column": experiment.target_column,
                "status": experiment.status.value,
                "started_at": experiment.started_at,
                "best_model": next(
                    (model.model_name for model in experiment.model_results if model.id == experiment.best_model_result_id),
                    None,
                ),
            }
            for experiment in experiments[:5]
        ],
    }
