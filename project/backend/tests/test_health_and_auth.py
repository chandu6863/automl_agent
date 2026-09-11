import io
import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_and_login_flow(client):
    register_resp = client.post(
        "/api/v1/auth/register", json={"email": "student@example.com", "password": "SecurePass123"}
    )
    assert register_resp.status_code == 201
    body = register_resp.json()
    assert body["user"]["email"] == "student@example.com"
    assert body["user"]["expertise_level"] == "BEGINNER"
    assert "access_token" in body

    # Duplicate registration should fail
    dup_resp = client.post(
        "/api/v1/auth/register", json={"email": "student@example.com", "password": "SecurePass123"}
    )
    assert dup_resp.status_code == 409

    login_resp = client.post(
        "/api/v1/auth/login", json={"email": "student@example.com", "password": "SecurePass123"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    me_resp = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "student@example.com"


def test_expertise_level_update(client):
    login_resp = client.post(
        "/api/v1/auth/login", json={"email": "student@example.com", "password": "SecurePass123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.patch(
        "/api/v1/users/me/expertise-level", json={"expertise_level": "EXPERT"}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["expertise_level"] == "EXPERT"


def test_dataset_upload_profile_and_verify(client):
    login_resp = client.post(
        "/api/v1/auth/login", json={"email": "student@example.com", "password": "SecurePass123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    csv_content = (
        "age,income,churn\n"
        "25,50000,No\n"
        "42,72000,Yes\n"
        "31,,No\n"
        "55,98000,Yes\n"
        "29,61000,No\n"
    ).encode()

    files = {"file": ("customers.csv", io.BytesIO(csv_content), "text/csv")}
    upload_resp = client.post("/api/v1/datasets/upload", files=files, headers=headers)
    assert upload_resp.status_code == 201
    upload_body = upload_resp.json()
    assert upload_body["row_count"] == 5
    assert "churn" in upload_body["candidate_target_columns"]
    dataset_id = upload_body["dataset_id"]

    get_resp = client.get(f"/api/v1/datasets/{dataset_id}", headers=headers)
    assert get_resp.status_code == 200
    profile = get_resp.json()["profile"]
    assert profile["missing_by_column"]["income"]["count"] == 1

    history_resp = client.get(f"/api/v1/datasets/{dataset_id}/blockchain", headers=headers)
    assert history_resp.status_code == 200
    assert history_resp.json()["dataset_id"] == dataset_id
    assert len(history_resp.json()["history"]) >= 1

    verify_resp = client.post(f"/api/v1/datasets/{dataset_id}/verify", headers=headers)
    assert verify_resp.status_code == 200
    assert verify_resp.json()["verified"] is True
