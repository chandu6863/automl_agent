from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.automl.profiler import load_dataframe, profile_dataframe
from app.blockchain.service import register_dataset_mock, verify_dataset_mock
from app.core.deps import get_current_user
from app.database.session import get_db
from app.datasets.storage import compute_sha256, save_upload
from app.models.blockchain import BlockchainRecord, ChainAction, ChainStatus
from app.models.dataset import Dataset, DatasetMetadata, DatasetVersion
from app.models.user import User

router = APIRouter(prefix="/api/v1/datasets", tags=["datasets"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()

    try:
        storage_path = save_upload(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    sha256_hash = compute_sha256(file_bytes)

    try:
        df = load_dataframe(storage_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Could not parse dataset: {e}"
        )

    profile = profile_dataframe(df)

    dataset = Dataset(owner_id=current_user.id, name=file.filename)
    db.add(dataset)
    db.flush()  # get dataset.id without committing yet

    version = DatasetVersion(
        dataset_id=dataset.id,
        version_number=1,
        sha256_hash=sha256_hash,
        row_count=profile["row_count"],
        column_count=profile["column_count"],
        storage_path=storage_path,
    )
    db.add(version)
    db.flush()

    metadata = DatasetMetadata(dataset_version_id=version.id, profiling_json=profile)
    db.add(metadata)

    # Register on the (mock) blockchain ledger
    chain_result = register_dataset_mock(dataset.id, sha256_hash, version.version_number)
    blockchain_record = BlockchainRecord(
        dataset_version_id=version.id,
        tx_hash=chain_result["tx_hash"],
        block_number=chain_result["block_number"],
        action=ChainAction.DATASET_REGISTERED,
        chain_status=ChainStatus(chain_result["status"]),
    )
    db.add(blockchain_record)
    db.flush()

    version.blockchain_record_id = blockchain_record.id
    dataset.current_version_id = version.id

    db.commit()
    db.refresh(dataset)

    return {
        "dataset_id": dataset.id,
        "name": dataset.name,
        "version": version.version_number,
        "sha256_hash": sha256_hash,
        "row_count": profile["row_count"],
        "column_count": profile["column_count"],
        "candidate_target_columns": profile["candidate_target_columns"],
        "blockchain_status": blockchain_record.chain_status,
        "note": chain_result["note"],
    }


@router.get("")
def list_datasets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    datasets = db.query(Dataset).filter(Dataset.owner_id == current_user.id).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "task_type": d.task_type,
            "target_column": d.target_column,
            "created_at": d.created_at,
        }
        for d in datasets
    ]


@router.get("/{dataset_id}")
def get_dataset(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    version = db.get(DatasetVersion, dataset.current_version_id) if dataset.current_version_id else None
    metadata = version.metadata_entry if version else None

    return {
        "id": dataset.id,
        "name": dataset.name,
        "target_column": dataset.target_column,
        "task_type": dataset.task_type,
        "current_version": version.version_number if version else None,
        "sha256_hash": version.sha256_hash if version else None,
        "profile": metadata.profiling_json if metadata else None,
    }


@router.get("/{dataset_id}/blockchain")
def get_dataset_blockchain_history(
    dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    versions = (
        db.query(DatasetVersion)
        .filter(DatasetVersion.dataset_id == dataset.id)
        .order_by(DatasetVersion.version_number.asc())
        .all()
    )

    history = []
    for version in versions:
        chain_entries = (
            db.query(BlockchainRecord)
            .filter(BlockchainRecord.dataset_version_id == version.id)
            .order_by(BlockchainRecord.timestamp.asc())
            .all()
        )
        for record in chain_entries:
            history.append(
                {
                    "dataset_version_id": version.id,
                    "version_number": version.version_number,
                    "sha256_hash": version.sha256_hash,
                    "action": record.action.value,
                    "chain_status": record.chain_status.value,
                    "tx_hash": record.tx_hash,
                    "block_number": record.block_number,
                    "timestamp": record.timestamp.isoformat() if record.timestamp else None,
                }
            )

    return {
        "dataset_id": dataset.id,
        "name": dataset.name,
        "current_version": dataset.current_version_id,
        "history": history,
    }


@router.post("/{dataset_id}/verify")
async def verify_dataset(
    dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    dataset = db.get(Dataset, dataset_id)
    if not dataset or dataset.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    version = db.get(DatasetVersion, dataset.current_version_id)
    if not version:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No version registered")

    with open(version.storage_path, "rb") as f:
        current_bytes = f.read()
    current_hash = compute_sha256(current_bytes)

    result = verify_dataset_mock(dataset.id, current_hash, version.sha256_hash)

    verify_record = BlockchainRecord(
        dataset_version_id=version.id,
        action=ChainAction.DATASET_VERIFIED,
        chain_status=ChainStatus.CONFIRMED if result["matches"] else ChainStatus.FAILED,
    )
    db.add(verify_record)
    db.commit()

    return {
        "dataset_id": dataset.id,
        "registered_hash": version.sha256_hash,
        "current_hash": current_hash,
        "verified": result["matches"],
        "note": result["note"],
    }
