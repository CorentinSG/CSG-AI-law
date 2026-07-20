"""
Scrapling worker service for the CSG Law AI Law Intelligence project.

Role: targeted, resilient extraction from high-value official legal sources
where selectors may change over time. Scrapling uses adaptive element
detection that degrades gracefully when DOM structure changes.

Endpoints:
  GET  /health          — liveness check
  POST /extract         — extract structured content from a URL
  POST /extract/batch   — extract from multiple URLs (returns array)

Required: Python 3.10+, see requirements.txt
Run: python worker.py  (default port 8765)
"""

import hashlib
import hmac
import ipaddress
import json
import os
import sys
import time
from typing import Any
from urllib.parse import urlsplit

from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

app = Flask(__name__)

PORT = int(os.getenv("PORT", os.getenv("SCRAPLING_WORKER_PORT", "8765")))
HOST = os.getenv("SCRAPLING_WORKER_HOST", "0.0.0.0")
# Rate-limit: max requests per second per domain (sliding one-second window).
RATE_LIMIT_PER_DOMAIN = int(os.getenv("SCRAPING_RATE_LIMIT_PER_DOMAIN", "5"))
USER_AGENT = os.getenv(
    "SCRAPING_USER_AGENT",
    "CSG-Law-AI-Intelligence/1.0 (legal monitoring; contact@saint-girons.com)",
)
# Insecure TLS fallback is opt-in: legal content must not be fetched over an
# unverified connection unless the operator explicitly accepts the risk.
ALLOW_INSECURE_SSL_FALLBACK = (
    os.getenv("SCRAPLING_ALLOW_INSECURE_SSL_FALLBACK", "false").strip().lower()
    in {"1", "true", "yes", "on"}
)
# Shared secret required on every extraction request. Without it the service
# refuses to run extractions (the worker is deployed on a public URL).
WORKER_TOKEN = os.getenv("SCRAPLING_WORKER_TOKEN", "").strip()

_rate_windows: dict[str, list[float]] = {}


def require_worker_auth() -> tuple[Any, int] | None:
    """Return an error response when the request is not authenticated."""
    if not WORKER_TOKEN:
        return (
            jsonify(
                {
                    "error": (
                        "SCRAPLING_WORKER_TOKEN is not configured on the worker; "
                        "extraction is disabled until it is set."
                    )
                }
            ),
            503,
        )
    header = request.headers.get("Authorization", "")
    provided = header[7:] if header.startswith("Bearer ") else ""
    if not provided or not hmac.compare_digest(provided, WORKER_TOKEN):
        return jsonify({"error": "unauthorized"}), 401
    return None


def validate_target_url(url: str) -> str | None:
    """Reject non-http(s) schemes and private/loopback/metadata targets."""
    try:
        parts = urlsplit(url)
    except ValueError:
        return "invalid url"
    if parts.scheme not in {"http", "https"}:
        return "only http(s) urls are allowed"
    host = (parts.hostname or "").strip().lower()
    if not host:
        return "url has no host"
    if host == "localhost" or host.endswith((".localhost", ".internal", ".local")):
        return "internal hosts are not allowed"
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return None  # hostname, not an IP literal
    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    ):
        return "private or reserved ip targets are not allowed"
    return None


def enforce_domain_rate_limit(url: str) -> str | None:
    """Sliding one-second window per domain; returns an error when exceeded."""
    host = (urlsplit(url).hostname or "unknown").lower()
    now = time.monotonic()
    window = [t for t in _rate_windows.get(host, []) if now - t < 1.0]
    if len(window) >= RATE_LIMIT_PER_DOMAIN:
        _rate_windows[host] = window
        return f"rate limit exceeded for domain {host} ({RATE_LIMIT_PER_DOMAIN}/s)"
    window.append(now)
    _rate_windows[host] = window
    return None

# Per-source extractor configs loaded from extractors/ directory
_extractor_configs: dict[str, dict[str, Any]] = {}


def load_extractor_configs() -> None:
    """Load per-source extractor configs from the extractors/ directory."""
    extractors_dir = os.path.join(os.path.dirname(__file__), "extractors")
    if not os.path.isdir(extractors_dir):
        return
    for filename in os.listdir(extractors_dir):
        if filename.endswith(".json"):
            source_id = filename[:-5]  # strip .json
            path = os.path.join(extractors_dir, filename)
            try:
                with open(path, encoding="utf-8") as f:
                    _extractor_configs[source_id] = json.load(f)
            except Exception as exc:  # noqa: BLE001
                print(f"[scrapling_worker] Failed to load {filename}: {exc}", file=sys.stderr)


# Load extractor configs at import time so they are populated under any WSGI
# server (e.g. gunicorn imports `worker:app` and never runs the __main__ block).
load_extractor_configs()


def is_ssl_certificate_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return "ssl certificate" in message or "certificate_verify_failed" in message


def fetch_with_official_site_ssl_fallback(fetcher: Any, url: str) -> tuple[Any, list[str]]:
    fetch_kwargs = {"headers": {"User-Agent": USER_AGENT}}
    try:
        return fetcher.get(url, **fetch_kwargs), []
    except Exception as exc:  # noqa: BLE001
        if not ALLOW_INSECURE_SSL_FALLBACK or not is_ssl_certificate_error(exc):
            raise

        warning = (
            "Retried with HTTPS certificate verification disabled after the official "
            f"site failed certificate validation: {exc}"
        )
        return fetcher.get(url, **fetch_kwargs, verify=False), [warning]


def extract_page(url: str, config: dict[str, Any]) -> dict[str, Any]:
    """
    Extract structured content from a URL using Scrapling.

    config keys (all optional):
      title_selector    — CSS/XPath selector for the title
      date_selector     — CSS/XPath selector for the publication date
      body_selector     — CSS/XPath selector for the body text
      pdf_link_selector — CSS/XPath selector for PDF download links
      canonical_selector — CSS/XPath selector for the canonical URL
      fallback_rules    — list of notes/fallback strategies
    """
    try:
        from scrapling.fetchers import Fetcher
    except ImportError:
        return {
            "url": url,
            "title": "",
            "body": "",
            "published_at": None,
            "canonical_url": None,
            "pdf_links": [],
            "error": "Scrapling fetcher dependencies are not installed. Run: pip install 'scrapling[fetchers]'",
        }

    try:
        page, fetch_warnings = fetch_with_official_site_ssl_fallback(Fetcher, url)
    except Exception as exc:  # noqa: BLE001
        return {
            "url": url,
            "title": "",
            "body": "",
            "published_at": None,
            "canonical_url": None,
            "pdf_links": [],
            "error": str(exc),
        }

    # ── Title ─────────────────────────────────────────────────────────────
    title = ""
    if config.get("title_selector"):
        el = page.find(config["title_selector"])
        title = el.text if el else ""
    if not title:
        el = page.find("h1")
        if not el:
            el = page.find("title")
        title = el.text if el else ""

    # ── Publication date ──────────────────────────────────────────────────
    published_at = None
    if config.get("date_selector"):
        el = page.find(config["date_selector"])
        if el:
            published_at = el.attrib.get("datetime") or el.text or None

    # ── Body ──────────────────────────────────────────────────────────────
    body = ""
    if config.get("body_selector"):
        el = page.find(config["body_selector"])
        body = el.text if el else ""
    if not body:
        # Graceful fallback: get all paragraph text
        paragraphs = page.find_all("p")
        body = "\n\n".join(p.text for p in paragraphs if p.text.strip())

    # ── Canonical URL ─────────────────────────────────────────────────────
    canonical_url = None
    if config.get("canonical_selector"):
        el = page.find(config["canonical_selector"])
        canonical_url = el.attrib.get("href") if el else None
    if not canonical_url:
        el = page.find('link[rel="canonical"]')
        canonical_url = el.attrib.get("href") if el else url

    # ── PDF links ─────────────────────────────────────────────────────────
    pdf_links: list[str] = []
    selector = config.get("pdf_link_selector", 'a[href$=".pdf"]')
    for el in page.find_all(selector):
        href = el.attrib.get("href", "")
        if href:
            pdf_links.append(href)

    return {
        "url": url,
        "title": title.strip(),
        "body": body.strip(),
        "published_at": published_at,
        "canonical_url": canonical_url,
        "pdf_links": pdf_links,
        "fetch_warnings": fetch_warnings,
    }


@app.get("/health")
def health():
    return jsonify({"status": "ok", "version": "1.0.1"})


@app.post("/extract")
def extract():
    auth_error = require_worker_auth()
    if auth_error:
        return auth_error

    payload = request.get_json(silent=True) or {}
    url = payload.get("url", "").strip()
    if not url:
        return jsonify({"error": "url is required"}), 400
    url_error = validate_target_url(url)
    if url_error:
        return jsonify({"error": url_error}), 400
    rate_error = enforce_domain_rate_limit(url)
    if rate_error:
        return jsonify({"error": rate_error}), 429

    # Merge: inline config overrides registered per-source config
    # The client may pass a source_id so we can look up the registered config
    source_id = payload.get("source_id", "")
    config = dict(_extractor_configs.get(source_id, {}))
    config.update(payload.get("config") or {})

    result = extract_page(url, config)
    return jsonify(result)


@app.post("/extract/batch")
def extract_batch():
    auth_error = require_worker_auth()
    if auth_error:
        return auth_error

    payload = request.get_json(silent=True) or {}
    items = payload.get("items", [])
    if not isinstance(items, list):
        return jsonify({"error": "items must be an array"}), 400

    results = []
    for item in items:
        url = item.get("url", "").strip()
        if not url:
            continue
        if validate_target_url(url):
            continue
        rate_error = enforce_domain_rate_limit(url)
        if rate_error:
            results.append({"url": url, "error": rate_error})
            continue
        source_id = item.get("source_id", "")
        config = dict(_extractor_configs.get(source_id, {}))
        config.update(item.get("config") or {})
        results.append(extract_page(url, config))

    return jsonify(results)


if __name__ == "__main__":
    # Local dev: `python worker.py` runs Flask's built-in server. In production
    # the service starts via gunicorn (see railway.json); configs are already
    # loaded at import above, so both paths behave the same.
    print(f"[scrapling_worker] Starting on {HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=False)
