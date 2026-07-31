import { describe, expect, it } from "vitest";

import {
  bestSelector,
  derivedSelectors,
  diagnosePageFailure,
  listingCandidates,
} from "./discover-source-extraction";

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

describe("selectors derived from the page", () => {
  it("finds a repeated listing signature the curated list does not name", () => {
    const html = page(`
      <div class="oversigt-element"><a href="/a">Guidance on automated decision making</a><time datetime="2026-07-01">1 July</time></div>
      <div class="oversigt-element"><a href="/b">Opinion on biometric identification</a><time datetime="2026-07-02">2 July</time></div>
      <div class="oversigt-element"><a href="/c">Report on algorithmic transparency</a><time datetime="2026-07-03">3 July</time></div>`);

    expect(derivedSelectors(html)).toContain("div.oversigt-element");
  });

  it("ignores containers holding no link", () => {
    const html = page(`
      <div class="chrome">no link here</div>
      <div class="chrome">nor here</div>
      <div class="chrome">nor here either</div>`);

    expect(derivedSelectors(html)).not.toContain("div.chrome");
  });

  it("skips signatures that repeat like page chrome rather than a listing", () => {
    const rows = Array.from(
      { length: 250 },
      (_, i) => `<div class="everywhere"><a href="/x${i}">link</a></div>`,
    ).join("");

    expect(derivedSelectors(page(rows))).not.toContain("div.everywhere");
  });

  it("drops per-row state and hash classes that would fragment the signature", () => {
    const html = page(`
      <li class="row is-active"><a href="/a">Guidance on automated decisions</a></li>
      <li class="row is-active"><a href="/b">Opinion on biometric systems</a></li>
      <li class="row is-active"><a href="/c">Report on transparency duties</a></li>`);

    // The full signature keeps only the stable class, so both granularities agree.
    expect(derivedSelectors(html)).toContain("li.row");
    expect(derivedSelectors(html).some((s) => s.includes("is-active"))).toBe(false);
  });

  it("prefers a specific signature over a broad one", () => {
    const html = page(`
      <div class="wrap news-row"><a href="/a">Guidance on automated decisions</a></div>
      <div class="wrap news-row"><a href="/b">Opinion on biometric systems</a></div>
      <div class="wrap news-row"><a href="/c">Report on transparency duties</a></div>`);

    const derived = derivedSelectors(html);
    expect(derived.indexOf("div.wrap.news-row")).toBeLessThan(derived.indexOf("div.wrap"));
  });

  // The whole point of deriving candidates is to offer more to the evidence bar,
  // never to lower it. A navigation menu must still be rejected even though its
  // markup repeats perfectly.
  it("still rejects a navigation menu, which repeats just as regularly", () => {
    const nav = page(`
      <div class="menu-entry"><a href="/home">Home</a></div>
      <div class="menu-entry"><a href="/about">About us</a></div>
      <div class="menu-entry"><a href="/contact">Contact</a></div>
      <div class="menu-entry"><a href="/legal">Legal notice</a></div>`);

    expect(derivedSelectors(nav)).toContain("div.menu-entry");
    expect(bestSelector(nav, BASE)).toBeNull();
  });

  it("lets a real listing through a derived selector end to end", () => {
    const listing = page(`
      <div class="oversigt-element"><a href="/a">Guidance on automated decision making</a><time datetime="2026-07-01">1 July</time></div>
      <div class="oversigt-element"><a href="/b">Opinion on biometric identification systems</a><time datetime="2026-07-02">2 July</time></div>
      <div class="oversigt-element"><a href="/c">Report on algorithmic transparency duties</a><time datetime="2026-07-03">3 July</time></div>`);

    const evidence = bestSelector(listing, BASE);
    expect(evidence?.selector).toBe("div.oversigt-element");
    expect(evidence?.datedRatio).toBe(1);
  });
});

describe("listing candidates from a site root", () => {
  const ROOT = "https://dpa.example.gov";

  // These authorities publish in their own languages; an English-only hint list
  // would silently skip most of Europe.
  it("finds the listing link in the site's own language", () => {
    const html = `<a href="/nyheter">Nyheter</a>
      <a href="/frettir">Fréttir</a>
      <a href="/novice">Novice</a>
      <a href="/aktualnosci">Aktualności</a>
      <a href="/communiques">Communiqués de presse</a>`;

    expect(listingCandidates(html, ROOT)).toHaveLength(5);
  });

  it("matches on the link text when the href gives nothing away", () => {
    const html = `<a href="/s/12345">Nieuws</a>`;
    expect(listingCandidates(html, ROOT)).toEqual(["https://dpa.example.gov/s/12345"]);
  });

  it("stays on the source's own host", () => {
    const html = `<a href="https://twitter.com/dpa">News</a><a href="/news">News</a>`;
    expect(listingCandidates(html, ROOT)).toEqual(["https://dpa.example.gov/news"]);
  });

  it("skips the root and bare fragments, which are the same page again", () => {
    const html = `<a href="/">News</a><a href="#news">News</a><a href="/news">News</a>`;
    expect(listingCandidates(html, ROOT)).toEqual(["https://dpa.example.gov/news"]);
  });

  it("does not repeat a link that appears in both nav and footer", () => {
    const html = `<a href="/news">News</a><a href="/news">News</a>`;
    expect(listingCandidates(html, ROOT)).toHaveLength(1);
  });

  it("ignores links that name nothing like a publication listing", () => {
    const html = `<a href="/contact">Contact</a><a href="/about">About us</a><a href="/jobs">Vacancies</a>`;
    expect(listingCandidates(html, ROOT)).toEqual([]);
  });
});

function failed(status: number | null, errorCode: string | null = null) {
  return {
    html: null,
    status,
    finalUrl: null,
    errorName: status === null ? "TypeError" : null,
    errorCode,
  };
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

  it("calls a host dead only when DNS itself fails", () => {
    expect(diagnosePageFailure(failed(null, "ENOTFOUND"), null).verdict).toBe("dead_host");
    expect(diagnosePageFailure(failed(null, "EAI_AGAIN"), null).verdict).toBe("dead_host");
  });

  // Node surfaces every fetch failure as a bare TypeError, so an earlier version
  // of this classifier read a WAF resetting the connection as a dead host — and
  // would have had Ireland's DPC deactivated. `cause.code` is the discriminator.
  it("does not call a live host dead when the connection is merely refused", () => {
    for (const code of ["ECONNRESET", "ECONNREFUSED", "EPROTO", "CERT_HAS_EXPIRED", "UND_ERR_CONNECT_TIMEOUT"]) {
      expect(diagnosePageFailure(failed(null, code), null).verdict, code).toBe("unreachable");
    }
  });

  // The root shares the failing path's hostname, so a root that answers proves
  // DNS works and the failure was transient — never that the path is wrong.
  // Only a real 404/410 is evidence about a path.
  it("treats any transport failure with a live root as transient, not a dead path", () => {
    expect(diagnosePageFailure(failed(null, "ENOTFOUND"), 200).verdict).toBe("unreachable");
    expect(diagnosePageFailure(failed(null, "ECONNRESET"), 200).verdict).toBe("unreachable");
  });

  it("reaches dead_path only from an HTTP status that names the path as gone", () => {
    const transport = ["ENOTFOUND", "EAI_AGAIN", "ECONNRESET", "ECONNREFUSED", "EPROTO"];
    for (const code of transport) {
      for (const root of [200, 301, 404, null]) {
        expect(diagnosePageFailure(failed(null, code), root).verdict, `${code}/${root}`).not.toBe("dead_path");
      }
    }
  });

  it("never condemns a source on a timeout or a server error", () => {
    const timedOut = { html: null, status: null, finalUrl: null, errorName: "TimeoutError", errorCode: null };
    expect(diagnosePageFailure(timedOut, null).verdict).toBe("timeout");
    for (const status of [500, 502, 503, 504]) {
      expect(diagnosePageFailure(failed(status), 200).verdict, String(status)).toBe("server_error");
    }
  });

  // Only these two license removing a declared official source. If a future
  // change lets another verdict through, that is a coverage regression waiting
  // to happen, so the set is pinned rather than described.
  it("keeps the removable set to exactly dead_path and dead_host", () => {
    const removable = new Set(["dead_path", "dead_host"]);
    const cases = [
      failed(403), failed(401), failed(429), failed(500), failed(503),
      failed(null, "ECONNRESET"), failed(null, "CERT_HAS_EXPIRED"),
    ];
    for (const page of cases) {
      expect(removable.has(diagnosePageFailure(page, 200).verdict), JSON.stringify(page)).toBe(false);
    }
  });

  it("carries the evidence into the note so a reader need not rerun the probe", () => {
    expect(diagnosePageFailure(failed(403), 200).note).toContain("403");
    expect(diagnosePageFailure(failed(404), 200).note).toContain("root answers 200");
  });
});
