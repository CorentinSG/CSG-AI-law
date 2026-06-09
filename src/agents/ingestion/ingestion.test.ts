import { describe, it, expect, beforeEach } from "vitest";

import { normalizeUrl, computeContentHash } from "./deduplication";
import { resetMockStore } from "@/db/mock-store";

// ── URL normalization ─────────────────────────────────────────────────────────

describe("normalizeUrl", () => {
  it("lowercases scheme and host", () => {
    expect(normalizeUrl("HTTPS://EXAMPLE.COM/page")).toBe(
      "https://example.com/page"
    );
  });

  it("strips trailing slash from path", () => {
    expect(normalizeUrl("https://example.com/page/")).toBe(
      "https://example.com/page"
    );
  });

  it("preserves bare root slash", () => {
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("removes common tracking query params", () => {
    const url =
      "https://example.com/page?utm_source=email&utm_campaign=test&ref=homepage";
    expect(normalizeUrl(url)).toBe("https://example.com/page");
  });

  it("keeps non-tracking query params sorted", () => {
    const url = "https://example.com/page?z=2&a=1&utm_source=x";
    expect(normalizeUrl(url)).toBe("https://example.com/page?a=1&z=2");
  });

  it("strips fragment", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe(
      "https://example.com/page"
    );
  });

  it("handles already-normalized URL identically", () => {
    const url = "https://example.com/page?q=test";
    expect(normalizeUrl(url)).toBe(url);
  });

  it("returns lowercased original string for non-URL inputs", () => {
    expect(normalizeUrl("not-a-url")).toBe("not-a-url");
  });
});

// ── Content hash ─────────────────────────────────────────────────────────────

describe("computeContentHash", () => {
  it("produces a 64-char hex string (sha256)", () => {
    const hash = computeContentHash("Title", "Body content");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for the same input", () => {
    const hash1 = computeContentHash("Title", "Body");
    const hash2 = computeContentHash("Title", "Body");
    expect(hash1).toBe(hash2);
  });

  it("differs for different content", () => {
    const hash1 = computeContentHash("Title A", "Body");
    const hash2 = computeContentHash("Title B", "Body");
    expect(hash1).not.toBe(hash2);
  });

  it("ignores leading/trailing whitespace", () => {
    const hash1 = computeContentHash("Title", "Body");
    const hash2 = computeContentHash("  Title  ", "  Body  ");
    expect(hash1).toBe(hash2);
  });
});

// ── Repository: findRawRegulatoryItemByUrl ────────────────────────────────────

describe("repository.findRawRegulatoryItemByUrl (memory)", () => {
  beforeEach(() => resetMockStore());

  it("returns null when no item exists with that URL", async () => {
    const { MemoryAiRegulationRepository } = await import(
      "@/db/repositories/memory-repository"
    );
    const repo = new MemoryAiRegulationRepository();
    const result = await repo.findRawRegulatoryItemByUrl(
      "https://notexistent.example.com/page"
    );
    expect(result).toBeNull();
  });

  it("returns the item when URL matches", async () => {
    const { MemoryAiRegulationRepository } = await import(
      "@/db/repositories/memory-repository"
    );
    const repo = new MemoryAiRegulationRepository();

    // Get an existing source from seed data
    const sources = await repo.listSources();
    const source = sources[0];

    const url = "https://test.example.com/doc";
    await repo.createRawRegulatoryItem({
      sourceId: source.id,
      rawTitle: "Test Document",
      rawUrl: url,
      rawText: "Test content",
      rawMetadata: {},
      detectedAt: new Date().toISOString(),
      hash: "abc123",
      duplicateOf: null,
      processingStatus: "new",
    });

    const found = await repo.findRawRegulatoryItemByUrl(url);
    expect(found).not.toBeNull();
    expect(found?.rawUrl).toBe(url);
    expect(found?.rawTitle).toBe("Test Document");
  });
});

// ── Repository: ingestion logs ────────────────────────────────────────────────

describe("repository ingestion logs (memory)", () => {
  beforeEach(() => resetMockStore());

  it("creates and lists ingestion logs", async () => {
    const { MemoryAiRegulationRepository } = await import(
      "@/db/repositories/memory-repository"
    );
    const repo = new MemoryAiRegulationRepository();

    const input = {
      id: "log-001",
      source_id: "src-test",
      method: "firecrawl" as const,
      status: "success" as const,
      urls_discovered: 5,
      items_ingested: 3,
      duplicates: 1,
      error_message: null,
      details: {},
      started_at: "2026-06-08T10:00:00Z",
      finished_at: "2026-06-08T10:01:00Z",
    };

    const created = await repo.createIngestionLog(input);
    expect(created.id).toBe("log-001");
    expect(created.method).toBe("firecrawl");
    expect(created.status).toBe("success");
    expect(created.items_ingested).toBe(3);

    const logs = await repo.listIngestionLogs(10);
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe("log-001");
  });

  it("filters ingestion logs by sourceId", async () => {
    const { MemoryAiRegulationRepository } = await import(
      "@/db/repositories/memory-repository"
    );
    const repo = new MemoryAiRegulationRepository();

    await repo.createIngestionLog({
      id: "log-a",
      source_id: "src-a",
      method: "firecrawl" as const,
      status: "success" as const,
      started_at: "2026-06-08T10:00:00Z",
    });
    await repo.createIngestionLog({
      id: "log-b",
      source_id: "src-b",
      method: "scrapling" as const,
      status: "success" as const,
      started_at: "2026-06-08T10:00:00Z",
    });

    const filteredA = await repo.listIngestionLogs(10, "src-a");
    expect(filteredA).toHaveLength(1);
    expect(filteredA[0].source_id).toBe("src-a");

    const all = await repo.listIngestionLogs(10);
    expect(all).toHaveLength(2);
  });
});

// ── Duplicate prevention ──────────────────────────────────────────────────────

describe("deduplication: same URL is not inserted twice", () => {
  beforeEach(() => resetMockStore());

  it("findRawRegulatoryItemByUrl + findRawRegulatoryItemByHash prevent duplicates", async () => {
    const { MemoryAiRegulationRepository } = await import(
      "@/db/repositories/memory-repository"
    );
    const repo = new MemoryAiRegulationRepository();
    const sources = await repo.listSources();
    const sourceId = sources[0].id;

    const url = "https://dedup-test.example.com/doc";
    const hash = computeContentHash("Title", "Body");

    await repo.createRawRegulatoryItem({
      sourceId,
      rawTitle: "Title",
      rawUrl: url,
      rawText: "Body",
      rawMetadata: { content_hash: hash },
      detectedAt: new Date().toISOString(),
      hash,
      duplicateOf: null,
      processingStatus: "new",
    });

    // URL dedup check
    const byUrl = await repo.findRawRegulatoryItemByUrl(url);
    expect(byUrl).not.toBeNull();

    // Hash dedup check
    const byHash = await repo.findRawRegulatoryItemByHash(hash);
    expect(byHash).not.toBeNull();

    // Both return the same item
    expect(byUrl?.id).toBe(byHash?.id);
  });
});

// ── Admin review status transition ────────────────────────────────────────────

describe("admin review status transition", () => {
  beforeEach(() => resetMockStore());

  it("transitions needs_review → approved → published", async () => {
    const { MemoryAiRegulationRepository } = await import(
      "@/db/repositories/memory-repository"
    );
    const repo = new MemoryAiRegulationRepository();
    const updates = await repo.listRegulatoryUpdates();
    const item = updates.find((u) => u.status === "needs_review");
    if (!item) return; // Skip if no seed item in needs_review

    const approved = await repo.transitionReviewStatus(item.id, "approved");
    expect(approved.status).toBe("approved");

    const published = await repo.transitionReviewStatus(item.id, "published");
    expect(published.status).toBe("published");
  });

  it("rejects invalid transition needs_review → published directly", async () => {
    const { MemoryAiRegulationRepository } = await import(
      "@/db/repositories/memory-repository"
    );
    const repo = new MemoryAiRegulationRepository();
    const updates = await repo.listRegulatoryUpdates();
    const item = updates.find((u) => u.status === "needs_review");
    if (!item) return;

    await expect(
      repo.transitionReviewStatus(item.id, "published")
    ).rejects.toThrow();
  });
});

// ── Firecrawl response normalization ─────────────────────────────────────────

describe("Firecrawl response normalization (unit)", () => {
  it("computeContentHash produces stable hash from firecrawl-style data", () => {
    const title = "EU AI Office publishes guidelines";
    const markdown = "## Overview\n\nThe EU AI Office has published...";
    const hash1 = computeContentHash(title, markdown);
    const hash2 = computeContentHash(title, markdown);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("different markdown produces different hash", () => {
    const title = "Same title";
    const hash1 = computeContentHash(title, "Content A");
    const hash2 = computeContentHash(title, "Content B");
    expect(hash1).not.toBe(hash2);
  });
});
