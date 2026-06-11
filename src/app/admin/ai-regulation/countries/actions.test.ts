import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const assertAdminServerActionAccess = vi.fn();
const getCountryIntelligenceBySlug = vi.fn();
const upsertCountryIntelligence = vi.fn();
const listCountryIntelligenceSources = vi.fn();
const replaceCountryIntelligenceSources = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/admin-auth", () => ({
  assertAdminServerActionAccess,
}));

vi.mock("@/agents/ai-regulation/processors/updateRepository", () => ({
  updateRepository: {
    getCountryIntelligenceBySlug,
    upsertCountryIntelligence,
    listCountryIntelligenceSources,
    replaceCountryIntelligenceSources,
  },
}));

function dbSource(overrides: { id: string } & Record<string, unknown>) {
  return {
    countryId: "country-france",
    sourceUrl: "https://example.gov/a",
    sourceTitle: "Source A",
    institution: "Inst A",
    authorityType: "regulator",
    publicAccessible: true,
    runtimeAccessible: true,
    lastCheckedAt: "2026-06-01T00:00:00.000Z",
    responseStatus: 200,
    active: true,
    notes: "regulation: note A",
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const existingRow = {
  id: "country-france",
  region: "Europe" as const,
  countryCode: "FR",
  countryName: "France",
  slug: "france",
  implementationStatus: "competent_authority_designated" as const,
  implementationConfidence: "medium" as const,
  implementationNotes: "Existing implementation notes.",
  competentAuthorityName: "CNIL",
  competentAuthorityUrl: null,
  dpaName: "CNIL",
  dpaUrl: null,
  marketSurveillanceAuthority: null,
  primaryOfficialSourceUrl: "https://www.cnil.fr/",
  primaryOfficialSourceTitle: "CNIL",
  lastOfficialSourceCheck: "2026-06-01T00:00:00.000Z",
  citationQualityStatus: "partial" as const,
  publicSummary: "Old summary.",
  editorialNotes: "Old note A\nOld note B",
  missingSourceWarnings: ["old warning"],
  implementationMeasures: ["Measure A"],
  competentAuthorities: ["CNIL", "ARCOM"],
  marketSurveillanceAuthorities: ["DGCCRF"],
  notifyingAuthorities: [],
  relevantMinistries: ["Ministry of Justice"],
  nationalAIRegulationNotes: "Regulation notes.",
  nationalCaseLawNotes: "Case-law notes.",
  nationalSoftLawNotes: null,
  lastReviewedAt: "2026-06-01T00:00:00.000Z",
  reviewedBy: "seed-profile",
  reviewStatus: "needs_review" as const,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("country profile editorial action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertAdminServerActionAccess.mockResolvedValue(undefined);
    getCountryIntelligenceBySlug.mockResolvedValue(existingRow);
    upsertCountryIntelligence.mockResolvedValue(existingRow);
  });

  it("requires admin access and persists merged editorial fields", async () => {
    const { saveCountryProfileEditorial } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "france");
    formData.set("publicSummary", "New summary text.");
    formData.set("implementationNotes", "Refreshed implementation notes.");
    formData.set("editorialNotes", "Note one\n  Note two  \n\nNote three");
    formData.set("missingSourceWarnings", "Warning one\nWarning two");
    formData.set("competentAuthorities", "CNIL\nARCOM");
    formData.set("implementationMeasures", "Measure X");
    formData.set("nationalAIRegulationNotes", "New regulation notes.");
    formData.set("reviewStatus", "verified");
    formData.set("reviewedBy", "CSG");

    await saveCountryProfileEditorial(formData);

    expect(assertAdminServerActionAccess).toHaveBeenCalledOnce();
    expect(getCountryIntelligenceBySlug).toHaveBeenCalledWith("france");
    expect(upsertCountryIntelligence).toHaveBeenCalledOnce();

    const input = upsertCountryIntelligence.mock.calls[0][0];
    expect(input.id).toBe("country-france");
    // Editable fields updated.
    expect(input.publicSummary).toBe("New summary text.");
    expect(input.implementationNotes).toBe("Refreshed implementation notes.");
    expect(input.editorialNotes).toBe("Note one\nNote two\nNote three");
    expect(input.missingSourceWarnings).toEqual(["Warning one", "Warning two"]);
    expect(input.reviewStatus).toBe("verified");
    expect(input.reviewedBy).toBe("CSG");
    // Structural fields preserved from the existing row.
    expect(input.countryName).toBe("France");
    expect(input.implementationStatus).toBe("competent_authority_designated");
    expect(input.citationQualityStatus).toBe("partial");
    // Structural content (F8C-3c) is now editable from the form.
    expect(input.competentAuthorities).toEqual(["CNIL", "ARCOM"]);
    expect(input.implementationMeasures).toEqual(["Measure X"]);
    expect(input.nationalAIRegulationNotes).toBe("New regulation notes.");
    // Review timestamp refreshed (not the old value).
    expect(input.lastReviewedAt).not.toBe(existingRow.lastReviewedAt);

    expect(revalidatePath).toHaveBeenCalledWith("/admin/ai-regulation/countries");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/admin/ai-regulation/countries/france",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/ai-regulation/europe/france");
  });

  it("falls back to the existing review status when an invalid status is posted", async () => {
    const { saveCountryProfileEditorial } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "france");
    formData.set("reviewStatus", "not_a_real_status");

    await saveCountryProfileEditorial(formData);

    const input = upsertCountryIntelligence.mock.calls[0][0];
    expect(input.reviewStatus).toBe("needs_review");
  });

  it("stores blank editable fields as null/empty so the page uses the baseline", async () => {
    const { saveCountryProfileEditorial } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "france");
    formData.set("publicSummary", "   ");
    formData.set("implementationNotes", "");
    formData.set("editorialNotes", "");
    formData.set("missingSourceWarnings", "");

    await saveCountryProfileEditorial(formData);

    const input = upsertCountryIntelligence.mock.calls[0][0];
    expect(input.publicSummary).toBeNull();
    expect(input.implementationNotes).toBeNull();
    expect(input.editorialNotes).toBeNull();
    expect(input.missingSourceWarnings).toEqual([]);
  });

  it("throws when no row exists for the slug", async () => {
    getCountryIntelligenceBySlug.mockResolvedValue(null);
    const { saveCountryProfileEditorial } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "atlantis");

    await expect(saveCountryProfileEditorial(formData)).rejects.toThrow(
      /No country_intelligence row/,
    );
    expect(upsertCountryIntelligence).not.toHaveBeenCalled();
  });
});

describe("country source management actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertAdminServerActionAccess.mockResolvedValue(undefined);
    getCountryIntelligenceBySlug.mockResolvedValue(existingRow);
    listCountryIntelligenceSources.mockResolvedValue([
      dbSource({ id: "country-source-france-regulation-1" }),
      dbSource({ id: "country-source-france-regulation-2", sourceTitle: "Source B" }),
    ]);
    replaceCountryIntelligenceSources.mockResolvedValue([]);
  });

  it("addCountrySource appends a new source and preserves the existing set", async () => {
    const { addCountrySource } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "france");
    formData.set("sourceTitle", "New CNIL page");
    formData.set("sourceUrl", "https://www.cnil.fr/new");
    formData.set("institution", "CNIL");
    formData.set("authorityType", "case_law_source");
    formData.set("runtimeAccessible", "yes");
    formData.set("responseStatus", "200");
    formData.set("notes", "Fresh source");

    await addCountrySource(formData);

    expect(assertAdminServerActionAccess).toHaveBeenCalledOnce();
    const [countryId, written] = replaceCountryIntelligenceSources.mock.calls[0];
    expect(countryId).toBe("country-france");
    expect(written).toHaveLength(3);
    const added = written[2];
    expect(added.id).toBe("country-source-france-custom-3");
    expect(added.sourceTitle).toBe("New CNIL page");
    expect(added.authorityType).toBe("case_law_source");
    expect(added.runtimeAccessible).toBe(true);
    expect(added.responseStatus).toBe(200);
    expect(added.publicAccessible).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/ai-regulation/europe/france");
  });

  it("addCountrySource ignores blank title or URL", async () => {
    const { addCountrySource } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "france");
    formData.set("sourceTitle", "   ");
    formData.set("sourceUrl", "https://example.gov");

    await addCountrySource(formData);
    expect(replaceCountryIntelligenceSources).not.toHaveBeenCalled();
  });

  it("updateCountrySource edits only the targeted source", async () => {
    const { updateCountrySource } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "france");
    formData.set("sourceId", "country-source-france-regulation-2");
    formData.set("sourceTitle", "Renamed B");
    formData.set("sourceUrl", "https://example.gov/b2");
    formData.set("authorityType", "guidance_source");
    formData.set("runtimeAccessible", "no");
    formData.set("active", "false");

    await updateCountrySource(formData);

    const written = replaceCountryIntelligenceSources.mock.calls[0][1];
    expect(written).toHaveLength(2);
    expect(written[0].sourceTitle).toBe("Source A"); // untouched
    expect(written[1].sourceTitle).toBe("Renamed B");
    expect(written[1].authorityType).toBe("guidance_source");
    expect(written[1].runtimeAccessible).toBe(false);
    expect(written[1].active).toBe(false);
  });

  it("updateCountrySource is a no-op when the source id is unknown", async () => {
    const { updateCountrySource } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "france");
    formData.set("sourceId", "country-source-france-regulation-999");
    formData.set("sourceTitle", "Ghost");
    formData.set("sourceUrl", "https://example.gov/ghost");

    await updateCountrySource(formData);
    expect(replaceCountryIntelligenceSources).not.toHaveBeenCalled();
  });

  it("removeCountrySource drops only the targeted source", async () => {
    const { removeCountrySource } = await import(
      "@/app/admin/ai-regulation/countries/actions"
    );

    const formData = new FormData();
    formData.set("slug", "france");
    formData.set("sourceId", "country-source-france-regulation-1");

    await removeCountrySource(formData);

    const written = replaceCountryIntelligenceSources.mock.calls[0][1];
    expect(written).toHaveLength(1);
    expect(written[0].id).toBe("country-source-france-regulation-2");
    expect(revalidatePath).toHaveBeenCalledWith("/ai-regulation/europe/france");
  });
});
