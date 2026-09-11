from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.dataset import Dataset
from app.models.user import ExpertiseLevel, User

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])


class AgentMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class AgentMessageResponse(BaseModel):
    reply: str
    intent: str
    expertise_level: ExpertiseLevel
    suggestions: list[str]
    dataset_count: int


def classify_intent(message: str) -> str:
    text = message.lower()
    if any(word in text for word in ("verify", "integrity", "hash", "tamper")):
        return "VERIFY_DATASET"
    if any(word in text for word in ("profile", "missing", "columns", "dataset")):
        return "PROFILE_DATASET"
    if any(word in text for word in ("model", "train", "predict", "automl")):
        return "BUILD_MODEL"
    if any(word in text for word in ("explain", "meaning", "understand")):
        return "EXPLAIN_RESULTS"
    return "GENERAL_GUIDANCE"


def shape_reply(intent: str, level: ExpertiseLevel, dataset_count: int) -> tuple[str, list[str]]:
    if intent == "VERIFY_DATASET":
        reply = "Your dataset integrity can be checked from its detail page. The check recomputes the stored file hash and compares it with the registered record."
        suggestions = ["Show my datasets", "How does verification work?"]
    elif intent == "PROFILE_DATASET":
        reply = f"You have {dataset_count} dataset{'s' if dataset_count != 1 else ''}. Open a dataset to inspect row counts, column types, missing values, candidate targets, and duplicate rows."
        suggestions = ["Help me choose a target", "Check dataset integrity"]
    elif intent == "BUILD_MODEL":
        reply = "The next step is to select a dataset and target column. AutoML execution is the next engine milestone; this workspace is ready to guide that flow."
        suggestions = ["How should I choose a target?", "Profile my dataset"]
    elif intent == "EXPLAIN_RESULTS":
        reply = "Results explanations will use the same experiment data at every expertise level, with more technical detail revealed as your workspace mode increases."
        suggestions = ["What is my workspace level?", "Verify a dataset"]
    else:
        reply = "I can help you inspect datasets, check integrity, choose a target, or prepare a modeling workflow. Tell me what you want to do next."
        suggestions = ["Profile my datasets", "Build a model", "Verify dataset integrity"]

    if level == ExpertiseLevel.BEGINNER:
        reply = reply.split(" The next step")[0] if intent == "BUILD_MODEL" else reply
    elif level == ExpertiseLevel.EXPERT:
        reply += " For reproducibility, keep the dataset version and SHA-256 hash attached to any future experiment."
    return reply, suggestions


@router.post("/message", response_model=AgentMessageResponse)
def send_message(
    payload: AgentMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AgentMessageResponse:
    intent = classify_intent(payload.message)
    dataset_count = db.query(Dataset).filter(Dataset.owner_id == current_user.id).count()
    reply, suggestions = shape_reply(intent, current_user.expertise_level, dataset_count)
    return AgentMessageResponse(
        reply=reply,
        intent=intent,
        expertise_level=current_user.expertise_level,
        suggestions=suggestions,
        dataset_count=dataset_count,
    )