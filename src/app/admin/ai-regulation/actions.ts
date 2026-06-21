'use server';

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { reviewWorkflow } from "@/agents/ai-regulation/processors/reviewWorkflow";
import {
  batchReviewTargetStatuses,
  batchTransitionReviewStatus,
  type BatchReviewTargetStatus,
} from "@/lib/admin-review-batch";
import {
  queueAndDrainScanJob,
  recoverStaleRunningScanJobs,
  processNextQueuedScanJob,
} from "@/agents/ai-regulation/processors/scanJobs";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { buildNewsItemFromUpdate } from "@/content/ai-regulation/news";
import {
  extractionMethods,
  developmentTypes,
  importanceLevels,
  confidenceLevels,
  jurisdictions,
  legalAreas,
  reliabilityLevels,
  scanFrequencies,
  sourceTypes,
  type ReviewStatus,
} from "@/db/schema";
import { assertAdminServerActionAccess } from "@/lib/admin-auth";

function getEnumValue<T extends readonly string[]>(
  values: T,
  input: FormDataEntryValue | null,
): T[number] | undefined {
  if (typeof input !== "string") return undefined;
  return values.includes(input) ? (input as T[number]) : undefined;
}

function parseTextareaList(input: FormDataEntryValue | null) {
  if (typeof input !== "string") return [];
  return input
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

const sourceCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sourceUrl: z.url(),
  jurisdiction: z.enum(jurisdictions).catch("United States federal"),
  region: z.string().trim().min(2).max(80).catch("North America"),
  country: z.string().trim().min(2).max(80).catch("United States"),
  sourceType: z.enum(sourceTypes).catch("static_page"),
  scanFrequency: z.enum(scanFrequencies).catch("daily"),
  reliabilityLevel: z.enum(reliabilityLevels).catch("medium"),
  preferredExtractionMethod: z.enum(extractionMethods).catch("html_static"),
  notes: z.string().trim().max(2000).catch(""),
});

export async function triggerSourceScan(formData: FormData) {
  await assertAdminServerActionAccess();
  const sourceId = String(formData.get("sourceId") ?? "");
  await queueAndDrainScanJob({
    sourceId: sourceId || undefined,
    trigger: "manual",
    requestedBy: "admin-action",
    leaseOwner: "admin-action",
  });
  revalidatePath("/admin/ai-regulation");
  if (sourceId) {
    revalidatePath(`/admin/ai-regulation/sources/${sourceId}`);
  }
}

export async function updateReviewStatus(formData: FormData) {
  await assertAdminServerActionAccess();
  const updateId = String(formData.get("updateId") ?? "");
  const status = String(formData.get("status") ?? "") as ReviewStatus;
  await reviewWorkflow.transition(updateId, status);
  revalidatePath("/admin/ai-regulation");
  revalidatePath(`/admin/ai-regulation/${updateId}`);
  revalidatePath("/ai-regulation");
}

// Bulk review (P2): apply one transition to many selected updates in a single
// submit, draining the needs_review backlog faster than one-by-one. Delegates
// to Codex's canonical `batchTransitionReviewStatus` (dedup, 100 cap, reviewer
// stamp, per-item error isolation) so prioritization/transition logic lives in
// one place.
export async function bulkUpdateReviewStatus(formData: FormData) {
  await assertAdminServerActionAccess();
  const status = String(formData.get("status") ?? "");
  if (!batchReviewTargetStatuses.includes(status as BatchReviewTargetStatus)) {
    return;
  }
  const ids = formData
    .getAll("updateId")
    .map((value) => String(value))
    .filter((value) => value.length > 0);
  if (ids.length === 0) return;

  await batchTransitionReviewStatus({
    ids,
    targetStatus: status as BatchReviewTargetStatus,
  });

  revalidatePath("/admin/ai-regulation");
  revalidatePath("/admin/ai-regulation/review");
  revalidatePath("/ai-regulation");
}

export async function saveUpdateDraft(formData: FormData) {
  await assertAdminServerActionAccess();
  const updateId = String(formData.get("updateId") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  await updateRepository.saveUpdateEdits(updateId, {
    title: String(formData.get("title") ?? ""),
    oneSentenceSummary: String(formData.get("oneSentenceSummary") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    whatHappened: String(formData.get("whatHappened") ?? ""),
    whyItMatters: String(formData.get("whyItMatters") ?? ""),
    practicalImpact: String(formData.get("practicalImpact") ?? ""),
    affectedParties: parseTextareaList(formData.get("affectedParties")),
    keyObligations: parseTextareaList(formData.get("keyObligations")),
    complianceDeadlines: parseTextareaList(formData.get("complianceDeadlines")),
    enforcementRisk: String(formData.get("enforcementRisk") ?? ""),
    legalArea: getEnumValue(legalAreas, formData.get("legalArea")),
    developmentType: getEnumValue(
      developmentTypes,
      formData.get("developmentType"),
    ),
    importanceLevel: getEnumValue(
      importanceLevels,
      formData.get("importanceLevel"),
    ),
    confidenceLevel: getEnumValue(
      confidenceLevels,
      formData.get("confidenceLevel"),
    ),
    tags,
  });
  const savedUpdate = await updateRepository.getUpdate(updateId);
  if (savedUpdate) {
    const [rawItem, source] = await Promise.all([
      updateRepository.getRawItem(savedUpdate.rawItemId),
      updateRepository.getSource(savedUpdate.sourceId),
    ]);
    if (rawItem) {
      const newsItem = buildNewsItemFromUpdate({
        update: savedUpdate,
        rawItem,
        source,
      });
      await updateRepository.upsertNewsItem({
        ...newsItem,
        regulatoryUpdateId: savedUpdate.id,
        rawItemId: savedUpdate.rawItemId,
      });
    }
    await updateRepository.addReviewEvent({
      regulatoryUpdateId: savedUpdate.id,
      sourceId: savedUpdate.sourceId,
      rawItemId: savedUpdate.rawItemId,
      eventType: "draft_saved",
      actor: "Admin Reviewer",
      previousStatus: savedUpdate.status,
      nextStatus: savedUpdate.status,
      notes: "Draft content saved from the admin review form.",
      metadata: {
        changedFields: [
          "title",
          "oneSentenceSummary",
          "summary",
          "whatHappened",
          "whyItMatters",
          "practicalImpact",
          "affectedParties",
          "keyObligations",
          "complianceDeadlines",
          "enforcementRisk",
          "legalArea",
          "developmentType",
          "importanceLevel",
          "confidenceLevel",
          "tags",
        ],
      },
    });
  }

  revalidatePath(`/admin/ai-regulation/${updateId}`);
  revalidatePath("/admin/ai-regulation");
  revalidatePath("/ai-regulation");
}

export async function createSource(formData: FormData) {
  await assertAdminServerActionAccess();
  const parsed = sourceCreateSchema.parse({
    name: formData.get("name"),
    sourceUrl: formData.get("sourceUrl"),
    jurisdiction: formData.get("jurisdiction"),
    region: formData.get("region"),
    country: formData.get("country"),
    sourceType: formData.get("sourceType"),
    scanFrequency: formData.get("scanFrequency"),
    reliabilityLevel: formData.get("reliabilityLevel"),
    preferredExtractionMethod: formData.get("preferredExtractionMethod"),
    notes: formData.get("notes"),
  });

  await updateRepository.addSource({
    id: `src-${randomUUID().slice(0, 12)}`,
    name: parsed.name,
    jurisdiction: parsed.jurisdiction,
    region: parsed.region,
    country: parsed.country,
    sourceUrl: parsed.sourceUrl,
    sourceType: parsed.sourceType,
    scanFrequency: parsed.scanFrequency,
    active: true,
    lastScannedAt: null,
    notes: parsed.notes,
    reliabilityLevel: parsed.reliabilityLevel,
    preferredExtractionMethod: parsed.preferredExtractionMethod,
    config: {},
  });

  revalidatePath("/admin/ai-regulation");
}

export async function toggleSource(formData: FormData) {
  await assertAdminServerActionAccess();
  const sourceId = String(formData.get("sourceId") ?? "");
  const active = String(formData.get("active") ?? "false") === "true";
  await updateRepository.updateSource(sourceId, { active });
  revalidatePath("/admin/ai-regulation");
  revalidatePath(`/admin/ai-regulation/sources/${sourceId}`);
}

// --- Discovery lead actions (F2 workflow) ---

const discoveryLeadStatuses = [
  "unresolved",
  "official_source_found",
  "corroborated",
  "converted_to_monitor_item",
  "rejected",
  "stale",
] as const;
type DiscoveryLeadStatus = (typeof discoveryLeadStatuses)[number];

export async function updateDiscoveryLeadStatus(formData: FormData) {
  await assertAdminServerActionAccess();
  const leadId = String(formData.get("leadId") ?? "");
  const rawStatus = String(formData.get("status") ?? "");
  const reviewerNotes = String(formData.get("reviewerNotes") ?? "") || null;

  if (!leadId) return;
  const status = discoveryLeadStatuses.includes(rawStatus as DiscoveryLeadStatus)
    ? (rawStatus as DiscoveryLeadStatus)
    : null;
  if (!status) return;

  await updateRepository.updateDiscoveryLead(leadId, {
    status,
    reviewerNotes,
    lastVerifiedAt: new Date().toISOString(),
    ...(status === "stale" ? { staleAt: new Date().toISOString() } : {}),
  });

  revalidatePath("/admin/ai-regulation");
}

export async function recoverStaleJobs() {
  await assertAdminServerActionAccess();
  await recoverStaleRunningScanJobs();
  revalidatePath("/admin/ai-regulation");
}

export async function drainNextQueuedJob() {
  await assertAdminServerActionAccess();
  await processNextQueuedScanJob({
    leaseOwner: "admin-action",
  });
  revalidatePath("/admin/ai-regulation");
}

export async function updateSourceConfig(formData: FormData) {
  await assertAdminServerActionAccess();
  const sourceId = String(formData.get("sourceId") ?? "");
  const scanFrequency = getEnumValue(scanFrequencies, formData.get("scanFrequency"));
  const reliabilityLevel = getEnumValue(
    reliabilityLevels,
    formData.get("reliabilityLevel"),
  );
  const preferredExtractionMethod = getEnumValue(
    extractionMethods,
    formData.get("preferredExtractionMethod"),
  );
  await updateRepository.updateSource(sourceId, {
    scanFrequency: scanFrequency ?? "daily",
    reliabilityLevel: reliabilityLevel ?? "medium",
    preferredExtractionMethod: preferredExtractionMethod ?? "html_static",
    notes: String(formData.get("notes") ?? ""),
  });
  revalidatePath("/admin/ai-regulation");
  revalidatePath(`/admin/ai-regulation/sources/${sourceId}`);
}
