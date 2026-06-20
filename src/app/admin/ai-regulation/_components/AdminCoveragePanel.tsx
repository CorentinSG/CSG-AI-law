import type { RegulationSource } from "@/agents/ai-regulation/types";
import type { DiscoveryLead, SourceHealthCheck } from "@/agents/ai-regulation/governance";
import { updateDiscoveryLeadStatus } from "@/app/admin/ai-regulation/actions";
import {
  buildSourceVerificationSummary,
  buildEuropeVerificationSummary,
} from "@/app/admin/ai-regulation/diagnostics";
import { PaginationControls } from "@/components/site/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EuropeCountryProfile } from "@/content/ai-regulation/europe-member-state-implementation";
import type { UsStateAiLawProfile } from "@/content/ai-regulation/us-state-ai-law-baseline";
import type { UsFederalBaselineEntry } from "@/content/ai-regulation/us-ai-legal-baseline";
import type { PagedResult } from "@/db/repository-types";

type EuropeVerificationSummary = ReturnType<typeof buildEuropeVerificationSummary>;

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

// Status labels and colors for the DiscoveryLead workflow
const statusColors: Record<string, string> = {
  unresolved: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  official_source_found: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  corroborated: "border-teal-400/30 bg-teal-500/10 text-teal-100",
  converted_to_monitor_item: "border-blue-400/30 bg-blue-500/10 text-blue-100",
  rejected: "border-red-400/30 bg-red-500/10 text-red-100",
  stale: "border-zinc-400/30 bg-zinc-500/10 text-zinc-300",
};

interface Props {
  europeVerification: EuropeVerificationSummary;
  europeCountryProfiles: EuropeCountryProfile[];
  discoveryLeadsPage: PagedResult<DiscoveryLead>;
  leadsPage: number;
  leadsPageSize: number;
  params: Record<string, string>;
  usStateBacklog: UsStateAiLawProfile[];
  usFederalSourceBacklog: UsFederalBaselineEntry[];
  sources: RegulationSource[];
  sourceHealthChecks: SourceHealthCheck[];
}

export function AdminCoveragePanel({
  europeVerification,
  europeCountryProfiles,
  discoveryLeadsPage,
  leadsPage,
  leadsPageSize,
  params,
  usStateBacklog,
  usFederalSourceBacklog,
  sources,
  sourceHealthChecks,
}: Props) {
  const discoveryLeads = discoveryLeadsPage.items;
  return (
    <>
      {/* Europe verification watchlist + source accessibility */}
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Europe verification watchlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Countries pending review</p>
                <p className="mt-2 text-sm text-zinc-100">{europeVerification.countriesPendingReview}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Timeline items below high confidence</p>
                <p className="mt-2 text-sm text-zinc-100">{europeVerification.lowerConfidenceMilestoneCount}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5">
              <p className="text-sm font-medium text-white">Member State implementation queue</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {europeVerification.pendingCountries.map((country) => (
                  <span
                    key={country.code}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200"
                  >
                    {country.code} / {country.confidence}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source accessibility posture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sources
              .map((source) => ({
                source,
                verification: buildSourceVerificationSummary(source, sourceHealthChecks),
              }))
              .filter(({ verification }) => verification.tone !== "success")
              .map(({ source, verification }) => (
                <div key={source.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5">
                  <p className="font-medium text-white">{source.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {verification.label} / {source.id}
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">{verification.detail}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </section>

      {/* Discovery leads — F2: uses dedicated discovery_leads repository */}
      <section className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Discovery leads — unresolved queue
              {discoveryLeadsPage.total > 0 ? (
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  ({discoveryLeadsPage.total} total)
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-500">
              Loaded from the dedicated <code>discovery_leads</code> table. Each lead has a structured status workflow: unresolved → official_source_found | corroborated | converted_to_monitor_item | rejected | stale.
            </p>
            {discoveryLeads.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No unresolved discovery leads in queue. Either all leads have been resolved, or no leads have been imported yet.
              </p>
            ) : (
              discoveryLeads.map((lead) => (
                <div key={lead.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-medium text-white">{lead.headline}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusColors[lead.status] ?? "border-zinc-400/30 bg-zinc-500/10 text-zinc-300"}`}>
                      {lead.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-zinc-400">
                    {lead.possibleJurisdiction ? <span>Jurisdiction: {lead.possibleJurisdiction}</span> : null}
                    {lead.possibleTopic ? <span>Topic: {lead.possibleTopic}</span> : null}
                    {lead.possibleLegalArea ? <span>Legal area: {lead.possibleLegalArea}</span> : null}
                    {lead.possibleAuthorityType ? <span>Authority hint: {lead.possibleAuthorityType}</span> : null}
                  </div>
                  {lead.outboundUrl ? (
                    <a href={lead.outboundUrl} target="_blank" rel="noreferrer"
                       className="mt-2 block text-sm text-zinc-300 underline decoration-white/20 underline-offset-4">
                      {lead.outboundUrl}
                    </a>
                  ) : null}
                  <div className="mt-2 grid gap-1 text-xs text-zinc-400">
                    <span>Official source found: {lead.officialSourceFound ? "yes" : "no"}</span>
                    {lead.officialSourceUrl ? <span>Official URL: {lead.officialSourceUrl}</span> : null}
                    <span>Corroborating sources: {lead.corroboratingSourceCount}</span>
                    {lead.lastVerifiedAt ? (
                      <span>Last verified: {formatDateTime(lead.lastVerifiedAt)}</span>
                    ) : (
                      <span className="text-zinc-500">Not yet verified</span>
                    )}
                    {lead.staleAt ? <span className="text-amber-300">Stale at: {formatDateTime(lead.staleAt)}</span> : null}
                  </div>
                  {lead.convertedUpdateId ? (
                    <p className="mt-2 text-xs text-blue-200">Converted to monitor item: {lead.convertedUpdateId}</p>
                  ) : null}
                  {lead.reviewerNotes ? (
                    <p className="mt-2 text-sm text-amber-200">{lead.reviewerNotes}</p>
                  ) : null}
                  <a href={lead.discoverySourceUrl} target="_blank" rel="noreferrer"
                     className="mt-2 block text-xs text-zinc-500 underline decoration-white/10 underline-offset-4">
                    Discovery source
                  </a>
                  {/* Workflow actions with reviewer notes */}
                  {lead.status === "unresolved" ? (
                    <div className="mt-3 space-y-2">
                      {/* Reviewer notes shared field */}
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                        Reviewer notes (optional — added to all actions below)
                      </p>
                      <form action={updateDiscoveryLeadStatus} className="space-y-2">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <textarea
                          name="reviewerNotes"
                          rows={2}
                          placeholder="Add a note before acting…"
                          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-white/20 focus:outline-none"
                        />
                        <input type="hidden" name="status" value="official_source_found" />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            formAction={updateDiscoveryLeadStatus}
                            name="status"
                            value="official_source_found"
                            className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/20"
                          >
                            Official source found
                          </button>
                          <button
                            type="submit"
                            formAction={updateDiscoveryLeadStatus}
                            name="status"
                            value="corroborated"
                            className="rounded-lg border border-teal-400/30 bg-teal-500/10 px-3 py-1.5 text-xs text-teal-100 hover:bg-teal-500/20"
                          >
                            Corroborated
                          </button>
                          <button
                            type="submit"
                            formAction={updateDiscoveryLeadStatus}
                            name="status"
                            value="rejected"
                            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                          >
                            Reject
                          </button>
                          <button
                            type="submit"
                            formAction={updateDiscoveryLeadStatus}
                            name="status"
                            value="stale"
                            className="rounded-lg border border-zinc-400/30 bg-zinc-500/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-500/20"
                          >
                            Mark stale
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}

                  {/* Convert to monitor item — available once official source or corroboration is confirmed */}
                  {(lead.status === "official_source_found" || lead.status === "corroborated") && !lead.convertedUpdateId ? (
                    <form action={updateDiscoveryLeadStatus} className="mt-3 space-y-2">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="status" value="converted_to_monitor_item" />
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                        Transition notes before converting
                      </p>
                      <textarea
                        name="reviewerNotes"
                        rows={2}
                        placeholder="Note the official source reference before converting…"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-white/20 focus:outline-none"
                      />
                      <p className="text-xs text-zinc-500">
                        Note: this marks the lead as converted. You must separately create the monitor entry via the scan pipeline or admin form.
                      </p>
                      <button
                        type="submit"
                        className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-500/20"
                      >
                        Mark as converted to monitor item
                      </button>
                    </form>
                  ) : null}
                </div>
              ))
            )}
            {discoveryLeadsPage.total > leadsPageSize ? (
              <PaginationControls
                basePath="/admin/ai-regulation"
                searchParams={params}
                page={leadsPage}
                pageSize={leadsPageSize}
                total={discoveryLeadsPage.total}
                pageParamKey="leadsPage"
              />
            ) : null}
          </CardContent>
        </Card>
      </section>

      {/* Europe country backlog */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Europe country verification backlog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {europeCountryProfiles.map((profile) => {
              const sourceCount =
                profile.nationalAIRegulationSources.length +
                profile.nationalCaseLawSources.length +
                profile.nationalSoftLawSources.length;
              const missingCompetentAuthorities = profile.nationalCompetentAuthorities.length === 0;
              const missingCaseLawVerification =
                profile.nationalCaseLawSources.length === 0 ||
                /not yet/i.test(profile.nationalCaseLawNotes);

              return (
                <div key={profile.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{profile.countryName}</p>
                      <p className="text-sm text-zinc-400">
                        {profile.implementationStatusLabel} / {profile.implementationConfidence}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500">{formatDateTime(profile.lastReviewedDate)}</p>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Source count", String(sourceCount)],
                      ["Competent authority", missingCompetentAuthorities ? "Missing verification" : "Verified"],
                      ["Case law posture", missingCaseLawVerification ? "Incomplete" : "Verified source present"],
                      ["Verification status", profile.sourceVerificationStatus.replaceAll("_", " ")],
                      ["Citation quality", profile.citationQualityStatus.replaceAll("_", " ")],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                        <p className="mt-2 text-sm text-zinc-100">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-zinc-300">{profile.publicSummary}</p>
                  {profile.missingSourceWarnings.length > 0 ? (
                    <p className="mt-2 text-sm text-amber-200">
                      Missing: {profile.missingSourceWarnings.join("; ")}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Europe profile limitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {europeCountryProfiles.map((profile) => (
              <div key={`${profile.slug}-notes`} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5">
                <p className="font-medium text-white">{profile.countryName}</p>
                <p className="mt-2 text-sm text-zinc-300">
                  {profile.editorialNotes[0] ?? "No additional note."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* US state + federal backlog */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>United States baseline verification backlog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usStateBacklog.slice(0, 12).map((profile) => (
              <div key={profile.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{profile.stateName}</p>
                    <p className="text-sm text-zinc-400">
                      {profile.aiLawStatusLabel} / {profile.confidenceLevel}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">{formatDateTime(profile.lastReviewedDate)}</p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {[
                    ["Source count", String(profile.sourceReferences.length)],
                    ["Citation quality", profile.citationQualityStatus.replaceAll("_", " ")],
                    ["Verification", profile.sourceVerificationStatus.replaceAll("_", " ")],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                      <p className="mt-2 text-sm text-zinc-100">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-zinc-300">{profile.publicSummary}</p>
                {profile.missingSourceWarnings.length > 0 ? (
                  <p className="mt-2 text-sm text-amber-200">
                    Missing: {profile.missingSourceWarnings.join("; ")}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Federal source parser backlog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usFederalSourceBacklog.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors duration-200 hover:bg-white/5">
                <p className="font-medium text-white">{entry.shortTitle}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {entry.sourceHealth.activeRecommendation} /{" "}
                  {entry.sourceHealth.parserStatus.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-sm text-zinc-300">{entry.sourceHealth.reliabilityNotes}</p>
                <p className="mt-2 text-sm text-zinc-500">
                  response status: {entry.sourceHealth.responseStatus ?? "n/a"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
