import { loadScriptEnv } from "../src/lib/load-script-env";

loadScriptEnv();

async function main() {
  const { getAiRegulationRepository, getRepositoryMode } = await import(
    "../src/db/repository"
  );
  const { buildLegalIntelligenceDataStewardReport } = await import(
    "../src/agents/ai-regulation/dataSteward"
  );
  const { buildLegalDatabaseIntegrityReport } = await import(
    "../src/agents/ai-regulation/legalIntegrity"
  );

  const repository = getAiRegulationRepository();
  const [updates, rawItems, sources, scanLogs] = await Promise.all([
    repository.listRegulatoryUpdates(undefined, "admin"),
    repository.listRawRegulatoryItems(1000),
    repository.listSources(),
    repository.listScanLogs(1000),
  ]);

  const stewardReport = buildLegalIntelligenceDataStewardReport({
    updates,
    rawItems,
    sources,
    scanLogs,
  });
  const integrityReport = buildLegalDatabaseIntegrityReport();

  console.log(`[report:data-quality] APP_DATA_MODE=${getRepositoryMode()}`);
  console.log(
    `[report:data-quality] sources total=${sources.length} active=${sources.filter((source) => source.active).length} inactive=${sources.filter((source) => !source.active).length}`,
  );
  console.log(
    `[report:data-quality] stewardship source_attention=${stewardReport.summary.sourceAttention} citation_warnings=${stewardReport.summary.citationWarnings} discovery_backlog=${stewardReport.summary.discoveryLeadsNeedingVerification} stale_or_due=${stewardReport.summary.staleOrDueCoverageItems} high_priority=${stewardReport.summary.highPriorityReviewItems}`,
  );
  console.log(
    `[report:data-quality] integrity total=${integrityReport.summary.total} high=${integrityReport.summary.high} medium=${integrityReport.summary.medium} low=${integrityReport.summary.low}`,
  );
  console.log(
    `[report:data-quality] public_items_with_warnings=${stewardReport.citationFindings.filter((finding) => finding.status === "published" && finding.warnings.length > 0).length}`,
  );

  const previewFindings = integrityReport.findings.slice(0, 20);
  for (const finding of previewFindings) {
    console.log(
      `[report:data-quality] finding severity=${finding.severity} area=${finding.area} code=${finding.code} affected=${finding.affectedId ?? "n/a"} message=${finding.message}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        stewardship: stewardReport.summary,
        integrity: integrityReport.summary,
        sampleFindings: previewFindings,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
