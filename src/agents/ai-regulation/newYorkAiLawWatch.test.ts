import { describe, expect, it } from "vitest";

import { usStateMonitoringAgentDefinitions } from "@/agents/ai-regulation/usMonitoringAgentDefinitions";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

describe("New York AI Law Watch monitoring descriptors", () => {
  it("adds focused New York live sources for courts, AEDT, agencies, legislation, and federal case-law discovery", () => {
    const newYork = usStateMonitoringAgentDefinitions.find(
      (definition) => definition.countryName === "New York",
    );

    expect(newYork).toBeDefined();

    const sourceIds = Array.from(new Set(newYork?.sourceRegistry.map((source) => source.sourceId)));

    expect(sourceIds).toEqual(
      expect.arrayContaining([
        "src-us-ny-courts-ai-decisions",
        "src-nycourts-part-161-ai",
        "src-us-ny-courtlistener-ai",
        "src-us-nyc-dcwp-aedt",
        "src-us-nyc-rules-aedt",
        "src-us-ny-legislature-ai",
        "src-nydfs-ai",
        "src-nyag-ai",
      ]),
    );

    const courtListener = newYork?.sourceRegistry.find(
      (source) => source.sourceId === "src-us-ny-courtlistener-ai",
    );
    expect(courtListener?.category).toBe("official_court_feed");
    expect(courtListener?.recommendedCadence).toBe("daily");
    expect(courtListener?.liveMonitoringEligible).toBe(true);
    expect(courtListener?.verificationEligible).toBe(true);
  });

  it("registers focused New York AI law watch sources as scannable Supabase seeds", () => {
    const seededIds = new Set(regulationSourcesSeed.map((source) => source.id));

    expect(Array.from(seededIds)).toEqual(
      expect.arrayContaining([
        "src-us-ny-courts-ai-decisions",
        "src-us-ny-courtlistener-ai",
        "src-us-nyc-dcwp-aedt",
        "src-us-nyc-rules-aedt",
        "src-us-nyc-oti-ai",
        "src-us-ny-legislature-ai",
        "src-us-ny-raise-act",
        "src-nycourts-part-161-ai",
        "src-nydfs-ai",
        "src-nyag-ai",
      ]),
    );
  });
});
