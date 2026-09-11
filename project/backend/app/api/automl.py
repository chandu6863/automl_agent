from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.automl.engine import run_baselines
from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.dataset import Dataset, DatasetVersion
from app.models.experiment import Experiment, ExperimentStatus, ModelResult
from app.models.user import User

router = APIRouter(prefix="/api/v1/automl", tags=["automl"])


class RunAutoMLRequest(BaseModel):
    dataset_id: str
    target_column: str = Field(min_length=1, max_length=255)


@router.post("/run", status_code=status.HTTP_201_CREATED)
def run_automl(payload: RunAutoMLRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = db.get(Dataset, payload.dataset_id)
    if not dataset or dataset.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Dataset not found")
    version = db.get(DatasetVersion, dataset.current_version_id) if dataset.current_version_id else None
    if not version:
        raise HTTPException(status_code=400, detail="Dataset has no registered version")
    try:
        result = run_baselines(version.storage_path, payload.target_column)
    except (ValueError, OSError, Exception) as error:
        raise HTTPException(status_code=422, detail=f"AutoML run failed: {error}")

    experiment = Experiment(user_id=current_user.id, dataset_version_id=version.id, task_type=result["task_type"], target_column=payload.target_column, status=ExperimentStatus.COMPLETED, completed_at=datetime.now(timezone.utc))
    db.add(experiment)
    db.flush()
    model_results = []
    for item in result["results"]:
        model_result = ModelResult(experiment_id=experiment.id, model_name=item["model_name"], metrics_json=item["metrics"], training_time_ms=item["training_time_ms"], hyperparameters_json={})
        db.add(model_result)
        model_results.append(model_result)
    db.flush()
    experiment.best_model_result_id = model_results[0].id
    dataset.target_column = payload.target_column
    dataset.task_type = result["task_type"]
    db.commit()
    return {"experiment_id": experiment.id, "dataset_id": dataset.id, "task_type": result["task_type"], "target_column": payload.target_column, "metric": result["metric"], "best_model": {"name": model_results[0].model_name, "metrics": model_results[0].metrics_json}, "models": [{"name": model.model_name, "metrics": model.metrics_json, "training_time_ms": model.training_time_ms} for model in model_results]}


@router.get("/experiments")
def list_automl_experiments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    experiments = db.query(Experiment).filter(Experiment.user_id == current_user.id).order_by(Experiment.started_at.desc()).all()
    return [{"id": experiment.id, "task_type": experiment.task_type, "target_column": experiment.target_column, "status": experiment.status, "started_at": experiment.started_at, "best_model": next((model.model_name for model in experiment.model_results if model.id == experiment.best_model_result_id), None), "models": [{"name": model.model_name, "metrics": model.metrics_json} for model in experiment.model_results]} for experiment in experiments]