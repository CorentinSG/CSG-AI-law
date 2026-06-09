import { describe, expect, it } from "vitest";

import { mapSourceRow, mapUpdateRow, updateToInsert } from "@/db/supabase-mappers";
import { aiRegulatoryUpdatesSeed } from "@/db/seed/ai-regulation-seed";

describe("supabase mappers", () => {
  it("maps regulatory update objects to insert rows and back", () => {
    const seed = aiRegulatoryUpdatesSeed[0];
    if (!seed) {
      throw new Error("Expected seeded regulatory update.");
    }

    const row = updateToInsert(seed);
    const mapped = mapUpdateRow({
      ...row,
      created_at: seed.createdAt,
      updated_at: seed.updatedAt,
    });

    expect(mapped.title).toBe(seed.title);
    expect(mapped.status).toBe(seed.status);
    expect(mapped.tags).toEqual(seed.tags);
  });

  it("reconstructs legacy France API source metadata when Supabase rows lost granular config", () => {
    const mapped = mapSourceRow({
      id: "src-fr-newsapi-ai",
      name: "France AI legal news discovery via NewsAPI",
      jurisdiction: "France",
      region: "Europe",
      country: "France",
      source_url:
        "https://newsapi.org/v2/everything?q=%22intelligence%20artificielle%22&language=fr",
      source_type: "static_page",
      scan_frequency: "hourly",
      active: true,
      last_scanned_at: null,
      notes: "",
      reliability_level: "medium",
      preferred_extraction_method: "api",
      config: {},
      created_at: "2026-06-02T00:00:00.000Z",
      updated_at: "2026-06-02T00:00:00.000Z",
    });

    expect(mapped.sourceType).toBe("media_source");
    expect(mapped.config?.apiProvider).toBe("newsapi");
  });

  it("reconstructs legacy Judilibre metadata when source rows were flattened", () => {
    const mapped = mapSourceRow({
      id: "src-fr-judilibre-ai",
      name: "Judilibre France AI case-law discovery",
      jurisdiction: "France",
      region: "Europe",
      country: "France",
      source_url:
        "https://api.piste.gouv.fr/cassation/judilibre/v1.0/search?query=intelligence%20artificielle&page_size=10",
      source_type: "legislative_database",
      scan_frequency: "hourly",
      active: true,
      last_scanned_at: null,
      notes: "",
      reliability_level: "high",
      preferred_extraction_method: "api",
      config: {},
      created_at: "2026-06-02T00:00:00.000Z",
      updated_at: "2026-06-02T00:00:00.000Z",
    });

    expect(mapped.sourceType).toBe("court_database");
    expect(mapped.config?.apiProvider).toBe("judilibre");
  });

  it("reconstructs legacy Europe discovery API metadata when source rows were flattened", () => {
    const mapped = mapSourceRow({
      id: "src-eu-gdelt-ai",
      name: "European AI legal news discovery (GDELT)",
      jurisdiction: "European Union",
      region: "Europe",
      country: "European Union",
      source_url:
        "https://api.gdeltproject.org/api/v2/doc/doc?query=%22AI%20Act%22&mode=artlist&format=json&maxrecords=20",
      source_type: "static_page",
      scan_frequency: "hourly",
      active: true,
      last_scanned_at: null,
      notes: "",
      reliability_level: "medium",
      preferred_extraction_method: "api",
      config: {},
      created_at: "2026-06-02T00:00:00.000Z",
      updated_at: "2026-06-02T00:00:00.000Z",
    });

    expect(mapped.sourceType).toBe("discovery_source");
    expect(mapped.config?.apiProvider).toBe("gdelt");
  });
});
