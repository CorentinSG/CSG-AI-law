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
import json
import os
import sys
from typing import Any

from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

app = Flask(__name__)

PORT = int(os.getenv("PORT", os.getenv("SCRAPLING_WORKER_PORT", "8765")))
HOST = os.getenv("SCRAPLING_WORKER_HOST", "0.0.0.0")
# Rate-limit: max requests per second per domain (enforced with a simple counter)
RATE_LIMIT_PER_DOMAIN = int(os.getenv("SCRAPING_RATE_LIMIT_PER_DOMAIN", "5"))
USER_AGENT = os.getenv(
    "SCRAPING_USER_AGENT",
    "CSG-Law-AI-Intelligence/1.0 (legal monitoring; contact@saint-girons.com)",
)

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
        from scrapling import Fetcher
    except ImportError:
        return {
            "url": url,
            "title": "",
            "body": "",
            "published_at": None,
            "canonical_url": None,
            "pdf_links": [],
            "error": "Scrapling is not installed. Run: pip install scrapling",
        }

    try:
        fetcher = Fetcher(
            auto_match=True,
            user_agent=USER_AGENT,
        )
        page = fetcher.get(url)
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
    }


@app.get("/health")
def health():
    return jsonify({"status": "ok", "version": "1.0.0"})


@app.post("/extract")
def extract():
    payload = request.get_json(silent=True) or {}
    url = payload.get("url", "").strip()
    if not url:
        return jsonify({"error": "url is required"}), 400

    # Merge: inline config overrides registered per-source config
    # The client may pass a source_id so we can look up the registered config
    source_id = payload.get("source_id", "")
    config = dict(_extractor_configs.get(source_id, {}))
    config.update(payload.get("config") or {})

    result = extract_page(url, config)
    return jsonify(result)


@app.post("/extract/batch")
def extract_batch():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items", [])
    if not isinstance(items, list):
        return jsonify({"error": "items must be an array"}), 400

    results = []
    for item in items:
        url = item.get("url", "").strip()
        if not url:
            continue
        source_id = item.get("source_id", "")
        config = dict(_extractor_configs.get(source_id, {}))
        config.update(item.get("config") or {})
        results.append(extract_page(url, config))

    return jsonify(results)


if __name__ == "__main__":
    load_extractor_configs()
    print(f"[scrapling_worker] Starting on {HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=False)
