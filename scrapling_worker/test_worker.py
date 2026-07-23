"""Unit tests for the scrapling worker's security guards and helpers.

Runs without scrapling installed: extraction itself is lazy-imported, and
every test below exercises the request guards that fire before any fetch.
"""

import pytest

import worker


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setattr(worker, "WORKER_TOKEN", "test-token-0123456789abcdef")
    worker.app.config.update(TESTING=True)
    with worker.app.test_client() as test_client:
        yield test_client


def auth_headers():
    return {"Authorization": "Bearer test-token-0123456789abcdef"}


def test_extract_returns_503_when_token_unconfigured(monkeypatch):
    monkeypatch.setattr(worker, "WORKER_TOKEN", "")
    worker.app.config.update(TESTING=True)
    with worker.app.test_client() as unauth_client:
        response = unauth_client.post("/extract", json={"url": "https://example.org"})
    assert response.status_code == 503


def test_extract_returns_401_without_bearer(client):
    response = client.post("/extract", json={"url": "https://example.org"})
    assert response.status_code == 401


def test_extract_returns_401_with_wrong_token(client):
    response = client.post(
        "/extract",
        json={"url": "https://example.org"},
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert response.status_code == 401


def test_health_stays_public(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.org/file",
        "file:///etc/passwd",
        "https://localhost/admin",
        "https://api.internal/secrets",
        "https://127.0.0.1:8080/",
        "https://169.254.169.254/latest/meta-data/",
        "https://10.0.0.4/",
        "https://192.168.1.1/",
    ],
)
def test_extract_rejects_internal_or_non_http_targets(client, url):
    response = client.post("/extract", json={"url": url}, headers=auth_headers())
    assert response.status_code == 400


def test_validate_target_url_accepts_public_hostnames():
    assert worker.validate_target_url("https://www.cnil.fr/fr/actualites") is None


def test_domain_rate_limit_enforced(monkeypatch):
    monkeypatch.setattr(worker, "RATE_LIMIT_PER_DOMAIN", 2)
    worker._rate_windows.clear()
    url = "https://rate-limited.example.org/page"
    assert worker.enforce_domain_rate_limit(url) is None
    assert worker.enforce_domain_rate_limit(url) is None
    assert "rate limit exceeded" in worker.enforce_domain_rate_limit(url)
    assert worker.enforce_domain_rate_limit("https://other.example.org/") is None


def test_ssl_certificate_errors_detected():
    assert worker.is_ssl_certificate_error(Exception("SSL certificate problem"))
    assert worker.is_ssl_certificate_error(Exception("CERTIFICATE_VERIFY_FAILED: x"))
    assert not worker.is_ssl_certificate_error(Exception("connection refused"))
