/**
 * POST /api/ingestion/run
 *
 * Triggers the ingestion pipeline for active sources.
 * Protected by INGESTION_SECRET (Bearer token in Authorization header).
 *
 * Query parameters:
 *   methods  — comma-separated list of ingestion methods to run
 *              (firecrawl, scrapling, hybrid); defaults to all three
 *   sourceId — run only this specific source (optional)
 *
 * This endpoint NEVER auto-publishes. All ingested items:
 *   1. Are stored as raw_regulatory_items with status=new
 *   2. Are classified by the existing AI classifier (deterministic, no OpenAI)
 *   3. Remain in admin review queue until a human approves
 *
 * Rate limiting: per-domain rate limits are enforced inside the orchestrator.
 */

import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { runAllActiveSourceIngestion, runSourceIngestion } from "@/agents/ingestion/ingestionOrchestrator";
import { getAiRegulationRepository, getRepositoryMode } from "@/db/repository";
import { env } from "@/lib/env";

function getIngestionAuthStatus(request: Request) {
  const secret = env.INGESTION_SECRET;
  if (!secret) {
    return { ok: false, reason: "missing_ingestion_secret" as const };
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return { ok: false, reason: "missing_authorization_header" as const };
  }

  const expected = `Bearer ${secret}`;
  try {
    const a = Buffer.from(authHeader);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      return { ok: false, reason: "invalid_ingestion_secret" as const };
    }
    if (!timingSafeEqual(a, b)) {
      return { ok: false, reason: "invalid_ingestion_secret" as const };
    }
  } catch {
    return { ok: false, reason: "invalid_ingestion_secret" as const };
  }

  return { ok: true, reason: "authorized" as const };
}

async function handleIngestionRun(request: Request): Promise<NextResponse> {
  const auth = getIngestionAuthStatus(request);

  if (!auth.ok) {
    if (auth.reason === "missing_ingestion_secret") {
      return NextResponse.json(
        { ok: false, error: "Ingestion endpoint misconfigured", reason: auth.reason },
        {
          status: 500,
          headers: {
            "WWW-Authenticate": 'Bearer realm="CSG Law Ingestion API"',
          },
        }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unauthorized", reason: auth.reason },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Bearer realm="CSG Law Ingestion API"',
        },
      }
    );
  }

  const url = new URL(request.url);
  const methodsParam = url.searchParams.get("methods");
  const sourceIdParam = url.searchParams.get("sourceId");

  const allowedMethods = ["firecrawl", "scrapling", "hybrid"] as const;
  type AllowedMethod = (typeof allowedMethods)[number];

  let methods: AllowedMethod[] = [...allowedMethods];
  if (methodsParam) {
    const parsed = methodsParam
      .split(",")
      .map((m) => m.trim())
      .filter((m): m is AllowedMethod => allowedMethods.includes(m as AllowedMethod));
    if (parsed.length > 0) methods = parsed;
  }

  const startedAt = new Date().toISOString();

  try {
    let results;
    if (sourceIdParam) {
      // Run a specific source only
      const repo = getAiRegulationRepository();
      const source = await repo.getSourceById(sourceIdParam);
      if (!source) {
        return NextResponse.json(
          { ok: false, error: "Source not found", sourceId: sourceIdParam },
          { status: 404 }
        );
      }
      results = [await runSourceIngestion(source)];
    } else {
      results = await runAllActiveSourceIngestion({ methods });
    }

    const finishedAt = new Date().toISOString();
    const totalIngested = results.reduce((sum, r) => sum + r.items_ingested, 0);
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0);
    const totalFailed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      ok: true,
      dataMode: getRepositoryMode(),
      startedAt,
      finishedAt,
      sourcesRun: results.length,
      totalIngested,
      totalDuplicates,
      totalFailed,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Ingestion run failed",
        message: String(err),
        startedAt,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method Not Allowed",
      reason: "Use POST to trigger ingestion.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    },
  );
}

export async function POST(request: Request) {
  return handleIngestionRun(request);
}
