import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  addCountrySource,
  removeCountrySource,
  saveCountryProfileEditorial,
  updateCountrySource,
} from "../actions";

export const dynamic = "force-dynamic";

const reviewStatusOptions: { value: string; label: string }[] = [
  { value: "needs_review", label: "Needs review" },
  { value: "verified", label: "Verified" },
  { value: "stale", label: "Stale" },
  { value: "flagged", label: "Flagged" },
];

const authorityTypeOptions: { value: string; label: string }[] = [
  { value: "regulator", label: "Regulator → AI regulation list" },
  { value: "government", label: "Government → AI regulation list" },
  { value: "legislation", label: "Legislation → AI regulation list" },
  { value: "parliament", label: "Parliament → AI regulation list" },
  { value: "court", label: "Court → AI regulation list" },
  { value: "policy", label: "Policy → AI regulation list" },
  { value: "official", label: "Official → AI regulation list" },
  { value: "standards_body", label: "Standards body → AI regulation list" },
  { value: "soft_law", label: "Soft-law statute → AI regulation list" },
  { value: "case_law_source", label: "Case-law source → Case-law list" },
  { value: "guidance_source", label: "Guidance / soft-law → Soft-law list" },
];

function triStateValue(value: boolean | null | undefined): string {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

// The seed prefixes stored notes with their family (`regulation: ...`); strip
// it for a clean editing experience. Saved notes are stored plain.
function cleanNote(note: string | null | undefined): string {
  return (note ?? "").replace(/^(regulation|case-law|soft-law):\s*/, "");
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";
const labelClass =
  "text-xs uppercase tracking-[0.24em] text-zinc-500";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

export default async function AdminCountryProfileEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const country = await updateRepository.getCountryIntelligenceBySlug(slug);

  if (!country) notFound();

  const sources = await updateRepository.listCountryIntelligenceSources(country.id);

  const editorialNotesText = country.editorialNotes ?? "";
  const missingWarningsText = (country.missingSourceWarnings ?? []).join("\n");
  const linesOf = (values: string[] | null | undefined) => (values ?? []).join("\n");

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      <div className="space-y-3">
        <Link
          href="/admin/ai-regulation/countries"
          className="text-xs uppercase tracking-[0.35em] text-zinc-500"
        >
          Back to country profiles
        </Link>
        <h1 className="font-serif text-4xl text-white">
          {country.countryName}{" "}
          <span className="text-2xl font-normal text-zinc-500">
            ({country.countryCode})
          </span>
        </h1>
        <p className="max-w-3xl text-zinc-300">
          Edit the editorial fields below. Blank fields fall back to the verified
          TypeScript baseline on the public page. Structural fields (status,
          confidence, authority maps, source lists) are not editable here.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Editorial fields</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveCountryProfileEditorial} className="space-y-5">
              <input type="hidden" name="slug" value={country.slug} />

              <div className="space-y-2">
                <label className={labelClass} htmlFor="publicSummary">
                  Public summary
                </label>
                <textarea
                  id="publicSummary"
                  name="publicSummary"
                  rows={3}
                  defaultValue={country.publicSummary ?? ""}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass} htmlFor="implementationNotes">
                  Implementation notes
                </label>
                <textarea
                  id="implementationNotes"
                  name="implementationNotes"
                  rows={3}
                  defaultValue={country.implementationNotes ?? ""}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass} htmlFor="editorialNotes">
                  Editorial notes (one per line)
                </label>
                <textarea
                  id="editorialNotes"
                  name="editorialNotes"
                  rows={4}
                  defaultValue={editorialNotesText}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass} htmlFor="missingSourceWarnings">
                  Missing-source warnings (one per line)
                </label>
                <textarea
                  id="missingSourceWarnings"
                  name="missingSourceWarnings"
                  rows={4}
                  defaultValue={missingWarningsText}
                  className={inputClass}
                />
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                  Structural content (one item per line; blank = use verified
                  baseline)
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="competentAuthorities">
                      Competent authorities
                    </label>
                    <textarea
                      id="competentAuthorities"
                      name="competentAuthorities"
                      rows={3}
                      defaultValue={linesOf(country.competentAuthorities)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="implementationMeasures">
                      Implementation measures
                    </label>
                    <textarea
                      id="implementationMeasures"
                      name="implementationMeasures"
                      rows={3}
                      defaultValue={linesOf(country.implementationMeasures)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className={labelClass}
                      htmlFor="marketSurveillanceAuthorities"
                    >
                      Market surveillance authorities
                    </label>
                    <textarea
                      id="marketSurveillanceAuthorities"
                      name="marketSurveillanceAuthorities"
                      rows={2}
                      defaultValue={linesOf(country.marketSurveillanceAuthorities)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="notifyingAuthorities">
                      Notifying authorities
                    </label>
                    <textarea
                      id="notifyingAuthorities"
                      name="notifyingAuthorities"
                      rows={2}
                      defaultValue={linesOf(country.notifyingAuthorities)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="relevantMinistries">
                      Relevant ministries / agencies
                    </label>
                    <textarea
                      id="relevantMinistries"
                      name="relevantMinistries"
                      rows={2}
                      defaultValue={linesOf(country.relevantMinistries)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="nationalAIRegulationNotes">
                    National AI regulation notes
                  </label>
                  <textarea
                    id="nationalAIRegulationNotes"
                    name="nationalAIRegulationNotes"
                    rows={2}
                    defaultValue={country.nationalAIRegulationNotes ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="nationalCaseLawNotes">
                      Case-law notes
                    </label>
                    <textarea
                      id="nationalCaseLawNotes"
                      name="nationalCaseLawNotes"
                      rows={2}
                      defaultValue={country.nationalCaseLawNotes ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass} htmlFor="nationalSoftLawNotes">
                      Soft-law / guidance notes
                    </label>
                    <textarea
                      id="nationalSoftLawNotes"
                      name="nationalSoftLawNotes"
                      rows={2}
                      defaultValue={country.nationalSoftLawNotes ?? ""}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="reviewStatus">
                    Review status
                  </label>
                  <select
                    id="reviewStatus"
                    name="reviewStatus"
                    defaultValue={country.reviewStatus}
                    className={inputClass}
                  >
                    {reviewStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="reviewedBy">
                    Reviewed by
                  </label>
                  <input
                    id="reviewedBy"
                    name="reviewedBy"
                    defaultValue={country.reviewedBy ?? ""}
                    placeholder="Reviewer name or initials"
                    className={inputClass}
                  />
                </div>
              </div>

              <button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950">
                Save profile
              </button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Read-only context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <p>
              <span className={labelClass}>Region</span>
              <br />
              {country.region}
            </p>
            <p>
              <span className={labelClass}>Implementation status</span>
              <br />
              {country.implementationStatus.replaceAll("_", " ")}
            </p>
            <p>
              <span className={labelClass}>Confidence</span>
              <br />
              {country.implementationConfidence}
            </p>
            <p>
              <span className={labelClass}>Citation quality</span>
              <br />
              {country.citationQualityStatus.replaceAll("_", " ")}
            </p>
            <p>
              <span className={labelClass}>Last reviewed</span>
              <br />
              {formatDateTime(country.lastReviewedAt)}
            </p>
            <p>
              <Link
                href={`/ai-regulation/europe/${country.slug}`}
                className="text-zinc-100 underline decoration-white/20 underline-offset-4"
                target="_blank"
              >
                View public page
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Official sources ({sources.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-zinc-400">
              These rows drive the three source lists on the public country page.
              Authority type decides which list a source appears in (case-law and
              guidance/soft-law have their own lists; everything else is the
              national AI regulation list). Edits apply without a redeployment.
            </p>

            {sources.length === 0 ? (
              <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                No sources stored for this country yet. Add one below, or run{" "}
                <code>npm run seed:country-intelligence</code> to import the
                verified baseline.
              </p>
            ) : null}

            {sources.map((source) => (
              <form
                key={source.id}
                action={updateCountrySource}
                className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <input type="hidden" name="slug" value={country.slug} />
                <input type="hidden" name="sourceId" value={source.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className={labelClass}>Title</label>
                    <input
                      name="sourceTitle"
                      defaultValue={source.sourceTitle}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>URL</label>
                    <input
                      name="sourceUrl"
                      defaultValue={source.sourceUrl}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Institution</label>
                    <input
                      name="institution"
                      defaultValue={source.institution ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Authority type</label>
                    <select
                      name="authorityType"
                      defaultValue={source.authorityType ?? "regulator"}
                      className={inputClass}
                    >
                      {authorityTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Runtime accessible</label>
                    <select
                      name="runtimeAccessible"
                      defaultValue={triStateValue(source.runtimeAccessible)}
                      className={inputClass}
                    >
                      <option value="unknown">Unknown</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Response status</label>
                    <input
                      name="responseStatus"
                      defaultValue={source.responseStatus ?? ""}
                      placeholder="e.g. 200"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Active</label>
                    <select
                      name="active"
                      defaultValue={source.active ? "true" : "false"}
                      className={inputClass}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Note</label>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={cleanNote(source.notes)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-950">
                    Save source
                  </button>
                  <button
                    formAction={removeCountrySource}
                    className="rounded-xl border border-red-400/30 px-3 py-2 text-sm text-red-200"
                  >
                    Remove
                  </button>
                </div>
              </form>
            ))}

            <form
              action={addCountrySource}
              className="space-y-3 rounded-2xl border border-dashed border-white/15 bg-black/10 p-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                Add a source
              </p>
              <input type="hidden" name="slug" value={country.slug} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className={labelClass}>Title</label>
                  <input name="sourceTitle" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>URL</label>
                  <input name="sourceUrl" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Institution</label>
                  <input name="institution" className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Authority type</label>
                  <select
                    name="authorityType"
                    defaultValue="regulator"
                    className={inputClass}
                  >
                    {authorityTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Runtime accessible</label>
                  <select
                    name="runtimeAccessible"
                    defaultValue="unknown"
                    className={inputClass}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Response status</label>
                  <input
                    name="responseStatus"
                    placeholder="e.g. 200"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Note</label>
                <textarea name="notes" rows={2} className={inputClass} />
              </div>
              <button className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-950">
                Add source
              </button>
            </form>
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
