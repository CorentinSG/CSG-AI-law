import { describe, expect, it } from "vitest";

import { bestSelector, diagnosePageFailure } from "./discover-source-extraction";

const BASE = "https://dpa.example.gov/news";

function page(body: string) {
  return `<!doctype html><html><body><main>${body}</main></body></html>`;
}

describe("candidate selector discovery", () => {
  // The whole point: a navigation menu must not pass as a publication listing.
  // These are the shapes that made the bare `a[href]` selector useless.
  it("rejects a navigation menu", () => {
    const nav = page(`
      <ul>
        <li><a href="/home">Home</a></li>
        <li><a href="/about">About us</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/legal">Legal notice</a></li>
        <li><a href="/faq">FAQ</a></li>
      </ul>`);

    expect(bestSelector(nav, BASE)).toBeNull();
  });

  it("rejects a listing whose items carry no dates", () => {
    const undated = page(`
      <article class="post"><a href="/a">Guidance on automated decision making</a></article>
      <article class="post"><a href="/b">Opinion on biometric identification systems</a></article>
      <article class="post"><a href="/c">Annual report of the supervisory authority</a></article>`);

    expect(bestSelector(undated, BASE)).toBeNull();
  });

  it("rejects a listing that links off-host", () => {
    const offHost = page(`
      <article class="post"><a href="https://elsewhere.example/a">Guidance on automated decisions</a><time datetime="2026-07-01">1 July 2026</time></article>
      <article class="post"><a href="https://elsewhere.example/b">Opinion on biometric systems</a><time datetime="2026-07-02">2 July 2026</time></article>
      <article class="post"><a href="https://elsewhere.example/c">Report on algorithmic transparency</a><time datetime="2026-07-03">3 July 2026</time></article>`);

    expect(bestSelector(offHost, BASE)).toBeNull();
  });

  it("accepts a real listing with <time> elements", () => {
    const listing = page(`
      <article class="post"><a href="/a">Guidance on automated decision making</a><time datetime="2026-07-01">1 July 2026</time></article>
      <article class="post"><a href="/b">Opinion on biometric identification systems</a><time datetime="2026-07-02">2 July 2026</time></article>
      <article class="post"><a href="/c">Report on algorithmic transparency duties</a><time datetime="2026-07-03">3 July 2026</time></article>`);

    const evidence = bestSelector(listing, BASE);
    expect(evidence).not.toBeNull();
    expect(evidence?.itemCount).toBe(3);
    expect(evidence?.datedRatio).toBe(1);
    expect(evidence?.sampleRows[0]).toContain("dated");
  });

  it("accepts dates written as text in European numeric formats", () => {
    const listing = page(`
      <div class="news-item"><a href="/a">Guidance on automated decision making</a><span>01.07.2026</span></div>
      <div class="news-item"><a href="/b">Opinion on biometric identification systems</a><span>02/07/2026</span></div>
      <div class="news-item"><a href="/c">Report on algorithmic transparency duties</a><span>2026-07-03</span></div>`);

    const evidence = bestSelector(listing, BASE);
    expect(evidence?.selector).toContain("news-item");
    expect(evidence?.datedRatio).toBe(1);
  });

  it("does not count the same link twice", () => {
    const duplicated = page(`
      <article class="post"><a href="/a">Guidance on automated decision making</a><time datetime="2026-07-01">1 July</time></article>
      <article class="post"><a href="/a">Guidance on automated decision making</a><time datetime="2026-07-01">1 July</time></article>
      <article class="post"><a href="/b">Opinion on biometric identification systems</a><time datetime="2026-07-02">2 July</time></article>
      <article class="post"><a href="/c">Report on algorithmic transparency duties</a><time datetime="2026-07-03">3 July</time></article>`);

    expect(bestSelector(duplicated, BASE)?.itemCount).toBe(3);
  });

  it("rejects a listing where fewer than half the items are dated", () => {
    const mostlyUndated = page(`
      <article class="post"><a href="/a">Guidance on automated decision making</a><time datetime="2026-07-01">1 July</time></article>
      <article class="post"><a href="/b">Opinion on biometric identification systems</a></article>
      <article class="post"><a href="/c">Report on algorithmic transparency duties</a></article>
      <article class="post"><a href="/d">Consultation on high-risk AI classification</a></article>`);

    expect(bestSelector(mostlyUndated, BASE)).toBeNull();
  });

  it("rejects short menu-style labels even when dates are nearby", () => {
    const shortLabels = page(`
      <article class="post"><a href="/a">Home</a><time datetime="2026-07-01">1 July</time></article>
      <article class="post"><a href="/b">News</a><time datetime="2026-07-02">2 July</time></article>
      <article class="post"><a href="/c">Contact</a><time datetime="2026-07-03">3 July</time></article>`);

    expect(bestSelector(shortLabels, BASE)).toBeNull();
  });
});

function failed(status: number | null, errorName: string | null = null) {
  return { html: null, status, finalUrl: null, errorName };
}

// This verdict decides whether a declared official source gets deactivated, so
// the asymmetry is deliberate: only `dead_path` and `dead_host` license removing
// anything, and a live root always downgrades `dead_host` to `dead_path`.
describe("page failure diagnosis", () => {
  it("does not call a live site blocking a datacenter client dead", () => {
    // The Irish DPC and the Dutch Rijksoverheid failed the first probe run this
    // way. Both are live; deactivating them would have dropped working lanes.
    for (const status of [401, 403, 429]) {
      expect(diagnosePageFailure(failed(status), 200).verdict, String(status)).toBe("blocked");
    }
  });

  it("separates a moved newsroom from a site that is gone", () => {
    expect(diagnosePageFailure(failed(404), 200).verdict).toBe("dead_path");
    expect(diagnosePageFailure(failed(404), null).verdict).toBe("dead_host");
    expect(diagnosePageFailure(failed(410), 200).verdict).toBe("dead_path");
  });

  it("treats a DNS or TLS failure as a dead host only if the root is dead too", () => {
    expect(diagnosePageFailure(failed(null, "TypeError"), null).verdict).toBe("dead_host");
    expect(diagnosePageFailure(failed(null, "TypeError"), 200).verdict).toBe("dead_path");
  });

  it("never condemns a source on a timeout or a server error", () => {
    expect(diagnosePageFailure(failed(null, "TimeoutError"), null).verdict).toBe("timeout");
    for (const status of [500, 502, 503, 504]) {
      expect(diagnosePageFailure(failed(status), 200).verdict, String(status)).toBe("server_error");
    }
  });

  it("carries the evidence into the note so a reader need not rerun the probe", () => {
    expect(diagnosePageFailure(failed(403), 200).note).toContain("403");
    expect(diagnosePageFailure(failed(404), 200).note).toContain("root answers 200");
  });
});
