import { describe, expect, it } from "vitest";

import {
  buildCursorHref,
  buildPageHref,
  decodeCursor,
  encodeCursor,
  getOffsetFromPage,
  parseCursorParam,
  parsePageParam,
} from "@/lib/pagination";

describe("pagination helpers", () => {
  it("parses page params conservatively", () => {
    expect(parsePageParam("3")).toBe(3);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam(["5"])).toBe(5);
  });

  it("computes offsets from page numbers", () => {
    expect(getOffsetFromPage(1, 18)).toBe(0);
    expect(getOffsetFromPage(3, 18)).toBe(36);
  });

  it("round-trips cursor through encode/decode", () => {
    const cursor = { date: "2024-11-15", tiebreaker: "2024-11-16T10:00:00.000Z" };
    const encoded = encodeCursor(cursor);
    expect(decodeCursor(encoded)).toEqual(cursor);
  });

  it("encodes a null-date cursor (empty string date)", () => {
    const cursor = { date: "", tiebreaker: "2024-11-16T10:00:00.000Z" };
    const encoded = encodeCursor(cursor);
    expect(decodeCursor(encoded)).toEqual(cursor);
  });

  it("decodeCursor returns null for invalid input", () => {
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("not-base64url-json")).toBeNull();
    expect(decodeCursor(encodeCursor({ date: "2024-01-01", tiebreaker: "x" }).slice(0, 5))).toBeNull();
  });

  it("parseCursorParam handles array param and undefined", () => {
    const cursor = { date: "2024-01-01", tiebreaker: "2024-01-02T00:00:00Z" };
    const encoded = encodeCursor(cursor);
    expect(parseCursorParam(encoded)).toEqual(cursor);
    expect(parseCursorParam([encoded, "other"])).toEqual(cursor);
    expect(parseCursorParam(undefined)).toBeNull();
  });

  it("buildCursorHref sets cursor param and preserves other params", () => {
    const href = buildCursorHref(
      "/ai-regulation",
      { view: "news", region: "Europe", after: "old-cursor" },
      "new-cursor",
      "after",
    );
    expect(href).toBe("/ai-regulation?view=news&region=Europe&after=new-cursor");
  });

  it("builds pagination hrefs while preserving active filters", () => {
    expect(
      buildPageHref(
        "/news",
        {
          region: "Europe",
          page: "2",
          topic: "AI governance",
          verificationStatus: "all",
        },
        3,
      ),
    ).toBe("/news?region=Europe&topic=AI+governance&page=3");

    expect(buildPageHref("/news", { page: "2" }, 1)).toBe("/news");
  });
});
