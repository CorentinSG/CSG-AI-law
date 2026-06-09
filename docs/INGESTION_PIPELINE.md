# Ingestion Pipeline

Dual ingestion pipeline for AI law monitoring content.

## Architecture

```
Source Registry
      │
      ▼
Ingestion Engine
  ├── Firecrawl (broad discovery, clean Markdown)
  ├── Scrapling Python worker (targeted official page extraction)
  └── Hybrid (Firecrawl discovers URLs → Scrapling extracts each)
      │
      ▼
Deduplication
  ├── URL normalization + exact URL match
  └── SHA-256 content hash (title + body)
      │
      ▼
raw_regulatory_items (status=new)
      │
      ▼
AI Classification (deterministic, no OpenAI by default)
      │
      ▼
Admin Review Queue
      │
  Approve │ Reject
      │
      ▼
ai_regulatory_updates (status=approved → published)
```

**IMPORTANT: Nothing is auto-published.** Every item must be approved by a human in the admin review queue.

---

## Firecrawl — Role

Firecrawl handles **broad ingestion**:
- Discovering links on official websites
- Crawling pages to enumerate all sub-pages
- Converting pages to clean Markdown for AI classification
- Mapping site structure in hybrid mode

**When to use:** Sources with many pages or where link discovery is the primary need (news hubs, document indexes).

Set `ingestion_method = "firecrawl"` on the source.

**API:** [`@mendable/firecrawl-js`](https://docs.firecrawl.dev)
**Config:** `FIRECRAWL_API_KEY` environment variable.

---

## Scrapling — Role

Scrapling handles **targeted, resilient extraction** from high-value official legal sources:
- Extracts structured fields: title, publication date, body text, canonical URL, PDF links
- Uses adaptive element detection — degrades gracefully when DOM changes
- Per-source extractor configs with CSS selectors and fallback rules

**When to use:** Official pages with important but infrequent updates (court rules, regulatory announcements, government portals).

Set `ingestion_method = "scrapling"` on the source.

Scrapling is a **Python-only library**. The project runs a separate Python worker:

```
scrapling_worker/
  worker.py          — Flask HTTP service
  requirements.txt   — pip dependencies
  extractors/        — per-source JSON configs
    ftc.json
    edpb.json
    eu-ai-office.json
```

The Next.js app calls the worker via `src/agents/ingestion/scraplingClient.ts`.

---

## Hybrid Mode

Hybrid mode combines both engines:
1. **Firecrawl** `mapUrl()` discovers all reachable links on the source
2. **Scrapling** `extract()` extracts structured content from each discovered URL

**When to use:** Official sites where we need both link discovery AND structured extraction (e.g., EDPB document index, FTC AI pages).

Set `ingestion_method = "hybrid"` on the source.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FIRECRAWL_API_KEY` | For Firecrawl sources | Your Firecrawl API key |
| `INGESTION_SECRET` | Yes | Bearer secret for `/api/ingestion/run` (min 16 chars) |
| `SCRAPING_USER_AGENT` | No | HTTP user agent for Scrapling requests |
| `SCRAPING_RATE_LIMIT_PER_DOMAIN` | No | Max requests per domain per run (default: 5) |
| `SCRAPLING_WORKER_URL` | For Scrapling sources | URL of the Python worker (default: `http://localhost:8765`) |

---

## Database Schema

The pipeline extends existing tables (migration 009):

### `regulation_sources` — new columns
| Column | Type | Values |
|---|---|---|
| `ingestion_method` | text | `firecrawl` / `scrapling` / `hybrid` / `existing` |
| `source_category` | text | `official` / `regulator` / `court` / `parliament` / `media` / `newsletter` |
| `scrapling_config` | jsonb | `{ title_selector, date_selector, body_selector, ... }` |
| `crawl_root_url` | text | Starting URL for crawl (overrides sourceUrl) |

### `raw_regulatory_items` — new columns
| Column | Type | Description |
|---|---|---|
| `markdown` | text | Full Markdown from Firecrawl or Scrapling |
| `html_snapshot` | text | Optional HTML for debugging |
| `content_hash` | text | SHA-256 of title+markdown for semantic dedup |
| `extraction_method` | text | `firecrawl` / `scrapling` / `rss` / etc. |
| `published_at` | timestamptz | Publication date detected during extraction |
| `fetched_at` | timestamptz | When this item was fetched |

### `ingestion_logs` — new table
Per-run audit trail. One row per source per ingestion run. Columns: `id`, `source_id`, `method`, `status`, `urls_discovered`, `items_ingested`, `duplicates`, `error_message`, `details`, `started_at`, `finished_at`.

---

## How to Add a New Source

### Firecrawl source

1. Add an entry to `src/agents/ingestion/seedSources.ts`:
```typescript
{
  id: "ing-my-source",
  name: "My Source",
  url: "https://example.com/ai",
  ingestion_method: "firecrawl",
  crawl_frequency: "daily",
  ...
}
```

2. Register it in the database (run seed script or use admin source management).

### Scrapling source

1. Create `scrapling_worker/extractors/<source-id>.json` with selectors:
```json
{
  "title_selector": "h1",
  "date_selector": "time[datetime]",
  "body_selector": ".article-body",
  "pdf_link_selector": "a[href$='.pdf']"
}
```

2. Add an entry to `seedSources.ts` with `ingestion_method: "scrapling"`.

3. Register in database.

### Hybrid source

Same as Scrapling but set `ingestion_method: "hybrid"`. Firecrawl maps the site, Scrapling extracts each page.

---

## How to Run Ingestion Manually

### Via the API endpoint

```bash
# Run all active Firecrawl + Scrapling + hybrid sources
curl -X POST "http://localhost:3000/api/ingestion/run" \
  -H "Authorization: Bearer YOUR_INGESTION_SECRET"

# Run only Firecrawl sources
curl -X POST "http://localhost:3000/api/ingestion/run?methods=firecrawl" \
  -H "Authorization: Bearer YOUR_INGESTION_SECRET"

# Run a specific source
curl -X POST "http://localhost:3000/api/ingestion/run?sourceId=ing-eu-ai-office" \
  -H "Authorization: Bearer YOUR_INGESTION_SECRET"
```

### Start the Scrapling worker (required for Scrapling/hybrid sources)

```bash
cd scrapling_worker
python -m venv .venv
.venv\Scripts\activate   # Windows
# or: source .venv/bin/activate  (macOS/Linux)
pip install -r requirements.txt
python worker.py
```

The worker starts on `http://127.0.0.1:8765`.

---

## How to Debug Failed Extraction

1. **Check ingestion logs** in the admin interface or query `ingestion_logs` table.

2. **Firecrawl failures** — check `error_message` in the ingestion log. Common causes:
   - `FIRECRAWL_API_KEY` not set
   - Source URL returning 4xx/5xx
   - Rate limit exceeded

3. **Scrapling failures** — check:
   - Is the Python worker running? `curl http://localhost:8765/health`
   - Is `SCRAPLING_WORKER_URL` set correctly?
   - Inspect the selector config: test manually with `curl -X POST http://localhost:8765/extract -H 'Content-Type: application/json' -d '{"url":"..."}'`

4. **Deduplication skips** — items with `status=duplicate` in raw_regulatory_items. Check `content_hash` column.

5. **Admin review queue** — all new items land in `needs_review`. Navigate to `/admin/ai-regulation` to review and approve/reject.

---

## Seed Sources

Initial test sources are defined in `src/agents/ingestion/seedSources.ts`:

**Europe:**
- EU AI Office (hybrid)
- European Commission Digital Strategy / AI (firecrawl)
- European Parliament AI pages (scrapling)
- EDPB News & Documents (hybrid)

**United States:**
- New York Courts Uniform Rules (scrapling)
- California Privacy Protection Agency (hybrid)
- Colorado Attorney General AI Act (firecrawl)
- FTC AI-related pages (hybrid)

Run the seed script to register these in the database:
```bash
npm run seed:ingestion-sources
```
