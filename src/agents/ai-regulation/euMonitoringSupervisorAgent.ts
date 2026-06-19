import { runAustriaLegalNewsAgentScan } from "@/agents/ai-regulation/austriaLegalNewsAgent";
import { runBelgiumLegalNewsAgentScan } from "@/agents/ai-regulation/belgiumLegalNewsAgent";
import { runBulgariaLegalNewsAgentScan } from "@/agents/ai-regulation/bulgariaLegalNewsAgent";
import { runCroatiaLegalNewsAgentScan } from "@/agents/ai-regulation/croatiaLegalNewsAgent";
import { runCyprusLegalNewsAgentScan } from "@/agents/ai-regulation/cyprusLegalNewsAgent";
import { runCzechiaLegalNewsAgentScan } from "@/agents/ai-regulation/czechiaLegalNewsAgent";
import { runDenmarkLegalNewsAgentScan } from "@/agents/ai-regulation/denmarkLegalNewsAgent";
import { runEstoniaLegalNewsAgentScan } from "@/agents/ai-regulation/estoniaLegalNewsAgent";
import { runEuLegalNewsAgentScan } from "@/agents/ai-regulation/euLegalNewsAgent";
import { runFinlandLegalNewsAgentScan } from "@/agents/ai-regulation/finlandLegalNewsAgent";
import { runFranceLegalNewsAgentScan } from "@/agents/ai-regulation/franceLegalNewsAgent";
import { runGermanyLegalNewsAgentScan } from "@/agents/ai-regulation/germanyLegalNewsAgent";
import { runGreeceLegalNewsAgentScan } from "@/agents/ai-regulation/greeceLegalNewsAgent";
import { runHungaryLegalNewsAgentScan } from "@/agents/ai-regulation/hungaryLegalNewsAgent";
import { runIrelandLegalNewsAgentScan } from "@/agents/ai-regulation/irelandLegalNewsAgent";
import { runItalyLegalNewsAgentScan } from "@/agents/ai-regulation/italyLegalNewsAgent";
import { runLatviaLegalNewsAgentScan } from "@/agents/ai-regulation/latviaLegalNewsAgent";
import { runLithuaniaLegalNewsAgentScan } from "@/agents/ai-regulation/lithuaniaLegalNewsAgent";
import { runLuxembourgLegalNewsAgentScan } from "@/agents/ai-regulation/luxembourgLegalNewsAgent";
import { runMaltaLegalNewsAgentScan } from "@/agents/ai-regulation/maltaLegalNewsAgent";
import { runNetherlandsLegalNewsAgentScan } from "@/agents/ai-regulation/netherlandsLegalNewsAgent";
import { runPolandLegalNewsAgentScan } from "@/agents/ai-regulation/polandLegalNewsAgent";
import { runPortugalLegalNewsAgentScan } from "@/agents/ai-regulation/portugalLegalNewsAgent";
import { runRomaniaLegalNewsAgentScan } from "@/agents/ai-regulation/romaniaLegalNewsAgent";
import { runSlovakiaLegalNewsAgentScan } from "@/agents/ai-regulation/slovakiaLegalNewsAgent";
import { runSloveniaLegalNewsAgentScan } from "@/agents/ai-regulation/sloveniaLegalNewsAgent";
import { runSpainLegalNewsAgentScan } from "@/agents/ai-regulation/spainLegalNewsAgent";
import { runSwedenLegalNewsAgentScan } from "@/agents/ai-regulation/swedenLegalNewsAgent";
import {
  jurisdictionMonitoringMandate,
  supervisorMonitoringMandate,
  type MonitoringAgentMandate,
} from "@/agents/ai-regulation/monitoringAgentMandate";
import type { ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";

type CountryAgentRunner = (options?: { trigger?: ScanTrigger }) => Promise<unknown>;

export interface MonitoringAgentDescriptor {
  id: string;
  label: string;
  scope: "eu" | "member_state";
  country?: string;
  mandate: MonitoringAgentMandate;
  runner: CountryAgentRunner;
}

export const euMemberStateMonitoringAgents: MonitoringAgentDescriptor[] = [
  { id: "austria", label: "Austria Legal News Agent", scope: "member_state", country: "Austria", mandate: jurisdictionMonitoringMandate, runner: runAustriaLegalNewsAgentScan },
  { id: "belgium", label: "Belgium Legal News Agent", scope: "member_state", country: "Belgium", mandate: jurisdictionMonitoringMandate, runner: runBelgiumLegalNewsAgentScan },
  { id: "bulgaria", label: "Bulgaria Legal News Agent", scope: "member_state", country: "Bulgaria", mandate: jurisdictionMonitoringMandate, runner: runBulgariaLegalNewsAgentScan },
  { id: "croatia", label: "Croatia Legal News Agent", scope: "member_state", country: "Croatia", mandate: jurisdictionMonitoringMandate, runner: runCroatiaLegalNewsAgentScan },
  { id: "cyprus", label: "Cyprus Legal News Agent", scope: "member_state", country: "Cyprus", mandate: jurisdictionMonitoringMandate, runner: runCyprusLegalNewsAgentScan },
  { id: "czechia", label: "Czechia Legal News Agent", scope: "member_state", country: "Czechia", mandate: jurisdictionMonitoringMandate, runner: runCzechiaLegalNewsAgentScan },
  { id: "denmark", label: "Denmark Legal News Agent", scope: "member_state", country: "Denmark", mandate: jurisdictionMonitoringMandate, runner: runDenmarkLegalNewsAgentScan },
  { id: "estonia", label: "Estonia Legal News Agent", scope: "member_state", country: "Estonia", mandate: jurisdictionMonitoringMandate, runner: runEstoniaLegalNewsAgentScan },
  { id: "finland", label: "Finland Legal News Agent", scope: "member_state", country: "Finland", mandate: jurisdictionMonitoringMandate, runner: runFinlandLegalNewsAgentScan },
  { id: "france", label: "France Legal News Agent", scope: "member_state", country: "France", mandate: jurisdictionMonitoringMandate, runner: runFranceLegalNewsAgentScan },
  { id: "germany", label: "Germany Legal News Agent", scope: "member_state", country: "Germany", mandate: jurisdictionMonitoringMandate, runner: runGermanyLegalNewsAgentScan },
  { id: "greece", label: "Greece Legal News Agent", scope: "member_state", country: "Greece", mandate: jurisdictionMonitoringMandate, runner: runGreeceLegalNewsAgentScan },
  { id: "hungary", label: "Hungary Legal News Agent", scope: "member_state", country: "Hungary", mandate: jurisdictionMonitoringMandate, runner: runHungaryLegalNewsAgentScan },
  { id: "ireland", label: "Ireland Legal News Agent", scope: "member_state", country: "Ireland", mandate: jurisdictionMonitoringMandate, runner: runIrelandLegalNewsAgentScan },
  { id: "italy", label: "Italy Legal News Agent", scope: "member_state", country: "Italy", mandate: jurisdictionMonitoringMandate, runner: runItalyLegalNewsAgentScan },
  { id: "latvia", label: "Latvia Legal News Agent", scope: "member_state", country: "Latvia", mandate: jurisdictionMonitoringMandate, runner: runLatviaLegalNewsAgentScan },
  { id: "lithuania", label: "Lithuania Legal News Agent", scope: "member_state", country: "Lithuania", mandate: jurisdictionMonitoringMandate, runner: runLithuaniaLegalNewsAgentScan },
  { id: "luxembourg", label: "Luxembourg Legal News Agent", scope: "member_state", country: "Luxembourg", mandate: jurisdictionMonitoringMandate, runner: runLuxembourgLegalNewsAgentScan },
  { id: "malta", label: "Malta Legal News Agent", scope: "member_state", country: "Malta", mandate: jurisdictionMonitoringMandate, runner: runMaltaLegalNewsAgentScan },
  { id: "netherlands", label: "Netherlands Legal News Agent", scope: "member_state", country: "Netherlands", mandate: jurisdictionMonitoringMandate, runner: runNetherlandsLegalNewsAgentScan },
  { id: "poland", label: "Poland Legal News Agent", scope: "member_state", country: "Poland", mandate: jurisdictionMonitoringMandate, runner: runPolandLegalNewsAgentScan },
  { id: "portugal", label: "Portugal Legal News Agent", scope: "member_state", country: "Portugal", mandate: jurisdictionMonitoringMandate, runner: runPortugalLegalNewsAgentScan },
  { id: "romania", label: "Romania Legal News Agent", scope: "member_state", country: "Romania", mandate: jurisdictionMonitoringMandate, runner: runRomaniaLegalNewsAgentScan },
  { id: "slovakia", label: "Slovakia Legal News Agent", scope: "member_state", country: "Slovakia", mandate: jurisdictionMonitoringMandate, runner: runSlovakiaLegalNewsAgentScan },
  { id: "slovenia", label: "Slovenia Legal News Agent", scope: "member_state", country: "Slovenia", mandate: jurisdictionMonitoringMandate, runner: runSloveniaLegalNewsAgentScan },
  { id: "spain", label: "Spain Legal News Agent", scope: "member_state", country: "Spain", mandate: jurisdictionMonitoringMandate, runner: runSpainLegalNewsAgentScan },
  { id: "sweden", label: "Sweden Legal News Agent", scope: "member_state", country: "Sweden", mandate: jurisdictionMonitoringMandate, runner: runSwedenLegalNewsAgentScan },
];

export const euMonitoringAgents: MonitoringAgentDescriptor[] = [
  {
    id: "eu",
    label: "EU Legal News Agent",
    scope: "eu",
    mandate: supervisorMonitoringMandate,
    runner: runEuLegalNewsAgentScan,
  },
  ...euMemberStateMonitoringAgents,
];

export function listEuMonitoringAgents() {
  return euMonitoringAgents.map((agent) => ({
    id: agent.id,
    label: agent.label,
    scope: agent.scope,
    country: agent.country,
    mandate: agent.mandate,
  }));
}

export async function runEuMonitoringSupervisorAgent(options?: {
  trigger?: ScanTrigger;
  agentIds?: string[];
}) {
  const selectedIds = options?.agentIds ? new Set(options.agentIds) : null;
  const selectedAgents = selectedIds
    ? euMonitoringAgents.filter((agent) => selectedIds.has(agent.id))
    : euMonitoringAgents;
  const trigger = options?.trigger ?? "scheduled_local_test";

  const results = [];
  for (const agent of selectedAgents) {
    try {
      results.push({
        agentId: agent.id,
        status: "succeeded" as const,
        result: await agent.runner({ trigger }),
      });
    } catch (error) {
      results.push({
        agentId: agent.id,
        status: "failed" as const,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    trigger,
    totalAgents: selectedAgents.length,
    succeeded: results.filter((result) => result.status === "succeeded").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };
}
