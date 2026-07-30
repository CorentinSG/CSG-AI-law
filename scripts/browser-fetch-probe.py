"""
Does a real browser get past the walls that stop a plain fetch?

`discover-source-extraction.ts` reaches every source with Node's `fetch`. 16 of
the gated lanes never returned a usable page that way: 7 answered 403, 5 failed
at the transport layer (4 of them on an incomplete TLS chain, which browsers
paper over by fetching missing intermediates and Node does not), and 4 answered
404 on a seeded path.

The production fallback (`scanStaticSourceWithBrowserFallback`) is assumed to
cover these, but it calls the Scrapling worker, and that worker uses
`scrapling.fetchers.Fetcher` — a plain HTTP client, not a browser. So it would
hit the same walls. `StealthyFetcher` drives a real Chromium and is already in
the worker's dependencies, just unused.

This measures, before anything is wired, whether switching would actually help.
It reads the findings the TypeScript probe already wrote, retries only the
sources whose page never loaded, and reports what a browser gets. It writes
nothing and changes no source.

  python scripts/browser-fetch-probe.py feed-discovery.json
"""

import json
import sys

# Verdicts assigned by diagnosePageFailure() to a source whose page never loaded.
# Anything else in the report either loaded fine or was recovered elsewhere.
UNLOADABLE_VERDICTS = {"blocked", "unreachable", "dead_path", "dead_host", "timeout", "server_error"}

# Enough HTML to plausibly be a page rather than a challenge stub or error body.
MIN_USABLE_HTML = 2000


def load_targets(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as handle:
        findings = json.load(handle)
    return [f for f in findings if f.get("verdict") in UNLOADABLE_VERDICTS]


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else "feed-discovery.json"
    targets = load_targets(path)

    if not targets:
        print("No source in the report failed to load. Nothing to retry.")
        return 0

    try:
        from scrapling.fetchers import StealthyFetcher
    except ImportError as exc:
        print(f"StealthyFetcher unavailable: {exc}", file=sys.stderr)
        return 1

    print(f"Retrying {len(targets)} sources that a plain fetch could not load.\n")

    recovered: list[str] = []
    still_failing: list[str] = []

    for index, finding in enumerate(targets, start=1):
        source_id = finding.get("sourceId", "?")
        url = finding.get("sourceUrl", "")
        was = finding.get("verdict", "?")

        try:
            page = StealthyFetcher.fetch(url, headless=True, network_idle=True)
            status = getattr(page, "status", None)
            html = str(page.html_content or "")
            usable = status == 200 and len(html) >= MIN_USABLE_HTML
            outcome = "OK  " if usable else "no  "
            detail = f"status={status} html={len(html)}B"
            (recovered if usable else still_failing).append(source_id)
        except Exception as exc:  # noqa: BLE001
            outcome = "err "
            detail = f"{type(exc).__name__}: {exc}"[:160]
            still_failing.append(source_id)

        print(f"[{index}/{len(targets)}] {outcome} {source_id:<28} was={was:<12} {detail}")

    print(f"\n{len(recovered)}/{len(targets)} load in a browser but not with a plain fetch.")
    if recovered:
        print("A browser would recover: " + ", ".join(recovered))
    if still_failing:
        print("Still unreachable even in a browser: " + ", ".join(still_failing))
    print("\nNothing was wired. This is evidence for a decision, not a decision.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
