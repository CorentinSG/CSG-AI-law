export interface RegionalManagerNeeds {
  region: "Europe" | "United States";
  requestedCapabilities: Array<
    | "verified_official_source_inventory"
    | "jurisdiction_specific_news_portfolio"
    | "central_legal_database_distribution"
    | "local_legal_timeline_generation"
    | "hard_law_soft_law_case_law_classification"
    | "source_health_and_gap_audits"
  >;
  childAgentInstructions: string[];
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
  ],
  childAgentInstructions: [
    "Maintain one source-backed legal database profile per EU member state.",
    "Monitor AI-related legal news, hard law, soft law, enforcement, and court decisions.",
    "Promote only official or corroborated information into durable jurisdiction timelines.",
    "Escalate missing official journals, parliamentary trackers, court databases, DPA pages, or government digital-policy sources.",
  ],
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
  ],
  childAgentInstructions: [
    "Maintain one source-backed legal database profile per US federal/state/DC jurisdiction.",
    "Monitor AI-related legal news, hard law, soft law, enforcement, attorney-general activity, agency guidance, and court decisions.",
    "Promote only official or corroborated information into durable jurisdiction timelines.",
    "Escalate missing legislatures, state registers, attorney-general pages, courts, or state digital-policy sources.",
  ],
  databaseInstructions: {
    centralBackendStore: "ai_regulatory_updates",
    jurisdictionProfileStore: "country_intelligence",
    timelineSource: "published_and_verified_regulatory_updates",
    distributionKey: "jurisdiction_country_region",
    requiredCoverage: ["hard_law", "soft_law", "case_law_and_decisions", "legal_news"],
  },
};
