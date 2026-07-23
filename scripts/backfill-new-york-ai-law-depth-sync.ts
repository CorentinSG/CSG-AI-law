import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import type {
  EditableRegulatoryUpdateFields,
  PagedResult,
  RegulatoryUpdateDraftInput,
} from "@/db/repository-types";

const editableUpdateFields = [
  "title",
  "jurisdiction",
  "region",
  "country",
  "publicationDate",
  "oneSentenceSummary",
  "summary",
  "whatHappened",
  "whyItMatters",
  "practicalImpact",
  "affectedParties",
  "keyObligations",
  "complianceDeadlines",
  "enforcementRisk",
  "importanceLevel",
  "confidenceLevel",
  "tags",
  "developmentType",
  "legalArea",
  "authorityType",
] as const satisfies readonly (keyof EditableRegulatoryUpdateFields)[];

function valuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function diffEditableUpdate(
  existing: AiRegulatoryUpdate,
  desired: RegulatoryUpdateDraftInput,
): EditableRegulatoryUpdateFields | null {
  let changed = false;

  for (const field of editableUpdateFields) {
    if (!valuesEqual(existing[field], desired[field])) {
      changed = true;
      break;
    }
  }

  if (!changed) return null;

  return Object.fromEntries(
    editableUpdateFields.map((field) => [field, desired[field]]),
  ) as EditableRegulatoryUpdateFields;
}

export async function collectAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<PagedResult<T>>,
  limit = 500,
): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(offset, limit);
    items.push(...page.items);
    if (!page.hasMore) return items;
    if (page.items.length === 0) {
      throw new Error("Paged read reported more rows but returned an empty page.");
    }
    offset += page.items.length;
  }
}
