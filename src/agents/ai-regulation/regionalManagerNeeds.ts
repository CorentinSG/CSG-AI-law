export interface RegionalManagerNeeds {
  region: "Europe" | "United States";
  requestedCapabilities: Array<
    | "verified_official_source_inventory"
    | "jurisdiction_specific_news_portfolio"
    | "central_legal_database_distribution"
    | "local_legal_timeline_generation"
    | "hard_law_soft_law_case_law_classification"
    | "source_health_and_gap_audits"
    | "api_accelerated_monitoring"
  >;
  childAgentInstructions: string[];
  apiInstructions: {
    useNativeApisWhenAvailable: true;
    noAdminInterventionForOfficialSourcePublication: true;
    noAdminInterventionForSeriousOrCorroboratedLegalNews: true;
    missingCredentialEscalation: string;
  };
  databaseInstructions: {
    centralBackendStore: "ai_regulatory_updates";
    jurisdictionProfileStore: "country_intelligence";
    timelineSource: "published_and_verified_regulatory_updates";
    distributionKey: "jurisdiction_country_region";
    requiredCoverage: Array<"hard_law" | "soft_law" | "case_law_and_decisions" | "legal_news">;
  };
}

export const euManagerNeeds: RegionalManagerNeeds = {
  region: "Europe",
  requestedCapabilities: [
    "verified_official_source_inventory",
    "jurisdiction_specific_news_portfolio",
    "central_legal_database_distribution",
    "local_legal_timeline_generation",
    "hard_law_soft_law_case_law_classification",
    "source_health_and_gap_audits",
    "api_accelerated_monitoring",
  ],
  childAgentInstructions: [
    "Maintain one source-backed legal database profile per EU member state.",
    "Monitor AI-related legal news, hard law, soft law, enforcement, and court decisions.",
    "Promote only official or corroborated information into durable jurisdiction timelines.",
    "Escalate missing official journals, parliamentary trackers, court databases, DPA pages, or government digital-policy sources.",
    "Prefer implemented native APIs for speed and reliability whenever credentials are present; otherwise degrade honestly to RSS/static/scraping with visible diagnostics.",
  ],
  apiInstructions: {
    useNativeApisWhenAvailable: true,
    noAdminInterventionForOfficialSourcePublication: true,
    noAdminInterventionForSeriousOrCorroboratedLegalNews: true,
    missingCredentialEscalation:
      "Escalate missing NEWSAPI_API_KEY, LEGIFRANCE_PISTE_CLIENT_ID/SECRET, or JUDILIBRE_API_KEYID only when the affected jurisdiction would materially benefit from that API.",
  },
  databaseInstructions: {
    centralBackendStore: "ai_regulatory_updates",
    jurisdictionProfileStore: "country_intelligence",
    timelineSource: "published_and_verified_regulatory_updates",
    distributionKey: "jurisdiction_country_region",
    requiredCoverage: ["hard_law", "soft_law", "case_law_and_decisions", "legal_news"],
  },
};

export const usManagerNeeds: RegionalManagerNeeds = {
  region: "United States",
  requestedCapabilities: [
    "verified_official_source_inventory",
    "jurisdiction_specific_news_portfolio",
    "central_legal_database_distribution",
    "local_legal_timeline_generation",
    "hard_law_soft_law_case_law_classification",
    "source_health_and_gap_audits",
    "api_accelerated_monitoring",
  ],
  childAgentInstructions: [
    "Maintain one source-backed legal database profile per US federal/state/DC jurisdiction.",
    "Monitor AI-related legal news, hard law, soft law, enforcement, attorney-general activity, agency guidance, and court decisions.",
    "Promote only official or corroborated information into durable jurisdiction timelines.",
    "Escalate missing legislatures, state registers, attorney-general pages, courts, or state digital-policy sources.",
    "Prefer implemented native APIs for speed and reliability whenever credentials are present; otherwise degrade honestly to RSS/static/scraping with visible diagnostics.",
  ],
  apiInstructions: {
    useNativeApisWhenAvailable: true,
    noAdminInterventionForOfficialSourcePublication: true,
    noAdminInterventionForSeriousOrCorroboratedLegalNews: true,
    missingCredentialEscalation:
      "Escalate missing NEWSAPI_API_KEY for faster legal-news discovery; treat CourtListener/RECAP as a planned future US case-law connector until implemented.",
  },
  databaseInstructions: {
    centralBackendStore: "ai_regulatory_updates",
    jurisdictionProfileStore: "country_intelligence",
    timelineSource: "published_and_verified_regulatory_updates",
    distributionKey: "jurisdiction_country_region",
    requiredCoverage: ["hard_law", "soft_law", "case_law_and_decisions", "legal_news"],
  },
};
