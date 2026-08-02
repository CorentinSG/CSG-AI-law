import { describe, expect, it } from "vitest";

import { prepareNewsItemsForDisplay } from "@/content/ai-regulation/news";

const NOW = new Date("2026-08-02T12:00:00.000Z");

type Item = {
  title: string;
  sourceName: string;
  detectedAt: string;
  eventDate: string | null;
  publicationDate: string | null;
};

function item(overrides: Partial<Item>): Item {
  return {
    title: "AI development",
    sourceName: "Official Source",
    detectedAt: "2026-07-30T08:00:00.000Z",
    eventDate: "2026-07-30",
    publicationDate: "2026-07-30",
    ...overrides,
  };
}

describe("prepareNewsItemsForDisplay", () => {
  // The observed defect: the same EU AI Office page, re-ingested with a
  // moving date, occupied three of the five front-page slots.
  it("collapses the same story from the same source to one card", () => {
    const out = prepareNewsItemsForDisplay(
      [
        item({ title: "The Structure of the AI Office", detectedAt: "2026-07-31T08:00:00.000Z" }),
        item({ title: "The Structure of the AI Office!", detectedAt: "2026-08-01T08:00:00.000Z" }),
        item({ title: "The Structure of the AI Office", detectedAt: "2026-07-29T08:00:00.000Z" }),
      ],
      NOW,
    );

    expect(out).toHaveLength(1);
    expect(out[0]!.detectedAt).toBe("2026-08-01T08:00:00.000Z");
  });

  it("keeps the same headline from two different sources apart", () => {
    const out = prepareNewsItemsForDisplay(
      [
        item({ sourceName: "EU AI Office" }),
        item({ sourceName: "European Commission" }),
      ],
      NOW,
    );

    expect(out).toHaveLength(2);
  });

  it("demotes future-dated items instead of pinning them on top", () => {
    const out = prepareNewsItemsForDisplay(
      [
        item({
          title: "Future-dated republication",
          eventDate: "2026-09-02",
          publicationDate: "2026-09-02",
          detectedAt: "2026-07-20T08:00:00.000Z",
        }),
        item({ title: "Real development", publicationDate: "2026-08-01", eventDate: "2026-08-01" }),
      ],
      NOW,
    );

    expect(out[0]!.title).toBe("Real development");
    expect(out[1]!.publicationDate).toBeNull();
    expect(out[1]!.eventDate).toBeNull();
  });

  it("orders the survivors newest first", () => {
    const out = prepareNewsItemsForDisplay(
      [
        item({ title: "Older", publicationDate: "2026-07-10", eventDate: null }),
        item({ title: "Newer", publicationDate: "2026-08-01", eventDate: null }),
      ],
      NOW,
    );

    expect(out.map((entry) => entry.title)).toEqual(["Newer", "Older"]);
  });
});
