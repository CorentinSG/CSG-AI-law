export type LegalMonitoringCapability =
  | "legal_news_monitoring"
  | "legal_database_maintenance"
  | "hard_law_tracking"
  | "soft_law_tracking"
  | "case_law_and_decisions_tracking"
  | "official_source_verification"
  | "cross_source_corroboration";

export type LegalMonitoringObligation =
  | "monitor_legal_news"
  | "update_legal_database"
  | "track_new_regulations"
  | "track_soft_law"
  | "track_hard_law"
  | "track_case_law_and_decisions"
  | "keep_country_or_state_profile_current"
  | "preserve_source_traceability"
  | "audit_child_agent_coverage"
  | "escalate_missing_sources";

export interface MonitoringAgentMandate {
  capabilities: LegalMonitoringCapability[];
  obligations: LegalMonitoringObligation[];
  coverage: {
    legalNews: true;
    legalDatabase: true;
    hardLaw: true;
    softLaw: true;
    caseLawAndDecisions: true;
  };
  publicationPolicy: {
    legalNews: "auto_publish_serious_or_corroborated_sources";
    legalDatabase: "auto_publish_official_sources";
    discoveryOnly: "admin_only_until_verified";
  };
}

export const jurisdictionMonitoringMandate: MonitoringAgentMandate = {
  capabilities: [
    "legal_news_monitoring",
    "legal_database_maintenance",
    "hard_law_tracking",
    "soft_law_tracking",
    "case_law_and_decisions_tracking",
    "official_source_verification",
    "cross_source_corroboration",
  ],
  obligations: [
    "monitor_legal_news",
    "update_legal_database",
    "track_new_regulations",
    "track_soft_law",
    "track_hard_law",
    "track_case_law_and_decisions",
    "keep_country_or_state_profile_current",
    "preserve_source_traceability",
  ],
  coverage: {
    legalNews: true,
    legalDatabase: true,
    hardLaw: true,
    softLaw: true,
    caseLawAndDecisions: true,
  },
  publicationPolicy: {
    legalNews: "auto_publish_serious_or_corroborated_sources",
    legalDatabase: "auto_publish_official_sources",
    discoveryOnly: "admin_only_until_verified",
  },
};

export const supervisorMonitoringMandate = {
  ...jurisdictionMonitoringMandate,
  obligations: [
    ...jurisdictionMonitoringMandate.obligations,
    "audit_child_agent_coverage",
    "escalate_missing_sources",
  ] satisfies LegalMonitoringObligation[],
} satisfies MonitoringAgentMandate;
