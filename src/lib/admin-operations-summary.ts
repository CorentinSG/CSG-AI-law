import { listAgentApiCapabilities } from "@/agents/ai-regulation/agentApiCapabilities";
import { listGlobalMonitoringAgents } from "@/agents/ai-regulation/globalMonitoringSupervisorAgent";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getSourceRuntimeHealthSummaries } from "@/agents/ai-regulation/sourceRuntimeHealth";
import { getCountryDatabaseReadiness } from "@/lib/country-database-readiness";
import { buildHealthSnapshot } from "@/lib/health";

const REVIEW_STATUSES = ["needs_review", "approved", "published", "rejected", "archived"] as const;
const DATA_QUALITY_SEVERITIES = ["high", "medium", "low"] as const;
const SCAN_JOB_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "partial_success",
  "failed",
  "cancelled",
] as const;

function countBy<T extends string>(values: T[]) {
  return Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;
}

async function countUpdatesByStatus() {
  const entries = await Promise.all(
    REVIEW_STATUSES.map(async (status) => {
      const page = await updateRepository.listUpdatesPage(
        { status },
        { limit: 1, offset: 0 },
      );
      return [status, page.total] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<(typeof REVIEW_STATUSES)[number], number>;
}

async function countDataQualityBySeverity() {
  const findings = await updateRepository.getDataQualityFindings(500);
  const counts = countBy([...DATA_QUALITY_SEVERITIES]);
  for (const finding of findings) {
    if (finding.severity === "high" || finding.severity === "medium" || finding.severity === "low") {
      counts[finding.severity] += 1;
    }
  }
  return {
    total: findings.length,
    bySeverity: counts,
  };
}

export async function buildAdminOperationsSummary(options?: { now?: Date }) {
  const now = options?.now ?? new Date();
  const [
    health,
    updatesByStatus,
    newsAdminPage,
    newsPublicPage,
    sources,
    sourceHealth,
    scanJobs,
    discoveryLeadsPage,
    countries,
    dataQuality,
    countryReadiness,
  ] = await Promise.all([
    buildHealthSnapshot({ access: "authenticated", now }),
    countUpdatesByStatus(),
    updateRepository.getNewsItemsPage({ limit: 1, offset: 0 }),
    updateRepository.getPublicNewsItemsPage({ limit: 1, offset: 0 }),
    updateRepository.getSources(),
    getSourceRuntimeHealthSummaries({ now, limitPerCollection: 500 }),
    updateRepository.getScanJobs(200),
    updateRepository.listDiscoveryLeadsPage(undefined, { limit: 1, offset: 0 }),
    updateRepository.listCountryIntelligence(),
    countDataQualityBySeverity(),
    getCountryDatabaseReadiness({ now }),
  ]);

  const capabilities = listAgentApiCapabilities();
  const monitoringAgents = listGlobalMonitoringAgents();
  const scanJobCounts = countBy([...SCAN_JOB_STATUSES]);
  for (const job of scanJobs) {
    if (job.status in scanJobCounts) {
      scanJobCounts[job.status as keyof typeof scanJobCounts] += 1;
    }
  }

  const sourceHealthCounts = countBy(["healthy", "degraded", "stale", "inactive"] as const);
  for (const source of sourceHealth) {
    sourceHealthCounts[source.state] += 1;
  }

  const capabilityCounts = countBy(["available", "missing_credentials", "needs_user_setup", "planned"] as const);
  for (const capability of capabilities) {
    capabilityCounts[capability.status] += 1;
  }

  return {
    checkedAt: now.toISOString(),
    health,
    content: {
      regulatoryUpdates: {
        total: Object.values(updatesByStatus).reduce((sum, value) => sum + value, 0),
        byStatus: updatesByStatus,
      },
      news: {
        total: newsAdminPage.total,
        public: newsPublicPage.total,
        adminOnly: Math.max(0, newsAdminPage.total - newsPublicPage.total),
      },
      countryDatabases: {
        total: countries.length,
        byReviewStatus: countries.reduce<Record<string, number>>((counts, country) => {
          counts[country.reviewStatus] = (counts[country.reviewStatus] ?? 0) + 1;
          return counts;
        }, {}),
      },
      discoveryLeads: {
        total: discoveryLeadsPage.total,
      },
    },
    operations: {
      worker: health.worker,
      coverage: health.coverage,
      scans: health.scans,
      scanJobs: {
        sampled: scanJobs.length,
        byStatus: scanJobCounts,
      },
      sources: {
        total: sources.length,
        active: sources.filter((source) => source.active).length,
        byRuntimeState: sourceHealthCounts,
      },
      dataQuality,
      countryReadiness: {
        summary: countryReadiness.summary,
        topBlockers: countryReadiness.blockers.slice(0, 10),
      },
    },
    agents: {
      regionalSupervisors: monitoringAgents.regionalSupervisors.length,
      managedAgents: monitoringAgents.regionalSupervisors.reduce(
        (sum, supervisor) => sum + supervisor.managedAgents.length,
        0,
      ),
      crossFunctionalAgents: monitoringAgents.crossFunctionalAgents.length,
      capabilities: {
        total: capabilities.length,
        byStatus: capabilityCounts,
        missing: capabilities
          .filter(
            (capability) =>
              capability.status === "missing_credentials" ||
              capability.status === "needs_user_setup",
          )
          .map((capability) => ({
            id: capability.id,
            label: capability.label,
            status: capability.status,
            envVars: capability.envVars,
            missingEnvVars: capability.missingEnvVars,
            configuredEnvVars: capability.configuredEnvVars,
            userAction: capability.userAction ?? null,
          })),
      },
    },
  };
}
