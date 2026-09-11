"""
Off-chain dataset storage.

Local-disk implementation for development/demo. Swap this module's functions
for an S3-compatible client in production without touching callers.
"""
from __future__ import annotations

import hashlib
import os
import uuid

from app.core.config import settings

os.makedirs(settings.DATASET_STORAGE_DIR, exist_ok=True)


def save_upload(file_bytes: bytes, original_filename: str) -> str:
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise ValueError(f"Unsupported file extension: {ext}")

    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise ValueError(f"File exceeds max upload size of {settings.MAX_UPLOAD_SIZE_MB}MB")

    stored_name = f"{uuid.uuid4()}{ext}"
    path = os.path.join(settings.DATASET_STORAGE_DIR, stored_name)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path


def compute_sha256(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()
