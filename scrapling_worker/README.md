# Scrapling Worker

Python sidecar service for resilient, targeted extraction from high-value official legal sources.

## Why a separate service?

Scrapling is a Python-only library. The main project is Next.js/Node.js.
The worker exposes a simple HTTP API that Next.js calls via fetch.

## Setup

```bash
cd scrapling_worker
py -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
py worker.py
```

The worker starts on `http://0.0.0.0:8765` by default. For local Next.js or
worker processes, set `SCRAPLING_WORKER_URL=http://localhost:8765`.

## Railway deployment

Create this as a separate Railway service with the service root set to
`scrapling_worker`. The included `railway.json` starts the worker with a
production WSGI server:

```bash
gunicorn worker:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120
```

Local development still uses Flask's built-in server via `python worker.py`.
Railway provides `PORT`; gunicorn binds to `0.0.0.0:$PORT`.
After deployment, set the main app/worker variable:

```bash
SCRAPLING_WORKER_URL=https://<your-scrapling-service>.up.railway.app
```

Prefer a Railway private-network URL if both services are in the same Railway
project and private networking is enabled.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | unset | Railway-provided port; takes precedence over `SCRAPLING_WORKER_PORT` |
| `SCRAPLING_WORKER_PORT` | `8765` | Port the worker listens on |
| `SCRAPLING_WORKER_HOST` | `0.0.0.0` | Host/interface the worker binds to |
| `SCRAPLING_WORKER_URL` | `http://localhost:8765` | URL used by Next.js to reach the worker |
| `SCRAPING_USER_AGENT` | CSG-Law-AI-Intelligence/1.0 | HTTP user agent sent to target sites |
| `SCRAPING_RATE_LIMIT_PER_DOMAIN` | `5` | Max requests per domain per run |
| `SCRAPLING_ALLOW_INSECURE_SSL_FALLBACK` | `true` | Retry once with TLS certificate verification disabled when an official site fails certificate-chain validation |

## API

### `GET /health`
Returns `{"status": "ok", "version": "1.0.0"}`.

### `POST /extract`
Extract structured content from a single URL.

Request:
```json
{
  "url": "https://example.com/page",
  "source_id": "src-ftc-press",
  "config": {
    "title_selector": "h1",
    "date_selector": "time[datetime]",
    "body_selector": ".article-body"
  }
}
```

Response:
```json
{
  "url": "https://example.com/page",
  "title": "Page Title",
  "body": "Full body text...",
  "published_at": "2025-06-01T00:00:00Z",
  "canonical_url": "https://example.com/page",
  "pdf_links": ["https://example.com/doc.pdf"]
}
```

### `POST /extract/batch`
Extract from multiple URLs.

Request: `{"items": [{"url": "...", "source_id": "...", "config": {...}}, ...]}`
Response: array of extract results.

## Per-source extractor configs

Add a JSON file to `extractors/<source_id>.json` to register per-source selectors.
These are loaded at startup and merged with any inline config passed in the request.

See `extractors/ftc.json` and `extractors/edpb.json` for examples.

## Adding a new extractor

1. Create `extractors/<source-id>.json` with the selectors.
2. Test manually: `curl -X POST http://localhost:8765/extract -H 'Content-Type: application/json' -d '{"url":"..."}'`
3. Register the source in `src/agents/ingestion/seedSources.ts` with `ingestion_method: "scrapling"`.
