import {
  listGlobalMonitoringAgents,
  runGlobalMonitoringSupervisorAgent,
} from "@/agents/ai-regulation/globalMonitoringSupervisorAgent";
import type { GenericCountryAgentProfileId } from "@/agents/ai-regulation/countryLegalNewsAgentFactory";
import type { ScanTrigger } from "@/agents/ai-regulation/processors/pipeline";

export type GlobalSupervisorChatAction =
  | "status"
  | "list_agents"
  | "run_supervisor";

export interface GlobalSupervisorChatRequest {
  message?: string;
  action?: GlobalSupervisorChatAction;
  regions?: Array<"eu" | "us">;
  profile?: GenericCountryAgentProfileId;
  dryRun?: boolean;
}

function inferAction(message: string | undefined): GlobalSupervisorChatAction {
  const normalized = message?.toLowerCase() ?? "";
  if (/\b(run|launch|start|scan|execute|lance|demarre|démarre|scan)\b/.test(normalized)) {
    return "run_supervisor";
  }
  if (/\b(list|agents?|inventory|inventaire|liste|combien)\b/.test(normalized)) {
    return "list_agents";
  }
  return "status";
}

function buildSummary() {
  const registry = listGlobalMonitoringAgents();
  const euSupervisor = registry.regionalSupervisors.find(
    (agent) => agent.id === "eu-monitoring-supervisor",
  );
  const usSupervisor = registry.regionalSupervisors.find(
    (agent) => agent.id === "us-monitoring-supervisor",
  );

  return {
    supervisor: registry.supervisor,
    counts: {
      eu: euSupervisor?.managedAgents.length ?? 0,
      us: usSupervisor?.managedAgents.length ?? 0,
      design: registry.crossFunctionalAgents.length,
      totalManaged:
        (euSupervisor?.managedAgents.length ?? 0) +
        (usSupervisor?.managedAgents.length ?? 0) +
        registry.crossFunctionalAgents.length,
    },
    regionalSupervisors: registry.regionalSupervisors.map((agent) => ({
      id: agent.id,
      label: agent.label,
      region: agent.region,
      managedAgentCount: agent.managedAgents.length,
    })),
    crossFunctionalAgents: registry.crossFunctionalAgents,
  };
}

export async function handleGlobalSupervisorChat(
  request: GlobalSupervisorChatRequest,
) {
  const action = request.action ?? inferAction(request.message);
  const summary = buildSummary();

  if (action === "list_agents") {
    return {
      ok: true,
      action,
      reply:
        "Voici l'inventaire opérationnel: superviseur UE, superviseur US et agent design sont rattachés au superviseur global.",
      registry: listGlobalMonitoringAgents(),
      summary,
    };
  }

  if (action === "run_supervisor") {
    if (request.dryRun !== false) {
      return {
        ok: true,
        action,
        dryRun: true,
        reply:
          "Je suis prêt à lancer le superviseur global. Renvoie la requête avec dryRun=false pour exécuter réellement les superviseurs UE/US.",
        summary,
      };
    }

    const result = await runGlobalMonitoringSupervisorAgent({
      trigger: "manual" satisfies ScanTrigger,
      profile: request.profile,
      regions: request.regions,
    });

    return {
      ok: true,
      action,
      dryRun: false,
      reply: "Le superviseur global a exécuté les superviseurs demandés.",
      summary,
      result,
    };
  }

  return {
    ok: true,
    action,
    reply:
      "Le superviseur global est joignable. Il coordonne le monitoring UE, le monitoring US et l'agent design.",
    summary,
    availableActions: ["status", "list_agents", "run_supervisor"] as const,
  };
}
