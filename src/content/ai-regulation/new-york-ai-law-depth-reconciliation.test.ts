import { describe, expect, it } from "vitest";

import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";

import { newYorkAiLawDepthEntries } from "./new-york-ai-law-depth";
import {
  correctedNewYorkEntryTitles,
  findExistingNewYorkUpdate,
  isCorrectedNewYorkEntry,
  listChangedUpdateFields,
} from "./new-york-ai-law-depth-reconciliation";

function update(
  input: Pick<AiRegulatoryUpdate, "id" | "title"> &
    Partial<Pick<AiRegulatoryUpdate, "tags" | "summary" | "sourceUrl">>,
) {
  return {
    id: input.id,
    title: input.title,
    tags: input.tags ?? ["new-york-ai-law-watch"],
    summary: input.summary ?? "Old summary",
    sourceUrl: input.sourceUrl ?? "https://example.com/old",
  } as AiRegulatoryUpdate;
}

describe("New York AI law depth reconciliation", () => {
  it("limits the corrective replay to the reviewed entries and the LOADinG title repair", () => {
    expect(newYorkAiLawDepthEntries.filter(isCorrectedNewYorkEntry)).toHaveLength(11);
    expect(new Set(correctedNewYorkEntryTitles).size).toBe(11);
  });

  it("matches the legacy NYS-P24-001 title without creating a duplicate", () => {
    const entry = newYorkAiLawDepthEntries.find((candidate) =>
      candidate.title.startsWith("NYS-P24-001"),
    );
    expect(entry).toBeDefined();

    const existing = update({
      id: "upd-p24",
      title: "NYS-P24-001 sets acceptable-use rules for AI across state entities",
    });

    expect(findExistingNewYorkUpdate(entry!, [existing])?.id).toBe("upd-p24");
  });

  it("matches the production LOADinG title variant without creating a duplicate", () => {
    const entry = newYorkAiLawDepthEntries.find((candidate) =>
      candidate.title.startsWith("LOADinG Act"),
    );
    expect(entry).toBeDefined();

    const existing = update({
      id: "upd-loading",
      title: "LOADinG Act limits unauthorized state-agency automated decision-making",
    });

    expect(findExistingNewYorkUpdate(entry!, [existing])?.id).toBe("upd-loading");
  });

  it("rejects ambiguous matches instead of updating an arbitrary duplicate", () => {
    const entry = newYorkAiLawDepthEntries.find((candidate) =>
      candidate.title.startsWith("SAFE for Kids Act"),
    );
    expect(entry).toBeDefined();

    expect(() =>
      findExistingNewYorkUpdate(entry!, [
        update({ id: "upd-a", title: entry!.title }),
        update({ id: "upd-b", title: entry!.title }),
      ]),
    ).toThrow("Multiple New York AI Law Watch updates match");
  });

  it("reports only fields whose persisted value would change", () => {
    const existing = update({
      id: "upd-1",
      title: "Example",
      summary: "Old summary",
      sourceUrl: "https://example.com/same",
    });

    expect(
      listChangedUpdateFields(existing, {
        summary: "Corrected summary",
        sourceUrl: "https://example.com/same",
      }),
    ).toEqual(["summary"]);
  });

});
