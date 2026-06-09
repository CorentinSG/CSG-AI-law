import {
  buildLegalIntelligenceDataStewardReport,
  syncLegalIntelligenceDataStewardFindings,
} from "@/agents/ai-regulation/dataSteward";
import { loadDiscoveryLeadRecords } from "@/agents/ai-regulation/utils/discovery-lead-records";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";

export async function runDataStewardSync() {
  const [updates, rawItems, sources, scanLogs, discoveryLeadRecords] = await Promise.all([
    updateRepository.listUpdates(),
    updateRepository.getRawItems(250),
    updateRepository.getSources(),
    updateRepository.getScanLogs(150),
    loadDiscoveryLeadRecords({ limit: 250 }),
  ]);

  const report = buildLegalIntelligenceDataStewardReport({
    updates,
    rawItems,
    sources,
    scanLogs,
    discoveryLeads: discoveryLeadRecords,
  });

  const persisted = await syncLegalIntelligenceDataStewardFindings(report);

  return {
    report,
    persisted,
  };
}
