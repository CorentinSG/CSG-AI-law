import { config } from "dotenv";
import { pathToFileURL } from "node:url";

config({ path: ".env.local", quiet: true });

type ProviderStatus = "live_verified" | "blocked_missing_credentials" | "failed";

interface ProviderProbeResult {
  provider: "scrapling" | "firecrawl" | "newsapi" | "judilibre" | "courtlistener" | "runtime";
  status: ProviderStatus;
  latency: number;
  errorClass?: string;
}

const SCRAPLING_PROBE_URL =
  "https://www.europarl.europa.eu/topics/en/article/20230601STO93804/eu-ai-act-first-regulation-on-artificial-intelligence";
const FIRECRAWL_PROBE_SOURCE = {
  id: "ing-co-ag-ai",
  sourceUrl: "https://coag.gov/resources/artificial-intelligence/",
  crawlRootUrl: "https://coag.gov/resources/artificial-intelligence/",
};
const NEWSAPI_PROBE_URL =
  "https://newsapi.org/v2/everything?q=%22AI%20Act%22&language=en&pageSize=1&sortBy=publishedAt";
const JUDILIBRE_PROBE_URL =
  "https://api.piste.gouv.fr/cassation/judilibre/v1.0/search?query=intelligence%20artificielle&page_size=1";
const COURTLISTENER_PROBE_URL =
  "https://www.courtlistener.com/api/rest/v4/search/?q=%22artificial%20intelligence%22&type=o&order_by=dateFiled%20desc";
const PISTE_OAUTH_TOKEN_URL = "https://oauth.piste.gouv.fr/api/oauth/token";
const MIN_FIRECRAWL_MARKDOWN_CHARS = 40;
const MIN_FIRECRAWL_DISTINCT_CONTENT_CHARS = 20;

function normalizeComparableText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function now() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return Date.now() - startedAt;
}

function classifyError(error: unknown): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "TimeoutError";
  }

  const name =
    error instanceof Error && typeof error.name === "string" && error.name.trim().length > 0
      ? error.name
      : "UnknownError";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  if (normalized.includes("401") || normalized.includes("403") || normalized.includes("unauthor")) {
    return "AuthError";
  }
  if (normalized.includes("timeout") || normalized.includes("timed out") || normalized.includes("abort")) {
    return "TimeoutError";
  }
  if (normalized.includes("invalid json") || normalized.includes("unexpected token")) {
    return "ParseError";
  }
  if (normalized.includes("http")) {
    return "HttpError";
  }
  if (normalized.includes("fetch") || normalized.includes("network") || normalized.includes("unreachable")) {
    return "NetworkError";
  }

  return name.replace(/[^A-Za-z0-9]/g, "") || "UnknownError";
}

export function isUsableFirecrawlDocument(document: {
  markdown?: string | null;
  title?: string | null;
}) {
  const markdown = typeof document.markdown === "string" ? document.markdown : "";
  const title = typeof document.title === "string" ? document.title : "";
  const normalizedMarkdown = markdown.replace(/\s+/g, " ").trim();
  const normalizedTitle = title.replace(/\s+/g, " ").trim();

  if (normalizedMarkdown.length < MIN_FIRECRAWL_MARKDOWN_CHARS) {
    return false;
  }

  if (!normalizedTitle) {
    return true;
  }

  const comparableTitle = normalizeComparableText(normalizedTitle);
  const comparableMarkdown = normalizeComparableText(normalizedMarkdown);
  const distinctContent = comparableMarkdown
    .replaceAll(comparableTitle, " ")
    .replace(/\s+/g, " ")
    .trim();

  return distinctContent.length >= MIN_FIRECRAWL_DISTINCT_CONTENT_CHARS;
}

export function assertUsableFirecrawlDocuments(
  documents: Array<{ markdown?: string | null; title?: string | null }>,
) {
  if (!Array.isArray(documents)) {
    throw new Error("Firecrawl returned a non-array result");
  }
  if (documents.length === 0) {
    throw new Error("Firecrawl returned an empty result set");
  }
  if (!documents.some((document) => isUsableFirecrawlDocument(document))) {
    throw new Error("Firecrawl returned no document with usable content");
  }
}

async function runConfiguredProbe(
  provider: ProviderProbeResult["provider"],
  configured: boolean,
  probe: () => Promise<void>,
): Promise<ProviderProbeResult> {
  if (!configured) {
    return {
      provider,
      status: "blocked_missing_credentials",
      latency: 0,
    };
  }

  const startedAt = now();
  try {
    await probe();
    return {
      provider,
      status: "live_verified",
      latency: elapsedMs(startedAt),
    };
  } catch (error) {
    return {
      provider,
      status: "failed",
      latency: elapsedMs(startedAt),
      errorClass: classifyError(error),
    };
  }
}

async function verifyScrapling(): Promise<ProviderProbeResult> {
  return runConfiguredProbe("scrapling", Boolean(process.env.SCRAPLING_WORKER_URL?.trim()), async () => {
    const { checkScraplingHealth, scraplingExtract } = await import("@/agents/ingestion/scraplingClient");

    const health = await checkScraplingHealth();
    if (health.status !== "ok") {
      throw new Error("Scrapling health probe failed");
    }

    const extracted = await scraplingExtract(SCRAPLING_PROBE_URL, "ing-ep-ai");
    if (!extracted || (!extracted.title && !extracted.markdown)) {
      throw new Error("Scrapling extraction returned empty content");
    }
  });
}

async function verifyFirecrawl(): Promise<ProviderProbeResult> {
  return runConfiguredProbe("firecrawl", Boolean(process.env.FIRECRAWL_API_KEY?.trim()), async () => {
    const { crawlSource } = await import("@/agents/ingestion/firecrawlService");

    const documents = await crawlSource(FIRECRAWL_PROBE_SOURCE, { crawl_limit: 1 });
    assertUsableFirecrawlDocuments(documents);
  });
}

async function verifyNewsApi(): Promise<ProviderProbeResult> {
  return runConfiguredProbe("newsapi", Boolean(process.env.NEWSAPI_API_KEY?.trim()), async () => {
    const response = await fetch(NEWSAPI_PROBE_URL, {
      headers: {
        "X-Api-Key": process.env.NEWSAPI_API_KEY!,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`NewsAPI HTTP ${response.status}`);
    }

    await response.json();
  });
}

async function verifyJudilibre(): Promise<ProviderProbeResult> {
  const keyId = process.env.JUDILIBRE_API_KEYID?.trim();
  const pisteClientId = process.env.LEGIFRANCE_PISTE_CLIENT_ID?.trim();
  const pisteClientSecret = process.env.LEGIFRANCE_PISTE_CLIENT_SECRET?.trim();
  const configured = Boolean(keyId || (pisteClientId && pisteClientSecret));

  return runConfiguredProbe("judilibre", configured, async () => {
    let headers: HeadersInit;
    if (keyId) {
      headers = { KeyId: keyId };
    } else {
      const tokenResponse = await fetch(PISTE_OAUTH_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: pisteClientId!,
          client_secret: pisteClientSecret!,
          scope: "openid",
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!tokenResponse.ok) {
        throw new Error(`PISTE OAuth HTTP ${tokenResponse.status}`);
      }

      const tokenJson = (await tokenResponse.json()) as { access_token?: string };
      if (!tokenJson.access_token) {
        throw new Error("PISTE OAuth response did not include an access token");
      }

      headers = { Authorization: `Bearer ${tokenJson.access_token}` };
    }

    const response = await fetch(JUDILIBRE_PROBE_URL, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`Judilibre HTTP ${response.status}`);
    }

    await response.json();
  });
}

async function verifyCourtListener(): Promise<ProviderProbeResult> {
  const token = process.env.COURTLISTENER_API_KEY?.trim() || process.env.COURTLISTENER_API_TOKEN?.trim();

  return runConfiguredProbe("courtlistener", Boolean(token), async () => {
    const response = await fetch(COURTLISTENER_PROBE_URL, {
      headers: {
        Authorization: `Token ${token}`,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`CourtListener HTTP ${response.status}`);
    }

    await response.json();
  });
}

async function main() {
  const results = await Promise.all([
    verifyScrapling(),
    verifyFirecrawl(),
    verifyNewsApi(),
    verifyJudilibre(),
    verifyCourtListener(),
  ]);

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);

  const hasConfiguredFailure = results.some((result) => result.status === "failed");
  if (hasConfiguredFailure) {
    process.exitCode = 1;
  }
}

function isExecutedAsScript() {
  const entrypoint = process.argv[1];
  return Boolean(entrypoint) && import.meta.url === pathToFileURL(entrypoint).href;
}

if (isExecutedAsScript()) {
  main().catch((error) => {
    const failure: ProviderProbeResult = {
      provider: "runtime",
      status: "failed",
      latency: 0,
      errorClass: classifyError(error),
    };
    process.stdout.write(`${JSON.stringify([failure], null, 2)}\n`);
    process.exitCode = 1;
  });
}
