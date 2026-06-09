import { notFound } from "next/navigation";

import { assessCitationQuality, getCitationReferences } from "@/agents/ai-regulation/citations";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { findDiscoveryLeadRecordByRawItemId } from "@/agents/ai-regulation/utils/discovery-lead-records";
import {
  deriveUpdateAuthorityType,
  getAuthorityPresentation,
} from "@/agents/ai-regulation/utils/authority";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import {
  buildDiscoveryLeadRecordSummary,
  buildDiscoveryLeadSummary,
} from "@/app/admin/ai-regulation/diagnostics";
import {
  buildAdminAiReviewState,
  formatAdminAiSafetyLabels,
} from "@/app/admin/ai-regulation/review-metadata";
import { buildAdminReviewTraceability } from "@/app/admin/ai-regulation/review-traceability";
import { saveUpdateDraft, updateReviewStatus } from "@/app/admin/ai-regulation/actions";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function joinLines(values: string[]) {
  return values.join("\n");
}

export default async function AdminUpdateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const update = await updateRepository.getUpdate(id);
  if (!update) notFound();

  const [rawItem, processingLogs, reviewEvents, verificationAttempts] = await Promise.all([
    updateRepository.getRawItem(update.rawItemId),
    updateRepository.getProcessingLogs(120),
    updateRepository.getReviewEvents(update.id, 25),
    updateRepository.getVerificationAttempts(update.rawItemId, 25),
  ]);
  const source = await updateRepository.getSource(update.sourceId);
  const discoveryLeadRecord = await findDiscoveryLeadRecordByRawItemId(update.rawItemId, {
    limit: 250,
  });
  const aiReviewState = buildAdminAiReviewState(update, processingLogs);
  const authority = getAuthorityPresentation(deriveUpdateAuthorityType(update));
  const isDiscoveryLead = isDiscoveryOnlySource(source);
  const discoveryLead = discoveryLeadRecord
    ? buildDiscoveryLeadRecordSummary(discoveryLeadRecord)
    : rawItem
      ? buildDiscoveryLeadSummary(rawItem)
      : null;
  const sourceReferences = getCitationReferences({ update, rawItem, source });
  const citationAssessment = assessCitationQuality(sourceReferences);
  const safetyLabels = formatAdminAiSafetyLabels({
    status: update.status,
    publishedAt: update.publishedAt,
    aiProcessingStatus: aiReviewState.aiProcessingStatus,
    hasAiGeneratedContent: aiReviewState.hasAiGeneratedContent,
  });
  const traceability = buildAdminReviewTraceability({
    update,
    rawItem,
    source,
    sourceReferences,
  });

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Review draft
        </p>
        <h1 className="font-serif text-4xl text-white">{update.title}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-100">
            {authority.label}
          </span>
          {safetyLabels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
            >
              {label}
            </span>
          ))}
          {isDiscoveryLead ? (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
              Non-official discovery lead - requires verification
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Human review and edits</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveUpdateDraft} className="grid gap-4">
              <input type="hidden" name="updateId" value={update.id} />
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  AI-generated summary
                </p>
                <input
                  name="title"
                  defaultValue={update.title}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <textarea
                  name="oneSentenceSummary"
                  defaultValue={update.oneSentenceSummary}
                  rows={2}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <textarea
                  name="summary"
                  defaultValue={update.summary}
                  rows={4}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <textarea
                  name="whatHappened"
                  defaultValue={update.whatHappened}
                  rows={4}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <textarea
                  name="whyItMatters"
                  defaultValue={update.whyItMatters}
                  rows={4}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Practical impact and legal obligations
                </p>
                <textarea
                  name="practicalImpact"
                  defaultValue={update.practicalImpact}
                  rows={4}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <textarea
                  name="affectedParties"
                  defaultValue={joinLines(update.affectedParties)}
                  rows={3}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <textarea
                  name="keyObligations"
                  defaultValue={joinLines(update.keyObligations)}
                  rows={4}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <textarea
                  name="complianceDeadlines"
                  defaultValue={joinLines(update.complianceDeadlines)}
                  rows={3}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <textarea
                  name="enforcementRisk"
                  defaultValue={update.enforcementRisk}
                  rows={3}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Legal classification and tags
                </p>
                <input
                  name="legalArea"
                  defaultValue={update.legalArea}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <input
                  name="developmentType"
                  defaultValue={update.developmentType}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <input
                  name="importanceLevel"
                  defaultValue={update.importanceLevel}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <input
                  name="confidenceLevel"
                  defaultValue={update.confidenceLevel}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
                <input
                  name="tags"
                  defaultValue={update.tags.join(", ")}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
                />
              </div>
              <button className="rounded-xl bg-white px-4 py-2 text-sm text-zinc-950">
                Save review changes
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-3">
              {update.status === "needs_review" && !isDiscoveryLead ? (
                <>
                  <form action={updateReviewStatus}>
                    <input type="hidden" name="updateId" value={update.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-100">
                      Approve
                    </button>
                  </form>
                  <form action={updateReviewStatus}>
                    <input type="hidden" name="updateId" value={update.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button className="rounded-xl border border-red-400/40 px-4 py-2 text-sm text-red-200">
                      Reject
                    </button>
                  </form>
                </>
              ) : null}
              {update.status === "approved" && !isDiscoveryLead ? (
                <form action={updateReviewStatus}>
                  <input type="hidden" name="updateId" value={update.id} />
                  <input type="hidden" name="status" value="published" />
                  <button className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm text-emerald-200">
                    Publish
                  </button>
                </form>
              ) : null}
              {update.status !== "archived" ? (
                <form action={updateReviewStatus}>
                  <input type="hidden" name="updateId" value={update.id} />
                  <input type="hidden" name="status" value="archived" />
                  <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">
                    Archive
                  </button>
                </form>
              ) : null}
              {update.status === "needs_review" && isDiscoveryLead ? (
                <form action={updateReviewStatus}>
                  <input type="hidden" name="updateId" value={update.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button className="rounded-xl border border-red-400/40 px-4 py-2 text-sm text-red-200">
                    Reject
                  </button>
                </form>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Source metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>Source: {update.sourceName}</p>
              <p>Source id: {traceability.sourceId ?? "Unknown"}</p>
              <p>Jurisdiction: {update.jurisdiction}</p>
              <p>Region / country: {update.region} / {update.country}</p>
              <p>Publication date: {update.publicationDate ?? "Unknown"}</p>
              <p>Detected date: {update.detectedDate}</p>
              <p>Raw item id: {update.rawItemId}</p>
              <p>Authority type: {authority.label}</p>
              <p>Official source: {traceability.officialSource ? "yes" : "no"}</p>
              <p>Parser used: {traceability.parserUsed ?? "Unknown"}</p>
              <p>HTTP status: {traceability.httpStatus ?? "Unknown"}</p>
              <p>Scan timestamp: {traceability.scanTimestamp ?? "Unknown"}</p>
              <p>Content hash: {traceability.contentHash ?? "Unknown"}</p>
              <p>
                Duplicate status: {traceability.duplicateStatus}
                {traceability.duplicateOf ? ` (${traceability.duplicateOf})` : ""}
              </p>
              <p className="text-zinc-400">{authority.shortNote}</p>
              {isDiscoveryLead ? (
                <p className="text-amber-200">
                  Non-official discovery lead - requires verification. This item
                  cannot be published directly from this workflow.
                </p>
              ) : null}
              <p>
                Source URL:{" "}
                <a
                  href={update.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-white/20 underline-offset-4"
                >
                  {update.sourceUrl}
                </a>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review traceability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>Raw URL scanned: {traceability.rawUrlScanned ?? "Unknown"}</p>
              <p>
                Relevance reason:{" "}
                {traceability.relevanceReason ??
                  "No deterministic relevance reason was recorded."}
              </p>
              <p>
                Matched AI terms:{" "}
                {traceability.matchedAiTerms.join(", ") || "None recorded"}
              </p>
              <p>
                Matched regulatory terms:{" "}
                {traceability.matchedRegulatoryTerms.join(", ") || "None recorded"}
              </p>
              <p>
                Authority classification:{" "}
                {traceability.authorityClassification ?? "Not recorded"}
              </p>
              <p>Jurisdiction assignment: {traceability.jurisdiction}</p>
              <p>Effective date: {traceability.effectiveDate ?? "Not recorded"}</p>
              <p>Review status: {traceability.reviewStatus}</p>
              <p>Publication status: {traceability.publicationStatus}</p>
              <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                <p className="font-medium text-zinc-100">Extracted content preview</p>
                <p className="mt-2 text-zinc-300">
                  {traceability.extractedContentPreview ?? "No extracted content preview recorded."}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Citation quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>Status: {citationAssessment.qualityStatus.replaceAll("_", " ")}</p>
              <p>
                Publication eligible:{" "}
                {citationAssessment.publicationEligible ? "yes" : "no"}
              </p>
              {citationAssessment.warnings.length > 0 ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-100">
                  <p className="font-medium">Missing citation warnings</p>
                  <ul className="mt-2 space-y-1">
                    {citationAssessment.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {sourceReferences.map((reference) => (
                <div
                  key={`${reference.sourceRole}-${reference.url}`}
                  className="rounded-xl border border-white/10 bg-zinc-950/60 p-3"
                >
                  <p className="font-medium text-white">
                    {reference.institution}, <span>&ldquo;{reference.title}&rdquo;</span>
                  </p>
                  <p>Role: {reference.sourceRole.replaceAll("_", " ")}</p>
                  <p>Type: {reference.sourceType.replaceAll("_", " ")}</p>
                  <p>Authority: {reference.authorityType ?? "Not detected"}</p>
                  <p>Publication date: {reference.publicationDate ?? "Not detected"}</p>
                  <p>Retrieved: {reference.retrievedAt ?? "Not detected"}</p>
                  <p>Last verified: {reference.lastVerifiedAt ?? "Not detected"}</p>
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white underline decoration-white/20 underline-offset-4"
                  >
                    {reference.url}
                  </a>
                  {reference.notes ? <p className="text-zinc-400">{reference.notes}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recommended review checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              {traceability.checklist.map((item) => (
                <div
                  key={item.question}
                  className="rounded-xl border border-white/10 bg-zinc-950/60 p-3"
                >
                  <p className="font-medium text-zinc-100">{item.question}</p>
                  <p className="mt-1">
                    Answer: <span className="text-white">{item.answer}</span>
                  </p>
                  <p className="mt-1 text-zinc-400">{item.basis}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review warnings and missing information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <div>
                <p className="font-medium text-zinc-100">Warnings</p>
                {traceability.reviewWarnings.length === 0 ? (
                  <p className="mt-2 text-zinc-400">No review warnings recorded.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {traceability.reviewWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="font-medium text-zinc-100">Missing information</p>
                {traceability.missingInformation.length === 0 ? (
                  <p className="mt-2 text-zinc-400">No key gaps detected.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {traceability.missingInformation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review audit trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              {reviewEvents.length === 0 ? (
                <p>No review events recorded yet.</p>
              ) : (
                reviewEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-white/10 bg-zinc-950/60 p-3"
                  >
                    <p className="font-medium text-zinc-100">
                      {event.eventType.replaceAll("_", " ")}
                    </p>
                    <p>
                      Actor: {event.actor} /{" "}
                      {new Date(event.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/New_York",
                      })}
                    </p>
                    <p>
                      Status path: {event.previousStatus ?? "n/a"} -&gt;{" "}
                      {event.nextStatus ?? "n/a"}
                    </p>
                    {event.notes ? <p>{event.notes}</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>AI processing metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-300">
              <p>AI processing status: {aiReviewState.aiProcessingStatus}</p>
              <p>Model used: {aiReviewState.modelUsed ?? "No OpenAI model recorded yet."}</p>
              <p>
                Estimated AI cost:{" "}
                {aiReviewState.estimatedCostUsd !== null
                  ? `$${aiReviewState.estimatedCostUsd.toFixed(4)}`
                  : "Not available"}
              </p>
              <p>Confidence level: {aiReviewState.confidenceLevel ?? "Unknown"}</p>
              <p>Prompt/version: {aiReviewState.promptVersion ?? "Not available"}</p>
              <p>
                Last AI processing timestamp:{" "}
                {aiReviewState.lastAiProcessingAt
                  ? new Date(aiReviewState.lastAiProcessingAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "America/New_York",
                    })
                  : "No AI processing timestamp recorded"}
              </p>
              <p>
                AI planning decision:{" "}
                {aiReviewState.lastAiPlanningDecision?.replaceAll("_", " ") ??
                  "No planning decision recorded"}
              </p>
              <p>
                Skip/error reason:{" "}
                {aiReviewState.skipOrErrorReason ??
                  aiReviewState.lastAiPlanningReason ??
                  "No skip or error reason recorded."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Verification attempts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              {verificationAttempts.length === 0 ? (
                <p>No recurring verification attempts recorded yet.</p>
              ) : (
                verificationAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="rounded-xl border border-white/10 bg-zinc-950/60 p-3"
                  >
                    <p className="font-medium text-zinc-100">{attempt.sourceName}</p>
                    <p>
                      Result: {attempt.resultStatus.replaceAll("_", " ")} / response{" "}
                      {attempt.responseStatus ?? "n/a"}
                    </p>
                    <p>
                      Official source found: {attempt.officialSourceFound ? "yes" : "no"}
                    </p>
                    <p>
                      Attempted at:{" "}
                      {new Date(attempt.attemptedAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/New_York",
                      })}
                    </p>
                    {attempt.notes ? <p>{attempt.notes}</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>AI-generated summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">One-sentence summary</p>
              <p>{update.oneSentenceSummary}</p>
              <p className="font-medium text-zinc-100">Summary</p>
              <p>{update.summary}</p>
              <p className="font-medium text-zinc-100">What happened</p>
              <p>{update.whatHappened}</p>
              <p className="font-medium text-zinc-100">Why it matters</p>
              <p>{update.whyItMatters}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Legal classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-300">
              <p>Status: {update.status}</p>
              <p>Authority type: {authority.label}</p>
              <p>Legal area: {update.legalArea}</p>
              <p>Development type: {update.developmentType}</p>
              <p>Importance level: {update.importanceLevel}</p>
              <p>Confidence level: {update.confidenceLevel}</p>
              <p>Tags: {update.tags.join(", ") || "No tags"}</p>
              <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Authority notes
                </p>
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                  {authority.adminNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Practical impact and obligations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">Practical impact</p>
              <p>{update.practicalImpact}</p>
              <p className="font-medium text-zinc-100">Affected parties</p>
              <p>{update.affectedParties.join(", ") || "None listed."}</p>
              <p className="font-medium text-zinc-100">Key obligations</p>
              <p>{update.keyObligations.join(" | ") || "None listed."}</p>
              <p className="font-medium text-zinc-100">Compliance deadlines</p>
              <p>{update.complianceDeadlines.join(" | ") || "None listed."}</p>
              <p className="font-medium text-zinc-100">Enforcement risk</p>
              <p>{update.enforcementRisk || "Not yet set"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Raw extracted text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4">
                {rawItem?.rawText ?? "Raw text unavailable."}
              </p>
              {discoveryLead ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                  <p className="font-medium text-amber-100">Discovery lead metadata</p>
                  <p className="mt-2">Discovery source: {discoveryLead.discoverySourceName}</p>
                  <p className="mt-2">Possible jurisdiction: {discoveryLead.possibleJurisdiction}</p>
                  <p>Possible topic: {discoveryLead.possibleTopic}</p>
                  <p>Possible legal area: {discoveryLead.possibleLegalArea}</p>
                  <p>Possible authority type: {discoveryLead.possibleAuthorityType}</p>
                  <p>
                    Possible official source found:{" "}
                    {discoveryLead.possibleOfficialSourceFound ? "yes" : "no"}
                  </p>
                  <p>
                    Corroborating source found:{" "}
                    {discoveryLead.corroboratingSourceFound ? "yes" : "no"}
                  </p>
                  <p>
                    Verification status:{" "}
                    {discoveryLead.verificationStatus.replaceAll("_", " ")}
                  </p>
                  <p>
                    Conversion status:{" "}
                    {discoveryLead.conversionStatus.replaceAll("_", " ")}
                  </p>
                  <p>
                    Last verification attempt:{" "}
                    {discoveryLead.lastVerifiedAt
                      ? new Date(discoveryLead.lastVerifiedAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "not attempted yet"}
                  </p>
                  <p>
                    Next suggested verification source:{" "}
                    {discoveryLead.nextSuggestedVerificationSource}
                  </p>
                  {discoveryLead.notPublishableReason ? (
                    <p>Reason not publishable: {discoveryLead.notPublishableReason}</p>
                  ) : null}
                  <p>Reviewer notes: {discoveryLead.reviewerNotes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status actions and review safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-300">
              <p>
                {aiReviewState.hasAiGeneratedContent
                  ? "AI-enriched draft - requires human review."
                  : aiReviewState.aiProcessingStatus === "failed"
                    ? "A prior AI processing attempt failed safely. Human review is still required."
                    : "This draft remains private and requires human review before any approval or publication."}
              </p>
              <p>Not publicly visible until manually approved and published.</p>
              <p>Published items are not automatically modified.</p>
              <p>Save changes does not publish the item.</p>
              <p>
                {isDiscoveryLead
                  ? "Discovery-only leads must be verified against an official source and cannot be published directly."
                  : "Approve only after legal review. Publish only through the existing workflow."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}
