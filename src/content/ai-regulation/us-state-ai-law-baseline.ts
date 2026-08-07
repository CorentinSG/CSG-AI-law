import type {
  CitationQualityStatus,
  SourceReference,
} from "@/agents/ai-regulation/citations";
import { slugify } from "@/lib/utils";

export type UsStateAiLawStatus =
  | "enacted_comprehensive_ai_law"
  | "enacted_sector_specific_ai_law"
  | "pending_ai_legislation"
  | "agency_guidance_or_enforcement"
  | "ai_related_privacy_or_automated_decision_rules"
  | "no_specific_ai_law_verified"
  | "needs_review";

export type UsStateConfidence = "high" | "medium" | "low" | "needs_review";

export interface UsStateStatusTaxonomyEntry {
  label: string;
  description: string;
  mapTone: "success" | "info" | "warning" | "neutral";
  confidenceRequirements: string;
  sourceRequirements: string;
}

export interface UsStateOfficialSource {
  label: string;
  institution: string;
  url: string;
  sourceType:
    | "legislature"
    | "state_code"
    | "governor"
    | "attorney_general"
    | "privacy_agency"
    | "labor_civil_rights_agency"
    | "court"
    | "regulator";
  official: boolean;
  public: boolean;
  runtimeAccessible: boolean | null;
  responseStatus: number | null;
  lastCheckedAt: string;
  parserStatus: "manual_reference" | "needs_dedicated_parser" | "ready";
  recommendation: "active" | "inactive" | "manual_review";
  note: string;
}

export interface UsStateAiLawProfile {
  stateCode: string;
  stateName: string;
  slug: string;
  region: "United States";
  aiLawStatus: UsStateAiLawStatus;
  aiLawStatusLabel: string;
  aiLawStatusDescription: string;
  confidenceLevel: UsStateConfidence;
  enactedAIStatutes: string[];
  pendingAIBills: string[];
  failedAIBills: string[];
  stateGovernmentUseRules: string[];
  privateSectorRules: string[];
  employmentAIRules: string[];
  biometricRules: string[];
  deepfakeSyntheticMediaRules: string[];
  consumerProtectionAIActivity: string[];
  privacyAutomatedDecisionMakingRules: string[];
  stateAGActivity: string[];
  statePrivacyAgencyActivity: string[];
  laborCivilRightsAgencyActivity: string[];
  officialLegislatureUrl: string | null;
  officialBillSearchUrl: string | null;
  governorSourceUrls: string[];
  stateAGSourceUrls: string[];
  courtSourceUrls: string[];
  officialSourceUrls: string[];
  discoverySources: string[];
  sourceReferences: SourceReference[];
  citationQualityStatus: CitationQualityStatus;
  sourceVerificationStatus:
    | "verified_official_sources_present"
    | "partially_verified"
    | "needs_review";
  lastReviewedDate: string;
  missingSourceWarnings: string[];
  editorialNotes: string[];
  publicSummary: string;
}

export const usStateAiLawStatusTaxonomy: Record<
  UsStateAiLawStatus,
  UsStateStatusTaxonomyEntry
> = {
  enacted_comprehensive_ai_law: {
    label: "Enacted comprehensive AI law",
    description:
      "An official state source verifies an enacted AI law with broad cross-sector AI governance scope.",
    mapTone: "success",
    confidenceRequirements: "High confidence only with official statute/bill source.",
    sourceRequirements: "Official state statute, enacted bill, or governor signing source.",
  },
  enacted_sector_specific_ai_law: {
    label: "Enacted sector-specific AI law",
    description:
      "An official state source verifies an enacted AI law limited to a sector or issue area.",
    mapTone: "success",
    confidenceRequirements: "High or medium with official statute/bill source.",
    sourceRequirements: "Official state statute, enacted bill, or agency source.",
  },
  pending_ai_legislation: {
    label: "Pending AI legislation",
    description:
      "An official state legislature source verifies pending AI legislation.",
    mapTone: "info",
    confidenceRequirements: "Official bill page with current status.",
    sourceRequirements: "Official state bill page or legislative database.",
  },
  agency_guidance_or_enforcement: {
    label: "Agency, court, or enforcement activity",
    description:
      "A state agency, attorney general, court system, privacy agency, labor agency, or regulator has official AI-related activity.",
    mapTone: "info",
    confidenceRequirements: "Official state agency, court, or regulator source.",
    sourceRequirements: "Official agency page, court rule page, enforcement release, guidance, or rulemaking page.",
  },
  ai_related_privacy_or_automated_decision_rules: {
    label: "AI-related privacy / automated decision rules",
    description:
      "An official source verifies privacy, automated decision-making, profiling, biometric, or similar rules materially relevant to AI governance.",
    mapTone: "info",
    confidenceRequirements:
      "Official privacy agency, statute, rulemaking, or regulator source.",
    sourceRequirements:
      "Official state privacy, automated decision-making, biometric, or regulator source.",
  },
  no_specific_ai_law_verified: {
    label: "No specific AI law verified",
    description:
      "An official state source has been identified, but no specific AI law or AI bill is verified in this baseline.",
    mapTone: "warning",
    confidenceRequirements: "At least one official state source verified.",
    sourceRequirements: "Official state source plus no verified AI-specific legal item yet.",
  },
  needs_review: {
    label: "Needs review",
    description:
      "No official state AI-law source has been verified deeply enough for a stronger label.",
    mapTone: "warning",
    confidenceRequirements: "Insufficient verified evidence for stronger status.",
    sourceRequirements: "Needs official state-source pass.",
  },
};

const verifiedAt = "2026-05-27T00:00:00.000Z";

function stateReference(source: UsStateOfficialSource): SourceReference {
  return {
    sourceRole: "primary",
    title: source.label,
    institution: source.institution,
    url: source.url,
    canonicalUrl: source.url,
    sourceType: source.sourceType === "court" ? "court" : "official",
    authorityType: source.sourceType.replaceAll("_", " "),
    publicationDate: null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: source.runtimeAccessible ? source.lastCheckedAt : null,
    jurisdiction: "United States state",
    documentType: source.sourceType,
    excerpt: null,
    pinpoint: null,
    reliabilityLevel: source.runtimeAccessible ? "high" : "medium",
    verificationStatus: source.runtimeAccessible ? "verified" : "needs_manual_verification",
    archivedUrl: null,
    accessLimitations:
      source.runtimeAccessible === false
        ? `Runtime response status was ${source.responseStatus ?? "unavailable"}.`
        : null,
    notes: source.note,
  };
}

function source(input: Omit<UsStateOfficialSource, "lastCheckedAt" | "official" | "public">) {
  return {
    ...input,
    official: true,
    public: true,
    lastCheckedAt: verifiedAt,
  } satisfies UsStateOfficialSource;
}

// Coverage pass (2026-08-05). Eighteen states carried no official source at
// all, which left them at `needs_review` with zero citations on the public
// map. Each URL below is the state's own legislature or code publisher and was
// runtime-checked on 2026-08-05 (all returned HTTP 200). Adding them does NOT
// assert that the state has no AI law — it asserts only that an official
// source is now identified and that no AI statute has been verified yet.
function baselineLegislatureSource(input: {
  label: string;
  institution: string;
  url: string;
  sourceType: UsStateOfficialSource["sourceType"];
  searchNote: string;
}) {
  return [
    source({
      label: input.label,
      institution: input.institution,
      url: input.url,
      sourceType: input.sourceType,
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note: `Official state source, runtime-checked 2026-08-05 (HTTP 200). ${input.searchNote} No AI statute is verified for this state yet, and absence of a verified statute must not be read as absence of law.`,
    }),
  ];
}

const prioritySources: Record<string, UsStateOfficialSource[]> = {
  AL: baselineLegislatureSource({
    label: "Code of Alabama",
    institution: "Alabama Legislature",
    url: "https://alison.legislature.state.al.us/code-of-alabama",
    sourceType: "state_code",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter Alabama corpus (snapshot 2025-01-01) returned no AI provision.",
  }),
  AK: baselineLegislatureSource({
    label: "Alaska State Legislature",
    institution: "Alaska State Legislature",
    url: "https://www.akleg.gov/",
    sourceType: "legislature",
    searchNote: "No corpus sweep has been run for Alaska yet.",
  }),
  GA: baselineLegislatureSource({
    label: "Georgia General Assembly",
    institution: "Georgia General Assembly",
    url: "https://www.legis.ga.gov/",
    sourceType: "legislature",
    searchNote:
      "The Legal Data Hunter Georgia corpus holds only 60 documents and is unusable for a coverage sweep; a 2025 bill-level search surfaced AI-generated obscene-material provisions but nothing could be confirmed in the codified Code.",
  }),
  IN: baselineLegislatureSource({
    label: "Indiana General Assembly",
    institution: "Indiana General Assembly",
    url: "https://iga.in.gov/",
    sourceType: "legislature",
    searchNote:
      "Indiana Code text is unreachable by fetch or by a JS-capable browser — iga.in.gov is a client-rendered application that returns page chrome only. Verifying Indiana requires the bulk Indiana Code download rather than page access.",
  }),
  IA: baselineLegislatureSource({
    label: "Iowa Legislature",
    institution: "Iowa Legislature",
    url: "https://www.legis.iowa.gov/",
    sourceType: "legislature",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter Iowa corpus (snapshot 2026-01-01) returned no AI provision.",
  }),
  KS: baselineLegislatureSource({
    label: "Kansas Legislature",
    institution: "Kansas Legislature",
    url: "https://www.kslegislature.gov/",
    sourceType: "legislature",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter Kansas corpus returned no AI provision; that corpus carries no snapshot date, so the sweep is weak evidence.",
  }),
  ME: baselineLegislatureSource({
    label: "Maine Legislature",
    institution: "Maine Legislature",
    url: "https://legislature.maine.gov/",
    sourceType: "legislature",
    searchNote: "No corpus sweep has been run for Maine yet.",
  }),
  MA: baselineLegislatureSource({
    label: "Massachusetts General Court",
    institution: "Massachusetts General Court",
    url: "https://malegislature.gov/",
    sourceType: "legislature",
    searchNote: "No corpus sweep has been run for Massachusetts yet.",
  }),
  MO: baselineLegislatureSource({
    label: "Missouri Revised Statutes",
    institution: "Missouri Revisor of Statutes",
    url: "https://revisor.mo.gov/",
    sourceType: "state_code",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter Missouri corpus (snapshot 2025-01-01) returned no AI provision.",
  }),
  NV: baselineLegislatureSource({
    label: "Nevada Legislature",
    institution: "Nevada Legislature",
    url: "https://www.leg.state.nv.us/",
    sourceType: "legislature",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter Nevada corpus returned no AI provision; that corpus carries no snapshot date, so the sweep is weak evidence.",
  }),
  NC: baselineLegislatureSource({
    label: "North Carolina General Assembly",
    institution: "North Carolina General Assembly",
    url: "https://www.ncleg.gov/",
    sourceType: "legislature",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter North Carolina corpus returned no AI provision, but that corpus is a 2023-06-01 snapshot and therefore predates most state AI legislation.",
  }),
  OH: baselineLegislatureSource({
    label: "Ohio Revised Code",
    institution: "Ohio Laws and Administrative Rules",
    url: "https://codes.ohio.gov/",
    sourceType: "state_code",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter Ohio corpus returned no AI provision; that corpus carries no snapshot date, so the sweep is weak evidence.",
  }),
  OK: baselineLegislatureSource({
    label: "Oklahoma Legislature",
    institution: "Oklahoma Legislature",
    url: "https://oklegislature.gov/",
    sourceType: "legislature",
    searchNote:
      "The Legal Data Hunter Oklahoma corpus holds only 80 documents and is unusable for a coverage sweep.",
  }),
  SC: baselineLegislatureSource({
    label: "South Carolina Legislature",
    institution: "South Carolina General Assembly",
    url: "https://www.scstatehouse.gov/",
    sourceType: "legislature",
    searchNote: "No corpus sweep has been run for South Carolina yet.",
  }),
  VT: baselineLegislatureSource({
    label: "Vermont General Assembly",
    institution: "Vermont General Assembly",
    url: "https://legislature.vermont.gov/",
    sourceType: "legislature",
    searchNote:
      "The Legal Data Hunter Vermont corpus holds only 15 documents and is unusable for a coverage sweep.",
  }),
  WV: baselineLegislatureSource({
    label: "West Virginia Legislature",
    institution: "West Virginia Legislature",
    url: "https://www.wvlegislature.gov/",
    sourceType: "legislature",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter West Virginia corpus (snapshot 2026-04-19) returned no AI provision.",
  }),
  WY: baselineLegislatureSource({
    label: "Wyoming Legislature",
    institution: "Wyoming Legislature",
    url: "https://wyoleg.gov/",
    sourceType: "legislature",
    searchNote: "No corpus sweep has been run for Wyoming yet.",
  }),
  DC: baselineLegislatureSource({
    label: "Code of the District of Columbia",
    institution: "Council of the District of Columbia",
    url: "https://code.dccouncil.gov/",
    sourceType: "state_code",
    searchNote:
      "An AI/deepfake/synthetic-media sweep of the Legal Data Hunter District of Columbia corpus (snapshot 2026-04-15) returned no AI provision.",
  }),
  CA: [
    source({
      label: "CPPA CCPA rulemaking updates",
      institution: "California Privacy Protection Agency",
      url: "https://cppa.ca.gov/regulations/ccpa_updates.html",
      sourceType: "privacy_agency",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "ready",
      recommendation: "active",
      note:
        "Official California privacy agency rulemaking page; runtime verification returned 200.",
    }),
    source({
      label:
        "Business and Professions Code, Chapter 25.1 — Transparency in Frontier Artificial Intelligence Act (§§ 22757.10–22757.16)",
      institution: "California Legislative Information",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22757.12.",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text of SB 53 (Stats. 2025, Ch. 138) confirmed through the Legal Data Hunter legislation corpus; runtime verification run 30759577030 returned HTTP 200 with all content markers present.",
    }),
    source({
      label:
        "Business and Professions Code, Chapter 25 — California AI Transparency Act (§§ 22757–22757.6)",
      institution: "California Legislative Information",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22757.1.",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text read from the Legal Data Hunter legislation corpus (snapshot 2026-04-04), which reports the chapter heading verbatim as 'CHAPTER 25. AI Transparency Act [22757 - 22757.6] (Chapter 25 added by Stats. 2024, Ch. 291, Sec. 1.)'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label:
        "Civil Code, Title 15.2 — Artificial Intelligence Training Data Transparency (§§ 3110–3111)",
      institution: "California Legislative Information",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=3110.",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text read from the Legal Data Hunter legislation corpus (snapshot 2026-04-04), which reports 'TITLE 15.2. Artificial Intelligence Training Data Transparency [3110 - 3111] (Title 15.2 added by Stats. 2024, Ch. 817, Sec. 1.)' together with the § 3110 definitions. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "Business and Professions Code, Chapter 22.6 — Companion Chatbots (§§ 22601–22606)",
      institution: "California Legislative Information",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22601.",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text read from the Legal Data Hunter legislation corpus (snapshot 2026-04-04), which reports 'CHAPTER 22.6. Companion Chatbots [22601 - 22606] (Chapter 22.6 added by Stats. 2025, Ch. 677, Sec. 1.)'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label:
        "Business and Professions Code, Chapter 15.5 — Health Advice From Artificial Intelligence (§§ 4999.8–4999.9)",
      institution: "California Legislative Information",
      url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=4999.8.",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text read from the Legal Data Hunter legislation corpus (snapshot 2026-04-03), which reports 'CHAPTER 15.5. Health Advice From Artificial Intelligence [4999.8 - 4999.9] (Chapter 15.5 added by Stats. 2025, Ch. 615, Sec. 1.)'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  CO: [
    source({
      label: "Colorado SB24-205 bill page",
      institution: "Colorado General Assembly",
      url: "https://leg.colorado.gov/bills/sb24-205",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official Colorado legislature bill page for the Colorado AI Act (Consumer Protections for Artificial Intelligence), verified as reachable.",
    }),
    source({
      label: "Colorado SB25B-004 bill page (AI Act implementation-date change)",
      institution: "Colorado General Assembly",
      url: "https://leg.colorado.gov/bills/sb25b-004",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official bill page for the 2025 special-session bill adjusting the Colorado AI Act's effective date; runtime verification run 30759577030 returned HTTP 200. The revised date itself still requires item-level review of the page before being stated publicly.",
    }),
  ],
  NY: [
    source({
      label: "NYDFS innovation and guidance page",
      institution: "New York Department of Financial Services",
      url: "https://www.dfs.ny.gov/industry_guidance/innovation",
      sourceType: "regulator",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "ready",
      recommendation: "active",
      note:
        "Official NYDFS page verified as reachable and already used for state-level monitoring.",
    }),
    source({
      label: "New York Attorney General guidance page",
      institution: "New York Attorney General",
      url: "https://ag.ny.gov/guidance",
      sourceType: "attorney_general",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "ready",
      recommendation: "active",
      note:
        "Official New York Attorney General guidance hub verified as reachable; deterministic AI filtering remains required.",
    }),
    source({
      label: "New York Courts Part 161 AI rule page",
      institution: "New York State Unified Court System",
      url: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
      sourceType: "court",
      runtimeAccessible: false,
      responseStatus: 403,
      parserStatus: "ready",
      recommendation: "manual_review",
      note:
        "Official New York Courts Part 161 page governing use of artificial intelligence technology in court papers, with historical note linking AO/75/2026 and effective date June 1, 2026. The parser logic is ready, but the site returned HTTP 403 from the current runtime and therefore still requires manual review or an allowed access path.",
    }),
    source({
      label: "New York Senate bill page — S822 (LOADinG Act chapter amendment)",
      institution: "New York State Senate",
      url: "https://www.nysenate.gov/legislation/bills/2025/S822",
      sourceType: "legislature",
      runtimeAccessible: false,
      responseStatus: 403,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official New York Senate bill page for the chapter amendment to the LOADinG Act (S7543-B/A9430-B, Chapter 674 of the Laws of 2024), reviewed item by item at the source. Runtime check 2026-08-05 returned HTTP 403 (nysenate.gov blocks this runner), so it stays a manual reference.",
    }),
  ],
  IL: [
    source({
      label: "Illinois General Assembly official site",
      institution: "Illinois General Assembly",
      url: "https://www.ilga.gov/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official state legislature site verified as reachable; specific AI bills or statutes require item-level review.",
    }),
    source({
      label: "Illinois General Assembly bill status — HB 3773 (Public Act 103-0804)",
      institution: "Illinois General Assembly",
      url: "https://www.ilga.gov/ftp/legislation/103/BillStatus/HTML/10300HB3773.html",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official Illinois General Assembly bill-status page for HB 3773, read at the source: it records 'Public Act . . . . . . . . . 103-0804', 'Governor Approved 8/9/2024' and 'Effective Date January 1, 2026'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  TX: [
    source({
      label: "Texas Legislature Online",
      institution: "Texas Legislature",
      url: "https://capitol.texas.gov/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Texas legislative source verified as reachable; specific AI bills or statutes require item-level review.",
    }),
    source({
      label:
        "Business & Commerce Code, Chapter 552 — artificial intelligence protections (TRAIGA codification)",
      institution: "Texas Statutes",
      url: "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.552.htm",
      sourceType: "state_code",
      runtimeAccessible: false,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text of the Texas Responsible Artificial Intelligence Governance Act (HB 149, 2025) confirmed through the Legal Data Hunter legislation corpus (e.g. § 552.053 social scoring). Runtime verification run 30759577030 returned HTTP 200 but the statute text is client-rendered, so the page is a manual reference, not a scannable source.",
    }),
    source({
      label:
        "Government Code, Chapter 2054, Subchapter S — artificial intelligence division and disclosure duties (§§ 2054.701, 2054.707, 2054.711)",
      institution: "Texas Statutes",
      url: "https://statutes.capitol.texas.gov/Docs/GV/htm/GV.2054.htm",
      sourceType: "state_code",
      runtimeAccessible: null,
      responseStatus: null,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text confirmed through the Legal Data Hunter legislation corpus: § 2054.701 (artificial intelligence division), § 2054.707 (disclosure when a member of the public interacts with an AI interface) and § 2054.711 (standardised notice for consequential decisions). The corpus note on Business & Commerce Code § 552.003 reads 'Added by Acts 2025, 89th Leg., R.S., Ch. 1174 (H.B. 149), Sec. 4, eff. January 1, 2026', which is the source for the TRAIGA effective date. This specific chapter URL was not runtime-checked in this pass.",
    }),
  ],
  CT: [
    source({
      label: "Connecticut General Assembly",
      institution: "Connecticut General Assembly",
      url: "https://www.cga.ct.gov/",
      sourceType: "legislature",
      runtimeAccessible: false,
      responseStatus: null,
      parserStatus: "needs_dedicated_parser",
      recommendation: "inactive",
      note:
        "Official legislature URL failed from runtime verification. Keep inactive until access is reliable.",
    }),
    source({
      label:
        "Connecticut General Statutes § 51-10e — artificial intelligence annual inventory, policies, assessments",
      institution: "Connecticut General Assembly",
      url: "https://www.cga.ct.gov/current/pub/chap_870.htm",
      sourceType: "state_code",
      runtimeAccessible: false,
      responseStatus: null,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified statute confirmed through the Legal Data Hunter legislation corpus (codifying the 2023 SB 1103 state AI inventory and assessment duties). Runtime verification run 30759577030 could not fetch cga.ct.gov (connection refused to this runner), matching the legislature source above; manual reference only.",
    }),
  ],
  UT: [
    source({
      label: "Utah Legislature",
      institution: "Utah State Legislature",
      url: "https://le.utah.gov/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Utah legislature source verified as reachable; specific AI bills or statutes require item-level review.",
    }),
    source({
      label: "Utah Code, Title 13, Chapter 77 — Artificial Intelligence Policy Act",
      institution: "Utah State Legislature",
      url: "https://le.utah.gov/xcode/Title13/13.html",
      sourceType: "state_code",
      runtimeAccessible: false,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text confirmed through the Legal Data Hunter legislation corpus (e.g. § 13-77-104 generative-AI disclosure safe harbor). Runtime verification run 30759577030 returned HTTP 200 but the chapter text is not present server-side on this table-of-contents page, so it is a manual reference, not a scannable source.",
    }),
  ],
  VA: [
    source({
      label: "Virginia Legislative Information System",
      institution: "Virginia General Assembly",
      url: "https://lis.virginia.gov/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Virginia legislative information system verified as reachable; specific AI bills or statutes require item-level review.",
    }),
    source({
      label: "Virginia HB 697 (2024) — enacted text adding Code of Virginia § 18.2-213.3",
      institution: "Virginia Legislative Information System",
      url: "https://legacylis.virginia.gov/cgi-bin/legp604.exe?241+ful+HB697H1+hil=",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official enacted bill text read at the source: HB 697 adds Code of Virginia § 18.2-213.3 (use of synthetic media in furtherance of crimes involving fraud) and amends §§ 8.01-45, 8.01-46 and 18.2-417. Runtime check 2026-08-05 returned HTTP 200. Note that lis.virginia.gov 301-redirects to legacylis.virginia.gov, which is the URL recorded here.",
    }),
  ],
  WA: [
    source({
      label: "Washington bill information",
      institution: "Washington State Legislature",
      url: "https://app.leg.wa.gov/billinfo/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Washington bill information source verified as reachable after redirect; specific AI bills require item-level review.",
    }),
    source({
      label: "Washington Senate Bill 6120 (2026 regular session) — high-risk artificial intelligence",
      institution: "Washington State Legislature",
      url: "http://lawfilesext.leg.wa.gov/biennium/2025-26/Htm/Bills/Senate%20Bills/6120.htm",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official bill text hosted by the Washington State Legislature, read through the Legal Data Hunter legislation corpus: 'SENATE BILL 6120 ... 69th Legislature 2026 Regular Session ... AN ACT Relating to regulating high-risk artificial intelligence system development'. Runtime check 2026-08-05 returned HTTP 200. Introduced only — not enacted.",
    }),
  ],
  MD: [
    source({
      label: "Maryland General Assembly",
      institution: "Maryland General Assembly",
      url: "https://mgaleg.maryland.gov/mgawebsite/",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official Maryland legislative source verified as reachable; specific AI bills or statutes require item-level review.",
    }),
    source({
      label:
        "State Finance and Procurement Article, Subtitle 8 — artificial intelligence (§§ 3.5-801 to 3.5-806)",
      institution: "Maryland General Assembly",
      url: "https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gsf&section=3.5-801&enactments=false",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Maryland statute text confirmed through the Legal Data Hunter legislation corpus: § 3.5-801 (definitions, incl. 'algorithmic decision system'), § 3.5-803 (state-unit inventory of high-risk AI systems from December 1, 2025), § 3.5-804 (Department policies with the Governor's AI Subcabinet), § 3.5-805 (procurement bar from July 1, 2025) and § 3.5-806 (Governor's AI Subcabinet). Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "Insurance Article § 15-10B-05.1 — artificial intelligence in utilization review",
      institution: "Maryland General Assembly",
      url: "https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gin&section=15-10B-05.1&enactments=false",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Maryland insurance provision defining 'artificial intelligence' as 'an engineered or machine-based system that varies in its level of autonomy', confirmed through the Legal Data Hunter legislation corpus. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  MT: [
    source({
      label:
        "MCA Title 2, Chapter 21, Part 1 — use of artificial intelligence by government entities (§§ 2-21-101 to 2-21-104)",
      institution: "Montana Code Annotated",
      url: "https://mca.legmt.gov/bills/mca/title_0020/chapter_0210/part_0010/section_0030/0020-0210-0010-0030.html",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Montana statute text confirmed through the Legal Data Hunter legislation corpus: § 2-21-101 (definitions), § 2-21-102 (prohibited government AI uses, incl. cognitive behavioural manipulation and social classification), § 2-21-103 (required disclosure of AI-produced material not reviewed by a human, with a law-enforcement-investigation exemption; enactment note 'En. Sec. 3, Ch. 427, L. 2025') and § 2-21-104 (mandatory human review of AI recommendations affecting rights). Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label:
        "MCA Title 2, Chapter 10, Part 2 — right to compute and critical AI systems (§§ 2-10-203, 2-10-205)",
      institution: "Montana Code Annotated",
      url: "https://mca.legmt.gov/bills/mca/title_0020/chapter_0100/part_0020/section_0050/0020-0100-0020-0050.html",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified text of the Right to Compute Act confirmed through the Legal Data Hunter legislation corpus: § 2-10-203 (definitions) and § 2-10-205 ('When critical infrastructure facilities are controlled in whole or in part by a critical artificial intelligence system, the deployer shall develop a risk management policy'). Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "Montana Session Laws, 69th Legislature — Chapter 150 (SB 212, Right to Compute Act)",
      institution: "Montana Legislature",
      url: "https://archive.legmt.gov/content/Sessions/69th/Contractor_index/CH0150.pdf",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official enrolled chapter text for SB 212 (69th Legislature, 2025), which states the right to own and use computational resources and requires any government restriction to be narrowly tailored to fulfil a compelling government interest. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label:
        "MCA § 13-35-801 — AI-generated content in election communications (definitions)",
      institution: "Montana Code Annotated",
      url: "https://mca.legmt.gov/bills/mca/title_0130/chapter_0350/part_0080/section_0010/0130-0350-0080-0010.html",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified definition of 'AI-generated content' for the election-communications part, confirmed through the Legal Data Hunter legislation corpus. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  KY: [
    source({
      label:
        "KRS § 42.731 — duties of the Artificial Intelligence Governance Committee and the Commonwealth Office of Technology",
      institution: "Kentucky Legislature",
      url: "https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=55895",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Kentucky statute confirmed through the Legal Data Hunter legislation corpus (snapshot 2026-04-25): AI governance committee inside the Commonwealth Office of Technology, policies and operating standards for state-agency AI use, reporting and administrative regulations. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "KRS § 42.722 — definitions for KRS 42.720 to 42.742 (artificial intelligence)",
      institution: "Kentucky Legislature",
      url: "https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=55893",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Kentucky definitions provision confirmed through the Legal Data Hunter legislation corpus. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  TN: [
    source({
      label:
        "Tennessee Public Chapter 588 (2024) — Ensuring Likeness, Voice, and Image Security Act (ELVIS Act)",
      institution: "Tennessee Secretary of State",
      url: "https://publications.tnsosfiles.com/acts/113/pub/pc0588.pdf",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official enrolled public chapter (HB 2091) published by the Tennessee Secretary of State, read at the source: it renames the 'Personal Rights Protection Act of 1984' in TCA § 47-25-1101 as the 'Ensuring Likeness, Voice, and Image Security Act of 2024', adds a definition of 'Voice' covering a simulation of an individual's voice, and sets the § 47-25-1107(c) knowledge standard. Runtime check 2026-08-05 returned HTTP 200. The Legal Data Hunter Tennessee corpus is a 2021 snapshot and therefore cannot confirm this act — the Secretary of State PDF is the controlling source.",
    }),
  ],
  ND: [
    source({
      label:
        "North Dakota Century Code, ch. 16.1-10 — § 16.1-10-04.2 use of artificial intelligence in political communications",
      institution: "North Dakota Legislative Branch",
      url: "https://ndlegis.gov/cencode/t16.1c10.pdf",
      sourceType: "state_code",
      runtimeAccessible: false,
      responseStatus: 300,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified chapter PDF confirmed through the Legal Data Hunter legislation corpus (snapshot 2026-04-26), including the mandatory disclaimer 'THIS CONTENT GENERATED BY ARTIFICIAL INTELLIGENCE' and the exclusion for grammar/spelling assistance. Runtime check 2026-08-05 returned HTTP 300 from this runner, so the PDF stays a manual reference.",
    }),
    source({
      label: "North Dakota Century Code, ch. 12.1-17 — § 12.1-17-07 harassment (robot / AI definition)",
      institution: "North Dakota Legislative Branch",
      url: "https://ndlegis.gov/cencode/t12.1c17.pdf",
      sourceType: "state_code",
      runtimeAccessible: false,
      responseStatus: 300,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified chapter PDF confirmed through the Legal Data Hunter legislation corpus: the harassment offence defines 'robot' as an artificial object or system that senses, processes and acts using technology, 'including the associated elements, communication links, and artificial intelligence'. Runtime check 2026-08-05 returned HTTP 300 from this runner.",
    }),
  ],
  NM: [
    source({
      label: "New Mexico Compilation Commission — NMSA 1978 (official statutes portal)",
      institution: "New Mexico Compilation Commission",
      url: "https://nmonesource.com/nmos/en/nav.do",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "needs_dedicated_parser",
      recommendation: "manual_review",
      note:
        "Official New Mexico public legal information portal. NMSA 1978 § 1-19-26.4 (disclaimers in advertisements; artificial intelligence; materially deceptive media) was read in full through the Legal Data Hunter legislation corpus (snapshot 2026-04-18), including its history line 'Laws 2019, ch. 262, § 2; 2024, ch. 57, § 2'. The deep link recorded by the corpus returned HTTP 404 at runtime on 2026-08-05, so this profile points at the portal root, which returned HTTP 200.",
    }),
  ],
  AZ: [
    source({
      label: "ARS § 16-1024 — deepfakes; candidates; exemptions; civil liability; definitions",
      institution: "Arizona State Legislature",
      url: "https://www.azleg.gov/ars/16/01024.htm",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Arizona Revised Statutes section confirmed through the Legal Data Hunter legislation corpus: within ninety days before an election in which a candidate appears on the ballot, digital impersonation of a candidate triggers the section's civil-liability regime, subject to exemptions. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  SD: [
    source({
      label: "S.D. Codified Laws §§ 12-26-32 to 12-26-37 — deepfakes in election communications",
      institution: "South Dakota Legislature",
      url: "https://sdlegislature.gov/Statutes/12-26-32",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified South Dakota statute confirmed through the Legal Data Hunter legislation corpus: § 12-26-32 defines 'artificial intelligence' as 'any machine-based system that, for any explicit or implicit objective, infers from the inputs received by the system how to generate content, decisions, predictions, recommendations' for the deepfake provisions §§ 12-26-32 to 12-26-37. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  HI: [
    source({
      label: "HRS § 11-303 — distribution of materially deceptive media; prohibited; penalties",
      institution: "Hawaii State Legislature",
      url: "https://www.capitol.hawaii.gov/hrscurrent/Vol01_Ch0001-0042F/HRS0011/HRS_0011-0303.htm",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Hawaii section read in full at the source, with the credit line '[L 2024, c 191, pt of §2]'. It carries its own statutory definitions of 'artificial intelligence' and 'materially deceptive media'. Runtime check 2026-08-05 returned HTTP 200 via curl; note that a plain page-fetch tool received HTTP 403 from this host, so a scanner needs a real User-Agent. The Legal Data Hunter Hawaii corpus is a 2017 snapshot and cannot confirm this section.",
    }),
  ],
  MS: [
    source({
      label:
        "Mississippi SB 2577 (2024 Regular Session) — wrongful dissemination of digitizations, as sent to the Governor",
      institution: "Mississippi Legislature",
      url: "https://billstatus.ls.state.ms.us/documents/2024/html/SB/2500-2599/SB2577SG.htm",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official enrolled bill text read in full at the source: 'AN ACT TO CREATE A NEW SECTION IN TITLE 97, CHAPTER 13, MISSISSIPPI CODE OF 1972, TO CREATE CRIMINAL PENALTIES FOR THE WRONGFUL DISSEMINATION OF DIGITIZATIONS', with Section 2 setting the effective date at July 1, 2024. The bill text does not state the codified section number, so none is asserted here. Runtime check 2026-08-05 returned HTTP 200 via curl; a plain page-fetch tool failed on this host with a TLS chain error, so the host needs a client tolerant of its certificate chain.",
    }),
  ],
  NH: [
    source({
      label: "RSA 638:26-a — fraudulent use of deepfakes",
      institution: "New Hampshire General Court",
      url: "https://gc.nh.gov/rsa/html/LXII/638/638-26-a.htm",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified New Hampshire section read at the source, with the credit line '2024, 243:1, eff. Jan. 1, 2025.' Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "RSA 664:14-c — synthetic media and deceptive and fraudulent deepfakes",
      institution: "New Hampshire General Court",
      url: "https://gc.nh.gov/rsa/html/LXIII/664/664-14-c.htm",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified section read at the source: it defines both 'synthetic media' and 'deepfake', imposes a 90-day pre-election disclosure duty naming artificial intelligence technology explicitly, and carries the credit line '2024, 345:1, eff. Aug. 1, 2024'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "RSA 507:8-j — civil actions for fraudulent use of deepfakes",
      institution: "New Hampshire General Court",
      url: "https://gc.nh.gov/rsa/html/LII/507/507-8-j.htm",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified civil-remedy section, surfaced alongside RSA 638:26-a. Runtime check 2026-08-05 returned HTTP 200. Its own credit line was not read in this pass, so no session-law citation is asserted for this section.",
    }),
  ],
  RI: [
    source({
      label:
        "R.I. Gen. Laws § 17-30-1 — deceptive synthetic media (Chapter 17-30, deceptive and fraudulent synthetic media in election communications)",
      institution: "Rhode Island General Assembly",
      url: "https://webserver.rilegislature.gov/Statutes/TITLE17/17-30/17-30-1.htm",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Rhode Island section read at the source, with the History line 'P.L. 2025, ch. 409, § 1, effective July 2, 2025; P.L. 2025, ch. 410, § 1, effective July 2, 2025'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "R.I. Gen. Laws § 17-30-2 — right of action",
      institution: "Rhode Island General Assembly",
      url: "https://webserver.rilegislature.gov/Statutes/TITLE17/17-30/17-30-2.htm",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified right-of-action section in the same chapter. Runtime check 2026-08-05 returned HTTP 200; its text was not read item by item in this pass.",
    }),
  ],
  NE: [
    source({
      label:
        "Neb. Rev. Stat. §§ 86-1801 to 86-1807 — Conversational Artificial Intelligence Safety Act",
      institution: "Nebraska Legislature",
      url: "https://nebraskalegislature.gov/laws/statutes.php?statute=86-1801",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Nebraska statute confirmed through the Legal Data Hunter legislation corpus (snapshot 2026-07-17): § 86-1801 cites the Act with History 'Laws 2026, LB525, § 12'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "Neb. Rev. Stat. § 86-1802 — definitions for the Conversational AI Safety Act",
      institution: "Nebraska Legislature",
      url: "https://nebraskalegislature.gov/laws/statutes.php?statute=86-1802",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified definitions read in full through the Legal Data Hunter corpus, including the definition of 'conversational artificial intelligence service' and its seven exclusions, with History 'Laws 2026, LB525, § 13'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "Neb. Rev. Stat. § 86-1804 — mandatory disclosure that the service is artificial intelligence",
      institution: "Nebraska Legislature",
      url: "https://nebraskalegislature.gov/laws/statutes.php?statute=86-1804",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified disclosure duty confirmed through the Legal Data Hunter corpus. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  DE: [
    source({
      label:
        "15 Del. C. § 5145 — use of deep fake technology to influence an election; penalty; injunctive relief",
      institution: "Delaware Code",
      url: "https://delcode.delaware.gov/title15/c051/sc02/index.html",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Delaware section confirmed through the Legal Data Hunter legislation corpus (snapshot 2026-04-15), including the safe-harbour disclosure wording and the Court of Chancery remedy. The corpus rendering elides the lettered sub-paragraphs, so no session-law citation is asserted for this section. Runtime check 2026-08-05 returned HTTP 200 on the subchapter page.",
    }),
  ],
  MN: [
    source({
      label: "Minn. Stat. § 609.771 — use of deep fake technology to influence an election",
      institution: "Minnesota Office of the Revisor of Statutes",
      url: "https://www.revisor.mn.gov/statutes/cite/609.771",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Minnesota statute read at the source, with the History line '2023 c 52 art 6 s 16; c 58 s 2; 2024 c 112 art 2 s 76-78'. The section is framed around 'deep fake' technology and does not itself use the term artificial intelligence. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  PA: [
    source({
      label: "18 Pa.C.S. Chapter 41 — § 4101.1 digital forgery",
      institution: "Pennsylvania General Assembly",
      url: "https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/18/00.041..HTM",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified chapter read at the source: § 4101.1 (digital forgery) sits between § 4101 (forgery) and § 4102, and defines 'forged digital likeness' as a computer-generated visual representation of an actual and identifiable individual, or an audio recording of such an individual's voice. The section does not define artificial intelligence. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "Pennsylvania Act 35 of 2025 (SB 649) — act information page",
      institution: "Pennsylvania General Assembly",
      url: "https://www.palegis.us/statutes/unconsolidated/law-information?sessYr=2025&sessInd=0&actNum=0035.",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official act information page read at the source: Act 35 of 2025 originates from SB 649, amends the Crimes Code to create the offense of digital forgery, and was signed on July 7, 2025 with a 60-day effective delay. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  LA: [
    source({
      label: "La. R.S. 14:73.13 — unlawful deepfakes",
      institution: "Louisiana State Legislature",
      url: "https://www.legis.la.gov/legis/Law.aspx?d=1336015",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Louisiana statute read at the source, heading '§ 73.13. Unlawful deepfakes' with the credit line 'Acts 2023, No. 457, §1.'. Unlike most state deepfake statutes this one is a sexual-conduct and minor-protection offence rather than an election measure. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  ID: [
    source({
      label: "Idaho Code § 67-6628A — electioneering communications, use of synthetic media",
      institution: "Idaho State Legislature",
      url: "https://legislature.idaho.gov/statutesrules/idstat/Title67/T67CH66/SECT67-6628A/",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Idaho section read at the source, with the History line '[67-6628A, added 2024, ch. 172, sec. 1, p. 654.]'. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  OR: [
    source({
      label: "Oregon SB 1571 (2024 Regular Session) — measure overview",
      institution: "Oregon Legislative Information System",
      url: "https://olis.oregonlegislature.gov/liz/2024r1/Measures/Overview/SB1571",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official OLIS measure page read at the source: SB 1571 is titled 'Relating to the use of artificial intelligence in campaign communications; declaring an emergency', carries Chapter 62 of the Oregon Laws 2024, and takes effect on passage under its emergency clause. Runtime check 2026-08-05 returned HTTP 200.",
    }),
    source({
      label: "Oregon SB 1571 — enrolled text",
      institution: "Oregon Legislative Information System",
      url: "https://olis.oregonlegislature.gov/liz/2024R1/Downloads/MeasureDocument/SB1571/Enrolled",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official enrolled measure PDF. Runtime check 2026-08-05 returned HTTP 200, but the runner cannot render the PDF, so the substantive citation above rests on the OLIS measure page rather than on the enrolled text itself.",
    }),
  ],
  NJ: [
    source({
      label: "New Jersey P.L. 2025, c.40 (A3540) — deceptive audio or visual media",
      institution: "New Jersey Legislature",
      url: "https://pub.njleg.state.nj.us/Bills/2024/AL25/40_.HTM",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official enacted chapter law read at the source: P.L. 2025, c.40 (A3540 3R ACS), approved April 2, 2025, creating N.J.S.A. 2C:21-17.7 and 2C:21-17.8, effective immediately. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  FL: [
    source({
      label: "Florida Statutes § 106.145 — use of artificial intelligence in political advertisements",
      institution: "Florida Legislature",
      url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0100-0199/0106/Sections/0106.145.html",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Florida statute read at the source, including the mandated disclaimer text and the history line 'History.—s. 1, ch. 2024-126'. Runtime check 2026-08-05 returned HTTP 200. The Florida statutes site is served over HTTP, not HTTPS, at this path.",
    }),
  ],
  WI: [
    source({
      label: "Wis. Stat. § 11.1303(2m) — synthetic media in political communications",
      institution: "Wisconsin Legislature",
      url: "https://docs.legis.wisconsin.gov/statutes/statutes/11/xiii/1303",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Wisconsin statute read at the source: § 11.1303(2m)(a)2 defines 'synthetic media' as audio or video content substantially produced in whole or in part by means of generative artificial intelligence, and (2m)(b)-(c) set the required disclosure wording. Enacted by 2023 Wisconsin Act 123. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  MI: [
    source({
      label: "MCL 168.932f — distribution of materially deceptive media",
      institution: "Michigan Legislature",
      url: "https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-168-932f",
      sourceType: "state_code",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official codified Michigan section read at the source, including the required disclaimer wording, the misdemeanor/felony escalation, and the credit line 'Added by 2023, Act 265; Effective February 13, 2024'. The section takes its definition of artificial intelligence from MCL 169.202 rather than defining it itself. Runtime check 2026-08-05 returned HTTP 200.",
    }),
  ],
  AR: [
    source({
      label: "Arkansas HB 1876 (2025 Regular Session) — Act 927 bill-status page",
      institution: "Arkansas State Legislature",
      url: "https://arkleg.state.ar.us/Bills/Detail?id=hb1876&ddBienniumSession=2025%2F2025R",
      sourceType: "legislature",
      runtimeAccessible: true,
      responseStatus: 200,
      parserStatus: "manual_reference",
      recommendation: "manual_review",
      note:
        "Official Arkansas bill-status page read at the source: HB 1876, titled 'REGARDING THE OWNERSHIP OF MODEL TRAINING AND CONTENT GENERATED BY A GENERATIVE ARTIFICIAL INTELLIGENCE TOOL.', became Act 927 and was approved by the Governor on April 21, 2025. Runtime check 2026-08-05 returned HTTP 200. The page does not state a separate effective date, so none is asserted here.",
    }),
  ],
};

const states = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
  ["DC", "District of Columbia"],
] as const;

// State-by-state populated review (first pass, 2026-08). Every entry below is
// backed by an official source in `prioritySources` for the same state, and
// every statute named was confirmed either against the Legal Data Hunter
// legislation corpus (codified text with an official URL) or against a
// runtime-verified official bill page. Nothing here is inferred from press
// coverage. States absent from this record keep the source-reachability
// heuristic until their review lands.
interface PopulatedStateBaseline {
  status: UsStateAiLawStatus;
  confidence: UsStateConfidence;
  enactedAIStatutes: string[];
  pendingAIBills?: string[];
  stateGovernmentUseRules?: string[];
  privateSectorRules?: string[];
  publicSummary: string;
}

const populatedStateBaselines: Record<string, PopulatedStateBaseline> = {
  CO: {
    status: "enacted_comprehensive_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Colorado AI Act — SB24-205, Consumer Protections for Artificial Intelligence (signed May 17, 2024 per the official bill page): duties for developers and deployers of high-risk AI systems concerning algorithmic discrimination.",
      "SB25B-004, Increase Transparency for Algorithmic Systems (2025 special session): signed by the Governor on August 28, 2025 and, per the official bill page, it 'extends the effective date of the requirements of Senate Bill 24-205 to June 30, 2026'.",
    ],
    publicSummary:
      "Colorado enacted the first U.S. cross-sector AI law, SB24-205 (Consumer Protections for Artificial Intelligence), imposing duties on developers and deployers of high-risk AI systems. SB25B-004 (2025 special session, signed August 28, 2025) pushed the effective date of those requirements to June 30, 2026.",
  },
  CA: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Transparency in Frontier Artificial Intelligence Act — SB 53 (Stats. 2025, Ch. 138), codified at Business and Professions Code §§ 22757.10–22757.16: safety-framework publication and incident-disclosure duties for frontier AI developers.",
      "California AI Transparency Act — Business and Professions Code Chapter 25, §§ 22757–22757.6 (Chapter 25 added by Stats. 2024, Ch. 291, Sec. 1).",
      "Artificial Intelligence Training Data Transparency — Civil Code Title 15.2, §§ 3110–3111 (Title 15.2 added by Stats. 2024, Ch. 817, Sec. 1): definitions of artificial intelligence, generative AI, substantial modification and synthetic data generation for developer training-data disclosure duties.",
      "Companion Chatbots — Business and Professions Code Chapter 22.6, §§ 22601–22606 (Chapter 22.6 added by Stats. 2025, Ch. 677, Sec. 1).",
      "Health Advice From Artificial Intelligence — Business and Professions Code Chapter 15.5, §§ 4999.8–4999.9 (Chapter 15.5 added by Stats. 2025, Ch. 615, Sec. 1).",
    ],
    privateSectorRules: [
      "Business and Professions Code §§ 22757.10–22757.16 impose transparency and reporting duties on large frontier AI developers.",
      "Business and Professions Code Chapter 25 (AI Transparency Act) and Civil Code Title 15.2 (AI Training Data Transparency) impose provenance and training-data disclosure duties on covered providers and developers.",
      "Business and Professions Code Chapter 22.6 regulates companion chatbots, and Chapter 15.5 regulates health advice generated by artificial intelligence.",
    ],
    publicSummary:
      "California has the densest codified AI statute book of any state: the Transparency in Frontier Artificial Intelligence Act (SB 53, Stats. 2025, Ch. 138), the AI Transparency Act (Stats. 2024, Ch. 291), AI Training Data Transparency (Stats. 2024, Ch. 817), Companion Chatbots (Stats. 2025, Ch. 677) and Health Advice From Artificial Intelligence (Stats. 2025, Ch. 615), alongside active CPPA rulemaking on automated decision-making. Election, law-enforcement and licensing provisions referencing AI exist as well and are still under item-level review.",
  },
  TX: {
    status: "enacted_comprehensive_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Texas Responsible Artificial Intelligence Governance Act — HB 149 (2025), codified in Business & Commerce Code Chapter 552 (e.g. § 552.053 prohibiting government social scoring) with the Texas Artificial Intelligence Council in Chapter 554. The codification note on § 552.003 reads 'Added by Acts 2025, 89th Leg., R.S., Ch. 1174 (H.B. 149), Sec. 4, eff. January 1, 2026', which fixes the effective date at January 1, 2026.",
      "Government Code Chapter 2054, Subchapter S: § 2054.701 (artificial intelligence division), § 2054.707 (disclosure when a member of the public interacts with an AI interface) and § 2054.711 (standardised notice for consequential decisions).",
    ],
    stateGovernmentUseRules: [
      "Business & Commerce Code Chapter 552 prohibits specified governmental AI uses, including social scoring (§ 552.053).",
      "Government Code §§ 2054.707 and 2054.711 require state agencies to disclose AI interfaces to the public and to give standardised notice for consequential decisions.",
    ],
    publicSummary:
      "Texas enacted the Responsible Artificial Intelligence Governance Act (HB 149, 2025), codified in Business & Commerce Code Chapters 552–554 and effective January 1, 2026, combining prohibited-use rules with an AI Council. Government Code Chapter 2054 adds an AI division plus disclosure and notice duties for state agencies.",
  },
  UT: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Artificial Intelligence Policy Act — SB 149 (2024), codified at Utah Code Title 13, Chapter 77: § 13-77-103 requires a supplier using generative AI in a consumer transaction to disclose that fact when asked, and § 13-77-104 provides a disclosure safe harbor.",
      "Utah Code Chapter 13-72c — latent disclosures in image, video and audio content created or substantially modified by a covered provider's generative AI system (§ 13-72c-203, operative 1/1/2027 per the codified text).",
      "Utah Code § 20A-11-1104 — disclosure of synthetic media in election communications.",
      "Utah Code § 76-2-107 — commission of an offense with the aid of generative artificial intelligence.",
      "Utah Code § 45-2-3.5 — generative-AI creation is not a defence to a claim of libel or slander.",
      "Utah Code §§ 53-25-901 and 53-25-902 — every law enforcement agency must maintain a policy on employees' use of generative artificial intelligence.",
    ],
    privateSectorRules: [
      "Utah Code § 13-77-104 provides a safe harbor where generative AI clearly and conspicuously discloses itself at the outset of covered interactions.",
      "Utah Code § 13-72c-203 requires covered providers to embed a latent disclosure in generative-AI image, video and audio content.",
    ],
    publicSummary:
      "Utah enacted the Artificial Intelligence Policy Act (SB 149, 2024) at Utah Code Title 13, Chapter 77, and has since built out a broader AI statute book: latent provenance disclosures for generative-AI media (Chapter 13-72c), synthetic media in elections (§ 20A-11-1104), aggravation for offences committed with generative AI (§ 76-2-107), defamation (§ 45-2-3.5) and mandatory law-enforcement AI policies (§§ 53-25-901 to 902).",
  },
  CT: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Connecticut General Statutes § 51-10e (enacted 2023 as SB 1103): annual inventory, policies, procedures and impact-assessment duties for state agencies' artificial intelligence systems.",
    ],
    stateGovernmentUseRules: [
      "CGS § 51-10e requires an annual inventory and assessment regime for AI systems used by state government.",
    ],
    publicSummary:
      "Connecticut enacted state-government AI governance duties (CGS § 51-10e, from 2023's SB 1103): annual inventories, policies and assessments for agency AI systems. Broader private-sector AI legislation has been debated but is not verified as enacted.",
  },
  IL: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "HB 3773 — Public Act 103-0804 (Governor approved 8/9/2024, effective January 1, 2026 per the official bill-status page): amends the Employment Article of the Illinois Human Rights Act to make it a civil rights violation for an employer to use artificial intelligence with the effect of discriminating on the basis of a protected class, or to use zip codes as a proxy for a protected class, and to fail to notify an employee that artificial intelligence is being used.",
    ],
    privateSectorRules: [
      "Under Public Act 103-0804 the prohibition covers recruitment, hiring, promotion, renewal of employment, selection for training or apprenticeship, discharge, discipline, tenure and the terms, privileges or conditions of employment.",
      "Public Act 103-0804 defines both 'artificial intelligence' and 'generative artificial intelligence' for the Illinois Human Rights Act.",
    ],
    publicSummary:
      "Illinois enacted HB 3773 (Public Act 103-0804, approved August 9, 2024, effective January 1, 2026), which makes discriminatory employment use of artificial intelligence — including using zip codes as a proxy for a protected class — a civil rights violation under the Illinois Human Rights Act, and requires employers to notify employees when AI is used.",
  },
  NY: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "LOADinG Act — S7543-B/A9430-B, Chapter 674 of the Laws of 2024: governs state-agency use of automated decision-making systems.",
      "Chapter amendment S822: repeals the impact-assessment and meaningful-human-review requirements, requires agencies to publish their automated decision-making tools on agency websites and the Office of Information Technology Services to maintain an AI inventory, and codifies the civil-service protections.",
    ],
    stateGovernmentUseRules: [
      "Chapter 674 of the Laws of 2024, as amended by S822, requires publication of state-agency automated decision-making tools and a centrally held AI inventory.",
    ],
    publicSummary:
      "New York enacted the LOADinG Act (Chapter 674 of the Laws of 2024) governing state-agency automated decision-making systems, later reshaped by chapter amendment S822, which replaced impact assessments and meaningful human review with published agency tool disclosures and a central AI inventory. Separately, the New York Courts Part 161 rule governs use of artificial intelligence technology in court papers, and NYDFS and the Attorney General maintain official guidance channels.",
  },
  TN: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Public Chapter 588 (HB 2091, 2024), effective July 1, 2024: renames the 'Personal Rights Protection Act of 1984' in TCA § 47-25-1101 as the 'Ensuring Likeness, Voice, and Image Security Act of 2024' (ELVIS Act), and adds a definition of 'Voice' as a sound that is readily identifiable and attributable to a particular individual, whether or not the sound contains the individual's actual voice or a simulation of it.",
    ],
    privateSectorRules: [
      "TCA § 47-25-1107(c) reaches a person who 'had knowledge or reasonably should have known of the unauthorized use'.",
    ],
    publicSummary:
      "Tennessee enacted the ELVIS Act (Public Chapter 588, HB 2091, effective July 1, 2024), extending its right-of-publicity statute to cover an individual's voice — including an AI simulation of that voice — and reaching those who knew or reasonably should have known of an unauthorised use.",
  },
  MT: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Right to Compute Act — SB 212 (69th Legislature, 2025, Chapter 150), codified at MCA §§ 2-10-203 and 2-10-205: it establishes a right to own and use computational resources, requires any government restriction on that right to be narrowly tailored to fulfil a compelling government interest, and requires a risk management policy where critical infrastructure is controlled in whole or in part by a critical artificial intelligence system.",
      "MCA §§ 2-21-101 to 2-21-104 (enactment note on § 2-21-103: 'En. Sec. 3, Ch. 427, L. 2025'): definitions, prohibited government AI uses, mandatory disclosure of AI-produced material not reviewed by a human, and mandatory human review of AI recommendations affecting rights.",
      "MCA § 13-35-801: definition of 'AI-generated content' for election communications.",
    ],
    stateGovernmentUseRules: [
      "MCA § 2-21-102 bars a government entity or state officer from using an AI system for cognitive behavioural manipulation or to classify a person or group based on behaviour or socioeconomic status.",
      "MCA § 2-21-103 requires government entities to disclose material produced by an AI system that was not reviewed by a human in an appropriate responsible position, and to disclose AI use in public-facing interfaces, subject to a law-enforcement-investigation exemption.",
      "MCA § 2-21-104 requires human review of any AI recommendation or decision that could affect a person's rights, duties, privileges or immunities.",
    ],
    publicSummary:
      "Montana pairs a libertarian-framed Right to Compute Act (SB 212, Chapter 150, 2025) with a strict regime for government AI use at MCA §§ 2-21-101 to 2-21-104: prohibited uses, disclosure of unreviewed AI output and of AI in public interfaces, and mandatory human review of decisions affecting rights. Election communications carry a separate AI-generated content definition at MCA § 13-35-801.",
  },
  KY: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "KRS § 42.731: establishes an Artificial Intelligence Governance Committee within the Commonwealth Office of Technology and requires policies and operating standards for state-agency AI use, standards adhering to ISO/IEC 42001, separate standards for generative and high-risk AI, transparency requirements, a centralised registry and an approval process, plus reporting and administrative regulations.",
      "KRS § 42.722: definitions of 'artificial intelligence' and related terms for KRS 42.720 to 42.742.",
    ],
    stateGovernmentUseRules: [
      "KRS § 42.731 requires a centralised AI registry and an approval process for state-agency artificial intelligence systems.",
    ],
    publicSummary:
      "Kentucky governs state-agency artificial intelligence through KRS §§ 42.722 and 42.731: an AI Governance Committee inside the Commonwealth Office of Technology, operating standards aligned to ISO/IEC 42001, distinct generative and high-risk AI standards, transparency duties, a centralised registry and an approval process.",
  },
  MD: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "State Finance and Procurement Article §§ 3.5-801 to 3.5-806: § 3.5-801 defines 'algorithmic decision system'; § 3.5-803 requires each unit of State government to inventory systems employing high-risk artificial intelligence on or before December 1, 2025 and regularly thereafter; § 3.5-804 required the Department, with the Governor's Artificial Intelligence Subcabinet, to adopt AI policies and procedures on or before December 1, 2024; § 3.5-805 bars a unit of State government from procuring or deploying a new AI system from July 1, 2025 unless it complies with those policies; § 3.5-806 establishes the Governor's Artificial Intelligence Subcabinet.",
      "Insurance Article § 15-10B-05.1: defines 'artificial intelligence' as an engineered or machine-based system that varies in its level of autonomy for the purposes of that section.",
      "Courts and Judicial Proceedings Article § 13-101.2: applies the State Finance and Procurement Article § 3.5-801 definition of artificial intelligence in the context of the Administrative Office of the Courts.",
    ],
    stateGovernmentUseRules: [
      "State Finance and Procurement §§ 3.5-803 to 3.5-805 combine an annual high-risk AI inventory, centrally adopted policies and a procurement bar for non-compliant systems.",
    ],
    publicSummary:
      "Maryland runs its AI governance through the State Finance and Procurement Article (§§ 3.5-801 to 3.5-806): definitions, a Governor's AI Subcabinet, centrally adopted policies, an inventory of high-risk AI systems from December 1, 2025, and a bar on procuring or deploying non-compliant AI systems from July 1, 2025. Separate AI provisions sit in the Insurance Article (§ 15-10B-05.1) and the Courts and Judicial Proceedings Article (§ 13-101.2).",
  },
  ND: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "NDCC § 16.1-10-04.2: political communications containing content created in whole or in part with artificial intelligence to visually or audibly impersonate a human must prominently state 'THIS CONTENT GENERATED BY ARTIFICIAL INTELLIGENCE'. The section does not apply to text generation, grammar or spelling correction, stylistic editing or enhancement that creates no new impersonation of a human likeness or voice.",
      "NDCC § 12.1-17-07 (harassment): defines 'robot' as an artificial object or system that senses, processes and acts using technology, 'including the associated elements, communication links, and artificial intelligence', and includes remotely piloted aircraft.",
    ],
    publicSummary:
      "North Dakota requires an explicit 'THIS CONTENT GENERATED BY ARTIFICIAL INTELLIGENCE' disclaimer on political communications that use AI to impersonate a human (NDCC § 16.1-10-04.2), with a carve-out for text, grammar and stylistic assistance. Its harassment offence (NDCC § 12.1-17-07) expressly reaches conduct carried out through robots incorporating artificial intelligence.",
  },
  NM: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "NMSA 1978 § 1-19-26.4 (History: Laws 2019, ch. 262, § 2; 2024, ch. 57, § 2): an advertisement containing materially deceptive media must carry a clear and conspicuous disclaimer, in every language used in the advertisement, reading 'This ____ has been manipulated or generated by artificial intelligence', with the blank filled by image, video or audio. Each non-compliant occurrence is a separate violation subject to the civil penalties in NMSA 1978 § 1-19-34.6.",
    ],
    publicSummary:
      "New Mexico requires advertisements containing materially deceptive media to disclose that the image, video or audio 'has been manipulated or generated by artificial intelligence' (NMSA 1978 § 1-19-26.4, as amended by Laws 2024, ch. 57), with format rules per medium, exemptions for bona fide newscasts, satire and parody, and civil penalties per occurrence.",
  },
  AZ: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "ARS § 16-1024 — deepfakes; candidates; exemptions; civil liability; definitions: applies within ninety days before an election at which a candidate for elected office will appear on the ballot.",
    ],
    publicSummary:
      "Arizona regulates synthetic media in elections through ARS § 16-1024, which creates a civil-liability regime for deepfakes of candidates in the ninety days before an election, subject to statutory exemptions.",
  },
  SD: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "S.D. Codified Laws §§ 12-26-32 to 12-26-37 (deepfakes): § 12-26-32 defines 'artificial intelligence' as any machine-based system that, for any explicit or implicit objective, infers from the inputs it receives how to generate content, decisions, predictions or recommendations.",
    ],
    publicSummary:
      "South Dakota addresses AI-generated synthetic media in its election code at S.D. Codified Laws §§ 12-26-32 to 12-26-37, built on a statutory definition of artificial intelligence in § 12-26-32.",
  },
  AR: {
    status: "enacted_sector_specific_ai_law",
    confidence: "medium",
    enactedAIStatutes: [
      "Act 927 of the 2025 Regular Session (HB 1876), approved by the Governor on April 21, 2025: 'REGARDING THE OWNERSHIP OF MODEL TRAINING AND CONTENT GENERATED BY A GENERATIVE ARTIFICIAL INTELLIGENCE TOOL.'",
    ],
    publicSummary:
      "Arkansas enacted Act 927 of 2025 (HB 1876, approved April 21, 2025) on the ownership of model training and of content generated by a generative artificial intelligence tool. The official bill-status page states no separate effective date, and the codified sections have not yet been reviewed item by item, so confidence is held at medium.",
  },
  WA: {
    status: "pending_ai_legislation",
    confidence: "high",
    enactedAIStatutes: [],
    pendingAIBills: [
      "SB 6120 (69th Legislature, 2026 regular session) — 'AN ACT Relating to regulating high-risk artificial intelligence system development'.",
      "SB 6284 and SSB 6284 (2026 regular session).",
      "HB 2157 and SHB 2157 (2026 regular session).",
      "HB 1170, SHB 1170, 2SHB 1170 and E2SHB 1170 (2025–2026).",
      "HB 1168 and SHB 1168 (2025 regular session) — increasing transparency in artificial intelligence.",
      "SHB 2503 (2026 regular session).",
    ],
    publicSummary:
      "Washington has no verified cross-sector AI statute in force. Its legislature has a dense pipeline of AI bills across the 2025 and 2026 regular sessions — including SB 6120 on high-risk AI systems, the HB 1170 and HB 1168 transparency series, HB 2157, SB 6284 and HB 2503 — all of which remain proposals, not binding law.",
  },
  // Third populated pass (2026-08-05). The Legal Data Hunter connector was
  // rate-limiting throughout this pass, so every state below was verified
  // directly on the issuing legislature's or code publisher's own site.
  OR: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "SB 1571 (2024 Regular Session), Chapter 62 of the Oregon Laws 2024: 'Relating to the use of artificial intelligence in campaign communications; declaring an emergency'. It requires disclosure of synthetic media in campaign communications, gives the Secretary of State rulemaking authority, and carries a civil penalty of not more than $10,000 per violation. It took effect on passage under its emergency clause.",
    ],
    publicSummary:
      "Oregon regulates artificial intelligence in campaign communications through SB 1571 (Chapter 62, Oregon Laws 2024), which requires synthetic media in campaign material to be disclosed, backed by Secretary of State rulemaking and a civil penalty of up to $10,000. It took effect immediately under an emergency clause.",
  },
  VA: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "HB 697 (2024) adds Code of Virginia § 18.2-213.3 (use of synthetic media in furtherance of crimes involving fraud) and amends §§ 8.01-45, 8.01-46 and 18.2-417. It defines 'synthetic media' as 'any image, audio recording, or video recording of an individual's appearance, speech, or conduct that has been created or intentionally manipulated with the use of generative artificial intelligence systems or other digital technology in a manner to create a realistic but false image, audio, or video'.",
    ],
    privateSectorRules: [
      "Under § 18.2-213.3, using synthetic media to commit a criminal offence is a separate and distinct Class 1 misdemeanor, and an affected individual may sue for actual damages and attorney fees.",
    ],
    publicSummary:
      "Virginia criminalises the use of synthetic media in furtherance of fraud offences through HB 697 (2024), codified at Code of Virginia § 18.2-213.3, with a statutory definition of synthetic media that expressly reaches generative AI, a separate Class 1 misdemeanor, and a private right of action. Virginia has no verified cross-sector AI governance statute.",
  },
  NJ: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "P.L. 2025, c.40 (A3540 3R ACS), approved April 2, 2025 and effective immediately, creating N.J.S.A. 2C:21-17.7 and 2C:21-17.8 on deceptive audio or visual media: creating or generating such media, or soliciting or disclosing it with criminal intent, is a crime of the third degree, and knowingly or recklessly disclosing media created in violation is a crime of the fourth degree, with a fine of up to $30,000 in addition to imprisonment.",
    ],
    publicSummary:
      "New Jersey established civil and criminal liability for deceptive audio or visual media — deepfakes — through P.L. 2025, c.40 (A3540), approved April 2, 2025 and effective immediately, codified at N.J.S.A. 2C:21-17.7 and 2C:21-17.8, with third- and fourth-degree offences and fines up to $30,000.",
  },
  FL: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Fla. Stat. § 106.145, 'Use of artificial intelligence' (History: s. 1, ch. 2024-126): a political advertisement containing generative-AI content that depicts a person performing an action that did not occur must carry the disclaimer 'Created in whole or in part with the use of generative artificial intelligence (AI).', with per-medium formatting rules. Omitting the disclaimer is a first-degree misdemeanor under §§ 775.082 and 775.083, alongside civil penalties and Florida Elections Commission complaints.",
    ],
    publicSummary:
      "Florida requires political advertisements built with generative AI to carry a statutory disclaimer under Fla. Stat. § 106.145 (ch. 2024-126), enforced as a first-degree misdemeanor and through the Florida Elections Commission. Florida has no verified cross-sector AI governance statute.",
  },
  WI: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Wis. Stat. § 11.1303(2m), enacted by 2023 Wisconsin Act 123: § 11.1303(2m)(a)2 defines 'synthetic media' as audio or video content substantially produced in whole or in part by means of generative artificial intelligence. Audio communications must carry 'Contains content generated by AI' at the beginning and the end; video communications must display 'This video content generated by AI', 'This audio content generated by AI' or 'This content generated by AI' throughout the AI-generated portion.",
    ],
    publicSummary:
      "Wisconsin requires political communications containing synthetic media to carry an explicit AI disclosure under Wis. Stat. § 11.1303(2m), added by 2023 Wisconsin Act 123, with distinct wording for audio and video and penalties of up to $1,000 per violation.",
  },
  MI: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "MCL 168.932f (added by 2023 PA 265, effective February 13, 2024): distributing materially deceptive media is prohibited unless it carries the disclaimer 'This ____ (image, audio, or video) has been manipulated by technical means and depicts speech or conduct that did not occur.' A first violation is a misdemeanor punishable by up to 90 days or $500; a subsequent violation within five years is a felony punishable by up to 5 years or $1,000. The section takes its definition of artificial intelligence from MCL 169.202.",
    ],
    publicSummary:
      "Michigan bars distribution of materially deceptive media without a statutory disclaimer under MCL 168.932f, added by 2023 PA 265 and effective February 13, 2024, escalating from misdemeanor to felony on repeat violations within five years.",
  },
  // Fourth populated pass (2026-08-05), same method: read on the issuing site.
  MN: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Minn. Stat. § 609.771, 'Use of deep fake technology to influence election' (History: 2023 c 52 art 6 s 16; c 58 s 2; 2024 c 112 art 2 s 76-78): disseminating a deep fake without the depicted individual's consent, with intent to injure a candidate or influence an election result, within defined pre-election windows, is punishable by up to 90 days or $1,000, rising to five years or $10,000 for a repeat offence within five years, and a convicted candidate forfeits the nomination or office.",
    ],
    publicSummary:
      "Minnesota criminalises the use of deep fake technology to influence an election under Minn. Stat. § 609.771, with escalating penalties and forfeiture of office for a convicted candidate. The section is drafted around 'deep fake' technology rather than artificial intelligence as such.",
  },
  PA: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "18 Pa.C.S. § 4101.1 (digital forgery), created by Act 35 of 2025 (SB 649), signed July 7, 2025 with a 60-day effective delay: it defines 'forged digital likeness' as a computer-generated visual representation of an actual and identifiable individual, or an audio recording of such an individual's voice, and criminalises distributing one as genuine with intent to defraud, injure or deceive. The section does not itself define artificial intelligence.",
    ],
    publicSummary:
      "Pennsylvania added the offence of digital forgery at 18 Pa.C.S. § 4101.1 through Act 35 of 2025 (SB 649, signed July 7, 2025), reaching computer-generated likenesses and voice recordings of identifiable individuals distributed as genuine.",
  },
  LA: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "La. R.S. 14:73.13, 'Unlawful deepfakes' (Acts 2023, No. 457, §1): it defines 'deepfake' as audio or visual media created, altered or digitally manipulated so as to appear to a reasonable observer to be an authentic record of an individual's actual speech or conduct, excludes work of political, public-interest or newsworthy value and clearly disclosed material, and carries imprisonment at hard labour with enhanced penalties where sexual conduct or a minor is involved.",
    ],
    publicSummary:
      "Louisiana criminalises unlawful deepfakes under La. R.S. 14:73.13 (Acts 2023, No. 457). Unlike most state deepfake statutes it is a sexual-conduct and minor-protection offence rather than an election measure, and it carries hard-labour sentences with a statutory carve-out for political, newsworthy, satirical and clearly disclosed material.",
  },
  ID: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Idaho Code § 67-6628A, 'Electioneering communications — use of synthetic media' (added 2024, ch. 172, sec. 1, p. 654): 'synthetic media' is an audio or video recording of an individual's speech or conduct created through generative adversarial network techniques or other digital technology to produce a realistic but false recording. A creator avoids liability by carrying the disclosure 'This (video/audio) has been manipulated.' An affected candidate may seek injunctive relief, general and special damages and attorney's fees, proving synthetic-media use by clear and convincing evidence.",
    ],
    publicSummary:
      "Idaho regulates synthetic media in electioneering communications under Idaho Code § 67-6628A (2024, ch. 172), pairing a safe-harbour disclosure with a candidate's civil action subject to a clear-and-convincing standard of proof.",
  },
  // Fifth populated pass (2026-08-05). The Legal Data Hunter connector came
  // back during this pass, so these two were read in the corpus and their URLs
  // runtime-checked.
  NE: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "Conversational Artificial Intelligence Safety Act, Neb. Rev. Stat. §§ 86-1801 to 86-1807 (Laws 2026, LB525). § 86-1802 defines a 'conversational artificial intelligence service' as an AI software application, web interface or computer program accessible to the general public that primarily simulates human conversation through textual, visual or aural communications, with seven exclusions including developer/researcher tools, narrow-topic outputs, voice assistants and internal or customer-service business use.",
      "§ 86-1804: where a reasonable person would be misled into believing they are interacting with a human, the operator must clearly and conspicuously disclose that the service is artificial intelligence.",
      "§ 86-1805: operators must adopt a protocol for responding to user prompts regarding suicidal ideation or self-harm, including reasonable efforts to refer the user to crisis service providers.",
      "§ 86-1806: operators may not knowingly and intentionally cause or program the service to state that it is designed to provide professional mental or behavioral health care.",
    ],
    privateSectorRules: [
      "The Act binds 'operators' — any person making a conversational AI service available to the public — and expressly excludes mobile application stores and search engines that merely provide access.",
    ],
    publicSummary:
      "Nebraska enacted the Conversational Artificial Intelligence Safety Act (Neb. Rev. Stat. §§ 86-1801 to 86-1807, Laws 2026, LB525), one of the few state AI statutes that regulates AI behaviour rather than synthetic media: operators of public-facing conversational AI must disclose that the service is artificial intelligence, maintain a suicide and self-harm response protocol, and must not present the service as providing professional mental or behavioral health care.",
  },
  DE: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "15 Del. C. § 5145, 'Use of deep fake technology to influence an election; penalty; injunctive relief': distributing a deep fake, or contracting to do so, is unlawful where the distributor knows or reasonably should know the item is a deep fake and the statutory elements are met. Subsection (c)(1) provides a safe harbour where the synthetic media carries the disclosure 'This (image/video/audio) has been altered or artificially generated.' A violation is a class B misdemeanor, and a depicted candidate may bring an expedited action for injunctive relief and damages in the Court of Chancery, with attorneys' fees available to a prevailing party.",
    ],
    publicSummary:
      "Delaware regulates election deep fakes at 15 Del. C. § 5145, combining a class B misdemeanor with a disclosure safe harbour and an expedited Court of Chancery action for the depicted candidate. A carve-out preserves security, anti-fraud and investigative activity.",
  },
  // Sixth populated pass (2026-08-05), read on the issuing site.
  NH: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "RSA 638:26-a, 'Fraudulent Use of Deepfakes' (2024, 243:1, eff. Jan. 1, 2025): knowingly creating, distributing or presenting a deepfake of an identifiable individual to embarrass, harass, entrap, defame, extort or otherwise cause financial or reputational harm is a class B felony. Where the deepfake results in the individual's arrest, that is a separate class B felony and the offender is liable for the victim's legal expenses and defence costs.",
      "RSA 664:14-c, 'Synthetic Media and Deceptive and Fraudulent Deepfakes' (2024, 345:1, eff. Aug. 1, 2024): within 90 days before an election, deepfake content concerning candidates, election officials or parties may not be distributed unless accompanied by a clear disclosure that the material was manipulated or generated by artificial intelligence technology and depicts speech or conduct that did not occur. Affected candidates and election officials may seek injunctive relief and damages with attorney's fees.",
      "RSA 507:8-j provides civil actions for fraudulent use of deepfakes.",
    ],
    publicSummary:
      "New Hampshire has one of the broadest state deepfake regimes: RSA 638:26-a makes fraudulent use of a deepfake a class B felony with a second felony where it causes an arrest, RSA 664:14-c adds a 90-day pre-election disclosure duty that names artificial intelligence technology explicitly, and RSA 507:8-j supplies a civil action. Unlike most states its criminal provision is not confined to elections.",
  },
  RI: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "R.I. Gen. Laws Chapter 17-30, 'Deceptive and Fraudulent Synthetic Media in Election Communications' (§ 17-30-1 History: P.L. 2025, ch. 409, § 1 and ch. 410, § 1, both effective July 2, 2025): synthetic media knowingly distributed by candidates, campaign committees, political action committees or independent spenders within 90 days of an election must carry a disclosure stating that the image has been manipulated or generated by artificial intelligence, with size rules for visual media and spoken repetition every two minutes for audio. § 17-30-2 supplies the right of action.",
    ],
    publicSummary:
      "Rhode Island regulates deceptive synthetic media in election communications through Chapter 17-30 of the General Laws, enacted by twin 2025 public laws effective July 2, 2025, with a 90-day pre-election window, an artificial-intelligence disclosure requirement and a statutory right of action.",
  },
  // Seventh populated pass (2026-08-05), both read on the issuing site.
  HI: {
    status: "enacted_sector_specific_ai_law",
    confidence: "high",
    enactedAIStatutes: [
      "HRS § 11-303, 'Distribution of materially deceptive media; prohibited; penalties' [L 2024, c 191, pt of §2]: from the first working day of February in every even-numbered year through the next general election, no person may recklessly distribute materially deceptive media in reckless disregard of the risk of harming a candidate's reputation or electoral prospects or of changing voter behaviour. A disclaimer that the media has been manipulated by technical means, with per-medium formatting rules, takes the conduct outside the prohibition. A violation is a misdemeanor, rising to a class C felony where the intent is to cause violence or bodily harm.",
      "HRS § 11-303(h) defines 'artificial intelligence' as a machine-based system that can, for a given set of human-defined objectives, make predictions, recommendations or decisions influencing real or virtual environments, and defines 'materially deceptive media' to include media created by generative adversarial network techniques, by artificial intelligence, or by digital technology.",
    ],
    publicSummary:
      "Hawaii prohibits the reckless distribution of materially deceptive media in the election period under HRS § 11-303 (Act 191, Session Laws of Hawaii 2024), with a disclaimer safe harbour, a misdemeanor penalty rising to a class C felony where violence is intended, and statutory carve-outs for broadcasters, interactive computer services and cloud providers not involved in creating the media. The section carries its own definition of artificial intelligence.",
  },
  MS: {
    status: "enacted_sector_specific_ai_law",
    confidence: "medium",
    enactedAIStatutes: [
      "SB 2577 (2024 Regular Session), 'AN ACT TO CREATE A NEW SECTION IN TITLE 97, CHAPTER 13, MISSISSIPPI CODE OF 1972, TO CREATE CRIMINAL PENALTIES FOR THE WRONGFUL DISSEMINATION OF DIGITIZATIONS', effective July 1, 2024. It defines 'digitization' as altering an image or audio in a realistic manner using an image or audio of another person or computer-generated images or audio, 'commonly called deepfakes', and expressly includes creation through software, machine learning artificial intelligence or any other computer-generated or technological means. Exemptions cover bona fide newscasts, paid broadcasts, general-circulation publications that carry a disclaimer, satire and parody, and detection or security work.",
    ],
    publicSummary:
      "Mississippi criminalised the wrongful dissemination of 'digitizations' — its statutory term covering deepfakes and machine-learning-generated media — through SB 2577 (2024), effective July 1, 2024, adding a new section to Title 97, Chapter 13 of the Mississippi Code. Confidence is held at medium because the enrolled bill does not state the codified section number and it has not yet been read in the codified Code.",
  },
};

function createProfile(code: string, name: string): UsStateAiLawProfile {
  const sources = prioritySources[code] ?? [];
  const sourceReferences = sources.map(stateReference);
  const hasReachableOfficialSource = sources.some((entry) => entry.runtimeAccessible);
  const populated = populatedStateBaselines[code];
  const status: UsStateAiLawStatus = populated
    ? populated.status
    : code === "NY" && hasReachableOfficialSource
      ? "agency_guidance_or_enforcement"
      : hasReachableOfficialSource
        ? "no_specific_ai_law_verified"
        : "needs_review";

  return {
    stateCode: code,
    stateName: name,
    slug: slugify(name),
    region: "United States",
    aiLawStatus: status,
    aiLawStatusLabel: usStateAiLawStatusTaxonomy[status].label,
    aiLawStatusDescription: usStateAiLawStatusTaxonomy[status].description,
    confidenceLevel: populated
      ? populated.confidence
      : hasReachableOfficialSource
        ? "medium"
        : "needs_review",
    enactedAIStatutes: populated?.enactedAIStatutes ?? [],
    pendingAIBills: populated?.pendingAIBills ?? [],
    failedAIBills: [],
    stateGovernmentUseRules: [
      ...(populated?.stateGovernmentUseRules ?? []),
      ...(code === "NY"
        ? [
            "Part 161 of the Rules of the Chief Administrator governs use of artificial intelligence technology in preparing court papers and became effective June 1, 2026.",
          ]
        : []),
    ],
    privateSectorRules: populated?.privateSectorRules ?? [],
    employmentAIRules: [],
    biometricRules: [],
    deepfakeSyntheticMediaRules: [],
    consumerProtectionAIActivity: [],
    privacyAutomatedDecisionMakingRules: code === "CA" ? ["CPPA rulemaking source verified; individual rule text requires review."] : [],
    stateAGActivity: code === "NY" ? ["New York Attorney General guidance hub verified; AI-specific items require filtering and review."] : [],
    statePrivacyAgencyActivity: code === "CA" ? ["California Privacy Protection Agency rulemaking page verified."] : [],
    laborCivilRightsAgencyActivity: [],
    officialLegislatureUrl:
      sources.find((entry) => entry.sourceType === "legislature")?.url ?? null,
    officialBillSearchUrl:
      sources.find((entry) => entry.sourceType === "legislature")?.url ?? null,
    governorSourceUrls: sources.filter((entry) => entry.sourceType === "governor").map((entry) => entry.url),
    stateAGSourceUrls: sources.filter((entry) => entry.sourceType === "attorney_general").map((entry) => entry.url),
    courtSourceUrls: sources.filter((entry) => entry.sourceType === "court").map((entry) => entry.url),
    officialSourceUrls: sources.map((entry) => entry.url),
    discoverySources: [],
    sourceReferences,
    citationQualityStatus: sourceReferences.length > 0 ? "partial" : "missing_official_source",
    sourceVerificationStatus: hasReachableOfficialSource
      ? "partially_verified"
      : "needs_review",
    lastReviewedDate: populated ? "2026-08-02" : verifiedAt,
    missingSourceWarnings: [
      ...(sourceReferences.length === 0 ? ["No official state source verified yet."] : []),
      ...(populated
        ? [
            "Populated first-pass review: statutes listed are source-confirmed, but the state's full AI-law landscape (bills, agency actions, case law) is broader than this profile.",
          ]
        : ["No comprehensive state-by-state AI law review completed yet."]),
      "No official case-law source verified for this state profile.",
    ],
    editorialNotes: [
      "This state profile is baseline coverage only and should not be read as exhaustive.",
      "Do not infer absence of state AI law from missing verified entries.",
    ],
    publicSummary: populated
      ? populated.publicSummary
      : hasReachableOfficialSource
        ? code === "NY"
          ? `${name} has multiple official sources verified for baseline monitoring, including the New York Courts Part 161 rule page, but item-level legal review remains necessary before stronger public conclusions about broader state AI law coverage are made.`
          : `${name} has at least one official state source verified for baseline monitoring, but specific AI laws, bills, or agency actions still require item-level review.`
        : `${name} is included in the U.S. state baseline, but no official state source has been verified in this phase.`,
  };
}

export const usStateAiLawProfiles: UsStateAiLawProfile[] = states.map(([code, name]) =>
  createProfile(code, name),
);

export function getUsStateAiLawProfiles() {
  return [...usStateAiLawProfiles];
}

export function getUsStateAiLawProfileBySlug(slug: string) {
  return usStateAiLawProfiles.find((profile) => profile.slug === slug) ?? null;
}

export function getPriorityUsStateProfiles() {
  const priorityCodes = [
    "CA", "CO", "NY", "IL", "TX", "CT", "UT", "VA", "WA", "MD",
    "MT", "KY", "TN", "ND", "NM", "AZ", "SD", "AR",
    "OR", "NJ", "FL", "WI", "MI",
    "MN", "PA", "LA", "ID", "NE", "DE", "NH", "RI", "HI", "MS",
  ];
  return usStateAiLawProfiles.filter((profile) =>
    priorityCodes.includes(profile.stateCode),
  );
}

export function getUsStateVerificationBacklog() {
  return usStateAiLawProfiles.filter(
    (profile) =>
      profile.sourceVerificationStatus !== "verified_official_sources_present" ||
      profile.missingSourceWarnings.length > 0,
  );
}
