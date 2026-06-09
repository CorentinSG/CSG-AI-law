import type { DiscoveryLead, DiscoveryLeadStatus } from "@/agents/ai-regulation/governance";
import type { RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";
import {
  extractDiscoveryLeadMetadata,
  isDiscoveryOnlySource,
} from "@/agents/ai-regulation/utils/discovery";
import {
  buildInitialVerificationMetadata,
  extractVerificationMetadata,
  type VerificationMetadata,
} from "@/agents/ai-regulation/verification";
import { getAiRegulationRepository } from "@/db/repository";
import type { ListPageParams, PagedResult } from "@/db/repository-types";

export interface DiscoveryLeadRecord {
  lead: DiscoveryLead;
  rawItem: RawRegulatoryItem | null;
  source: RegulationSource | null;
  verification: VerificationMetadata | null;
  storageMode: "dedicated" | "legacy_raw_item";
}

async function loadDedicatedDiscoveryLeadRecords(
  page: ListPageParams,
  status?: DiscoveryLeadStatus,
): Promise<PagedResult<DiscoveryLeadRecord>> {
  const repository = getAiRegulationRepository();
  const [sources, leadsPage] = await Promise.all([
    repository.listSources(),
    repository.listDiscoveryLeadsPage(status, page),
  ]);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const rawItemIds = leadsPage.items
    .map((lead) => lead.rawItemId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const rawItems = await repository.getRawRegulatoryItemsByIds(rawItemIds);
  const rawItemById = new Map(rawItems.map((item) => [item.id, item]));

  return {
    ...leadsPage,
    items: leadsPage.items.map((lead) => {
      const rawItem = lead.rawItemId ? (rawItemById.get(lead.rawItemId) ?? null) : null;
      const source = lead.sourceId ? (sourceById.get(lead.sourceId) ?? null) : null;
      return {
        lead,
        rawItem,
        source,
        verification: rawItem ? extractVerificationMetadata(rawItem) : null,
        storageMode: "dedicated" as const,
      };
    }),
  };
}

function mapVerificationStatusToLeadStatus(
  status: string | null | undefined,
  stale: boolean,
): DiscoveryLeadStatus {
  if (stale) return "stale";
  if (status === "corroborated") return "corroborated";
  if (status === "verified_for_review" || status === "official_source_found") {
    return "official_source_found";
  }
  if (status === "published") return "converted_to_monitor_item";
  if (status === "rejected") return "rejected";
  return "unresolved";
}

export function buildLegacyDiscoveryLeadRecord(
  rawItem: RawRegulatoryItem,
  source: RegulationSource | null,
): DiscoveryLeadRecord | null {
  if (!source || !isDiscoveryOnlySource(source)) return null;

  const discovery = extractDiscoveryLeadMetadata(rawItem);
  if (!discovery) return null;

  const verification =
    extractVerificationMetadata(rawItem) ??
    buildInitialVerificationMetadata({ rawItem, source });
  const corroboratingUrls =
    verification?.corroboratingSourceUrls ??
    (discovery.corroboratingSourceUrl ? [discovery.corroboratingSourceUrl] : []);

  return {
    lead: {
      id: `legacy-${rawItem.id}`,
      rawItemId: rawItem.id,
      sourceId: source.id,
      headline: discovery.headline ?? rawItem.rawTitle,
      discoverySourceUrl: discovery.discoverySourceUrl ?? rawItem.rawUrl,
      outboundUrl: discovery.outboundUrl ?? rawItem.rawUrl,
      detectedAt: discovery.detectedDate ?? rawItem.detectedAt,
      possibleJurisdiction: discovery.possibleJurisdiction,
      possibleTopic: discovery.possibleTopic,
      possibleLegalArea: discovery.possibleLegalArea,
      possibleAuthorityType: discovery.possibleAuthorityType,
      status: mapVerificationStatusToLeadStatus(
        verification?.verificationStatus ?? discovery.verificationStatus,
        verification?.stale ?? false,
      ),
      officialSourceFound:
        verification?.officialSourceFound ?? discovery.possibleOfficialSourceFound,
      officialSourceUrl:
        verification?.officialSourceUrl ?? discovery.possibleOfficialSourceUrl,
      corroboratingSourceCount:
        verification?.corroboratingSourcesCount ?? corroboratingUrls.length,
      corroboratingSourceUrls: corroboratingUrls,
      convertedUpdateId: null,
      reviewerNotes:
        verification?.reviewerNotes ??
        discovery.reviewerNotes ??
        "Non-official discovery lead - requires official verification.",
      lastVerifiedAt: verification?.lastVerifiedAt ?? null,
      staleAt: verification?.stale ? new Date().toISOString() : null,
      publicVisibilityAllowed: verification?.publicVisibilityAllowed ?? false,
      createdAt: rawItem.createdAt,
      updatedAt: rawItem.updatedAt,
    },
    rawItem,
    source,
    verification,
    storageMode: "legacy_raw_item",
  };
}

export async function loadDiscoveryLeadRecords(options?: {
  limit?: number;
  status?: DiscoveryLeadStatus;
}): Promise<DiscoveryLeadRecord[]> {
  const page = await loadDiscoveryLeadRecordsPage(options);
  return page.items;
}

export async function loadDiscoveryLeadRecordsPage(options?: {
  limit?: number;
  offset?: number;
  status?: DiscoveryLeadStatus;
}): Promise<PagedResult<DiscoveryLeadRecord>> {
  const repository = getAiRegulationRepository();
  const limit = options?.limit ?? 200;
  const offset = Math.max(0, options?.offset ?? 0);
  const dedicatedPage = await loadDedicatedDiscoveryLeadRecords(
    { limit, offset },
    options?.status,
  );

  if (dedicatedPage.total > 0) {
    return dedicatedPage;
  }

  const [sources, rawItems] = await Promise.all([
    repository.listSources(),
    repository.listRawRegulatoryItems(limit + offset),
  ]);
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  const legacyItems = rawItems
    .map((rawItem) =>
      buildLegacyDiscoveryLeadRecord(rawItem, sourceById.get(rawItem.sourceId) ?? null),
    )
    .filter((record): record is DiscoveryLeadRecord =>
      options?.status ? record?.lead.status === options.status : record !== null,
    );

  const items = legacyItems.slice(offset, offset + limit);
  return {
    items,
    total: legacyItems.length,
    limit,
    offset,
    hasMore: offset + items.length < legacyItems.length,
  };
}

export async function loadDiscoveryLeadRecordsBySourceId(
  sourceId: string,
  options?: { limit?: number; offset?: number; status?: DiscoveryLeadStatus },
) {
  const repository = getAiRegulationRepository();
  const limit = options?.limit ?? 200;
  const offset = Math.max(0, options?.offset ?? 0);
  const [sources, dedicatedLeads] = await Promise.all([
    repository.listSources(),
    repository.listDiscoveryLeads(undefined, options?.status),
  ]);
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  if (dedicatedLeads.length > 0) {
    const filteredLeads = dedicatedLeads.filter((lead) => lead.sourceId === sourceId);
    const windowedLeads = filteredLeads.slice(offset, offset + limit);
    const rawItemIds = windowedLeads
      .map((lead) => lead.rawItemId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    const rawItems = await repository.getRawRegulatoryItemsByIds(rawItemIds);
    const rawItemById = new Map(rawItems.map((item) => [item.id, item]));

    return windowedLeads.map((lead) => {
      const rawItem = lead.rawItemId ? (rawItemById.get(lead.rawItemId) ?? null) : null;
      return {
        lead,
        rawItem,
        source: lead.sourceId ? (sourceById.get(lead.sourceId) ?? null) : null,
        verification: rawItem ? extractVerificationMetadata(rawItem) : null,
        storageMode: "dedicated" as const,
      };
    });
  }

  const rawItems = await repository.listRawRegulatoryItems(limit + offset, sourceId);
  return rawItems
    .map((rawItem) =>
      buildLegacyDiscoveryLeadRecord(rawItem, sourceById.get(rawItem.sourceId) ?? null),
    )
    .filter((record): record is DiscoveryLeadRecord =>
      options?.status ? record?.lead.status === options.status : record !== null,
    )
    .slice(offset, offset + limit);
}

export async function findDiscoveryLeadRecordByRawItemId(
  rawItemId: string | null | undefined,
  options?: { limit?: number; status?: DiscoveryLeadStatus },
) {
  if (!rawItemId) return null;
  const repository = getAiRegulationRepository();
  const directLead = await repository.getDiscoveryLeadByRawItemId(rawItemId);

  if (directLead) {
    if (options?.status && directLead.status !== options.status) {
      return null;
    }
    const [rawItem, source] = await Promise.all([
      repository.getRawRegulatoryItemById(rawItemId),
      directLead.sourceId ? repository.getSourceById(directLead.sourceId) : Promise.resolve(null),
    ]);
    return {
      lead: directLead,
      rawItem,
      source,
      verification: rawItem ? extractVerificationMetadata(rawItem) : null,
      storageMode: "dedicated" as const,
    };
  }

  const records = await loadDiscoveryLeadRecords(options);
  return records.find(
    (record) => record.lead.rawItemId === rawItemId || record.rawItem?.id === rawItemId,
  ) ?? null;
}
