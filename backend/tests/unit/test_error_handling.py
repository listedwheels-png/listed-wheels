import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_standard_error_shape_on_404():
    """Verify that a non-existent route returns standard {code, message} shape."""
    response = client.get("/api/v1/non-existent-endpoint-12345")
    assert response.status_code == 404
    data = response.json()
    assert "code" in data
    assert "message" in data
    assert data["code"] == "HTTP_404"


def test_request_id_and_process_time_headers():
    """Verify that middleware attaches X-Request-ID and X-Process-Time-Ms."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert "x-process-time-ms" in response.headers
    assert float(response.headers["x-process-time-ms"]) >= 0


def test_validation_error_shape():
    """Verify that invalid payload returns {code: VALIDATION_ERROR, message: ...}."""
    response = client.post("/api/v1/auth/google", json={})
    assert response.status_code == 422
    data = response.json()
    assert data["code"] == "VALIDATION_ERROR"
    assert "message" in data
    assert "id_token" in data["message"]
