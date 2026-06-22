import type { AgentApiCapability } from "@/agents/ai-regulation/agentApiCapabilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusMeta: Record<string, { label: string; chip: string }> = {
  available: { label: "Ready", chip: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" },
  missing_credentials: { label: "Missing credentials", chip: "border-red-400/40 bg-red-500/10 text-red-100" },
  needs_user_setup: { label: "Needs setup", chip: "border-amber-400/30 bg-amber-500/10 text-amber-100" },
  planned: { label: "Planned", chip: "border-white/10 bg-white/5 text-zinc-300" },
};

// Setup-needed capabilities first, then available, then planned.
const statusRank: Record<string, number> = {
  missing_credentials: 0,
  needs_user_setup: 1,
  available: 2,
  planned: 3,
};

/**
 * Environment / integration readiness: which agent capabilities have their
 * required env vars configured vs missing, and what to do about it. Reads the
 * `listAgentApiCapabilities()` contract (env presence computed server-side; the
 * values themselves are never exposed).
 */
export function AdminIntegrationsPanel({
  capabilities,
}: {
  capabilities: AgentApiCapability[];
}) {
  const sorted = [...capabilities].sort(
    (a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9),
  );
  const needsEnv = capabilities.filter((c) => c.missingEnvVars.length > 0).length;
  const ready = capabilities.filter((c) => c.status === "available").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span>Integrations &amp; environment</span>
          <span className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em]">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-100">
              {ready} ready
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 ${
                needsEnv > 0
                  ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                  : "border-white/10 bg-white/5 text-zinc-300"
              }`}
            >
              {needsEnv} need env vars
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-400">
          Capabilities and the environment variables they require. Configured
          values are detected server-side and never displayed. Set missing
          variables in your Vercel project, then redeploy.
        </p>
        {sorted.map((cap) => {
          const meta = statusMeta[cap.status] ?? statusMeta.planned;
          return (
            <div key={cap.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-white">{cap.label}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.18em] ${meta.chip}`}
                >
                  {meta.label}
                </span>
              </div>
              {cap.envVars.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cap.configuredEnvVars.map((name) => (
                    <span
                      key={name}
                      className="rounded border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-200"
                    >
                      ✓ {name}
                    </span>
                  ))}
                  {cap.missingEnvVars.map((name) => (
                    <span
                      key={name}
                      className="rounded border border-red-400/30 bg-red-500/10 px-1.5 py-0.5 font-mono text-[10px] text-red-200"
                    >
                      ✗ {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">No environment variables required.</p>
              )}
              {cap.userAction ? (
                <p className="mt-2 text-xs text-zinc-400">{cap.userAction}</p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
