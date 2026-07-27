import { describe, expect, it } from "vitest";

import { austriaMonitoringSourceRegistry } from "@/agents/ai-regulation/austriaNewsSources";
import { belgiumMonitoringSourceRegistry } from "@/agents/ai-regulation/belgiumNewsSources";
import { bulgariaMonitoringSourceRegistry } from "@/agents/ai-regulation/bulgariaNewsSources";
import { croatiaMonitoringSourceRegistry } from "@/agents/ai-regulation/croatiaNewsSources";
import { cyprusMonitoringSourceRegistry } from "@/agents/ai-regulation/cyprusNewsSources";
import { czechiaMonitoringSourceRegistry } from "@/agents/ai-regulation/czechiaNewsSources";
import { denmarkMonitoringSourceRegistry } from "@/agents/ai-regulation/denmarkNewsSources";
import { estoniaMonitoringSourceRegistry } from "@/agents/ai-regulation/estoniaNewsSources";
import { euNewsSourceRegistry } from "@/agents/ai-regulation/euNewsSources";
import { finlandMonitoringSourceRegistry } from "@/agents/ai-regulation/finlandNewsSources";
import { franceMonitoringSourceRegistry } from "@/agents/ai-regulation/franceNewsSources";
import { germanyMonitoringSourceRegistry } from "@/agents/ai-regulation/germanyNewsSources";
import { greeceMonitoringSourceRegistry } from "@/agents/ai-regulation/greeceNewsSources";
import { hungaryMonitoringSourceRegistry } from "@/agents/ai-regulation/hungaryNewsSources";
import { internationalMonitoringSourceRegistry } from "@/agents/ai-regulation/internationalNewsSources";
import { irelandMonitoringSourceRegistry } from "@/agents/ai-regulation/irelandNewsSources";
import { italyMonitoringSourceRegistry } from "@/agents/ai-regulation/italyNewsSources";
import { latviaMonitoringSourceRegistry } from "@/agents/ai-regulation/latviaNewsSources";
import { lithuaniaMonitoringSourceRegistry } from "@/agents/ai-regulation/lithuaniaNewsSources";
import { luxembourgMonitoringSourceRegistry } from "@/agents/ai-regulation/luxembourgNewsSources";
import { maltaMonitoringSourceRegistry } from "@/agents/ai-regulation/maltaNewsSources";
import { netherlandsMonitoringSourceRegistry } from "@/agents/ai-regulation/netherlandsNewsSources";
import { polandMonitoringSourceRegistry } from "@/agents/ai-regulation/polandNewsSources";
import { portugalMonitoringSourceRegistry } from "@/agents/ai-regulation/portugalNewsSources";
import { romaniaMonitoringSourceRegistry } from "@/agents/ai-regulation/romaniaNewsSources";
import { slovakiaMonitoringSourceRegistry } from "@/agents/ai-regulation/slovakiaNewsSources";
import { sloveniaMonitoringSourceRegistry } from "@/agents/ai-regulation/sloveniaNewsSources";
import { spainMonitoringSourceRegistry } from "@/agents/ai-regulation/spainNewsSources";
import { swedenMonitoringSourceRegistry } from "@/agents/ai-regulation/swedenNewsSources";
import {
  usDistrictMonitoringAgentDefinitions,
  usMonitoringAgentDefinitions,
  usStateMonitoringAgentDefinitions,
  usSubFederalMonitoringAgentDefinitions,
} from "@/agents/ai-regulation/usMonitoringAgentDefinitions";
import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

// Registry `sourceId` values are joined against seeded `regulation_sources.id`
// (see sourceRuntimeHealth.ts and the per-country getXAgentSourceIds helpers).
// A typo there does not throw — the source silently drops out of its scan
// profile and loses its runtime-health descriptor, which is how
// `src-council-of-europe-ai` hid from `eu_official_legal_scan`.
//
// The US agent definitions are deliberately excluded from this strict set: they
// declare ~217 source ids of which only the seeded New York lane resolves. The
// remainder are the not-yet-seeded state lanes tracked by master-plan item 2.6,
// not id drift. They are asserted separately below.
const monitoringRegistries: Record<string, ReadonlyArray<{ sourceId?: string }>> = {
  austria: austriaMonitoringSourceRegistry,
  belgium: belgiumMonitoringSourceRegistry,
  bulgaria: bulgariaMonitoringSourceRegistry,
  croatia: croatiaMonitoringSourceRegistry,
  cyprus: cyprusMonitoringSourceRegistry,
  czechia: czechiaMonitoringSourceRegistry,
  denmark: denmarkMonitoringSourceRegistry,
  estonia: estoniaMonitoringSourceRegistry,
  eu: euNewsSourceRegistry,
  finland: finlandMonitoringSourceRegistry,
  france: franceMonitoringSourceRegistry,
  germany: germanyMonitoringSourceRegistry,
  greece: greeceMonitoringSourceRegistry,
  hungary: hungaryMonitoringSourceRegistry,
  international: internationalMonitoringSourceRegistry,
  ireland: irelandMonitoringSourceRegistry,
  italy: italyMonitoringSourceRegistry,
  latvia: latviaMonitoringSourceRegistry,
  lithuania: lithuaniaMonitoringSourceRegistry,
  luxembourg: luxembourgMonitoringSourceRegistry,
  malta: maltaMonitoringSourceRegistry,
  netherlands: netherlandsMonitoringSourceRegistry,
  poland: polandMonitoringSourceRegistry,
  portugal: portugalMonitoringSourceRegistry,
  romania: romaniaMonitoringSourceRegistry,
  slovakia: slovakiaMonitoringSourceRegistry,
  slovenia: sloveniaMonitoringSourceRegistry,
  spain: spainMonitoringSourceRegistry,
  sweden: swedenMonitoringSourceRegistry,
};

const usAgentDefinitions = [
  ...usMonitoringAgentDefinitions,
  ...usStateMonitoringAgentDefinitions,
  ...usSubFederalMonitoringAgentDefinitions,
  ...usDistrictMonitoringAgentDefinitions,
];

describe("monitoring registry / seed integrity", () => {
  const seededSourceIds = new Set(regulationSourcesSeed.map((source) => source.id));

  it("resolves every registry sourceId to a seeded regulation source", () => {
    const orphans = Object.entries(monitoringRegistries).flatMap(([registry, entries]) =>
      entries
        .map((entry) => entry.sourceId)
        .filter((sourceId): sourceId is string => Boolean(sourceId))
        .filter((sourceId) => !seededSourceIds.has(sourceId))
        .map((sourceId) => `${registry}: ${sourceId}`),
    );

    expect(orphans).toEqual([]);
  });

  it("covers the Council of Europe source that the id drift had orphaned", () => {
    const councilOfEurope = euNewsSourceRegistry.find(
      (entry) => entry.id === "council-of-europe-ai",
    );

    expect(councilOfEurope?.sourceId).toBe("src-council-europe-ai");
    expect(seededSourceIds.has("src-council-europe-ai")).toBe(true);
  });

  it("checks a meaningful number of registry entries", () => {
    const withSourceId = Object.values(monitoringRegistries).flatMap((entries) =>
      entries.filter((entry) => entry.sourceId),
    );

    expect(withSourceId.length).toBeGreaterThan(150);
  });

  // The US lanes are declared far ahead of their seed data (master-plan 2.6).
  // Assert the direction that actually protects production: every seeded US
  // source must still be claimed by an agent definition, so a renamed seed id
  // cannot silently orphan a lane that is genuinely live.
  //
  // The three exceptions below are seeded and active, so the generic profile
  // pipeline still scans them at their declared daily cadence, but no US agent
  // definition groups them into a lane. That is a coverage gap to resolve with
  // 2.6, not a scan outage. If this list grows, a source was orphaned.
  it("keeps every seeded US source claimed by a US agent definition", () => {
    const declaredUsSourceIds = new Set(
      usAgentDefinitions.flatMap((definition) =>
        definition.sourceRegistry.map((entry) => entry.sourceId),
      ),
    );
    const seededUsSourceIds = regulationSourcesSeed
      .map((source) => source.id)
      .filter((id) => id.startsWith("src-us-") || id.startsWith("src-nycourts-"));

    expect(seededUsSourceIds.length).toBeGreaterThan(0);
    expect(seededUsSourceIds.filter((id) => !declaredUsSourceIds.has(id))).toEqual([
      "src-us-courtlistener-ai",
      "src-us-nyc-oti-ai",
      "src-us-ny-raise-act",
    ]);
  });
});
