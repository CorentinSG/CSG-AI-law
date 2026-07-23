import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import type { EditableRegulatoryUpdateFields } from "@/db/repository-types";

import type { NewYorkAiLawDepthEntry } from "./new-york-ai-law-depth";

export const correctedNewYorkEntryTitles = [
  "LOADinG Act requires human oversight of state-agency automated decision-making",
  "RAISE Act creates New York frontier-model safety and reporting obligations",
  "RAISE Act chapter amendment finalizes frontier-developer duties before the 2027 effective date",
  "GBL Article 47 imposes safeguards on AI companion models",
  "Digital replica contract law conditions performer voice and likeness agreements",
  "Civil Rights Law 50-f protects deceased performers against unauthorized digital replicas",
  "Election Law 14-106 requires disclosure of AI-manipulated political communications",
  "SAFE for Kids Act regulates addictive algorithmic feeds for minors",
  "NYS-P24-001 sets AI acceptable-use rules for covered state agencies",
  "NYC AI Action Plan structures citywide responsible-AI governance",
  "NYT v OpenAI motion-to-dismiss ruling lets core copyright claims proceed",
] as const;

const legacyTitlesByCurrentTitle = new Map<string, string[]>([
  [
    "LOADinG Act requires human oversight of state-agency automated decision-making",
    ["LOADinG Act limits unauthorized state-agency automated decision-making"],
  ],
  [
    "NYS-P24-001 sets AI acceptable-use rules for covered state agencies",
    ["NYS-P24-001 sets acceptable-use rules for AI across state entities"],
  ],
]);

export function isCorrectedNewYorkEntry(entry: NewYorkAiLawDepthEntry) {
  return correctedNewYorkEntryTitles.includes(
    entry.title as (typeof correctedNewYorkEntryTitles)[number],
  );
}

export function findExistingNewYorkUpdate(
  entry: NewYorkAiLawDepthEntry,
  updates: AiRegulatoryUpdate[],
) {
  const acceptedTitles = new Set([
    entry.title,
    ...(legacyTitlesByCurrentTitle.get(entry.title) ?? []),
  ]);
  const matches = updates.filter(
    (update) =>
      update.tags.includes("new-york-ai-law-watch") &&
      acceptedTitles.has(update.title),
  );

  if (matches.length > 1) {
    throw new Error(
      `Multiple New York AI Law Watch updates match "${entry.title}": ${matches
        .map((update) => update.id)
        .join(", ")}`,
    );
  }

  return matches[0] ?? null;
}

export function listChangedUpdateFields(
  existing: AiRegulatoryUpdate,
  patch: EditableRegulatoryUpdateFields,
) {
  return (Object.keys(patch) as Array<keyof EditableRegulatoryUpdateFields>).filter(
    (field) => JSON.stringify(existing[field]) !== JSON.stringify(patch[field]),
  );
}
