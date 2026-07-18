const euMemberStateJurisdictions = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
] as const;

const nonEuWesternBalkanEuropeJurisdictions = [
  "Albania",
  "Andorra",
  "Bosnia and Herzegovina",
  "Iceland",
  "Kosovo",
  "Liechtenstein",
  "Monaco",
  "Montenegro",
  "North Macedonia",
  "Norway",
  "San Marino",
  "Serbia",
  "Switzerland",
  "Vatican City",
] as const;

const usStateJurisdictions = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

export const jurisdictions = [
  "United States federal",
  ...usStateJurisdictions,
  "European Union",
  ...euMemberStateJurisdictions,
  "United Kingdom",
  ...nonEuWesternBalkanEuropeJurisdictions,
  "Canada",
  "OECD",
  "Council of Europe",
  "UNESCO",
  "United Nations",
  "WIPO",
  "ISO",
  "IEEE",
  "International",
] as const;

export const sourceTypes = [
  "RSS",
  "API",
  "static_page",
  "dynamic_page",
  "PDF_repository",
  "legislative_database",
  "regulator_page",
  "court_database",
  "standards_body",
  "tracker_source",
  "discovery_source",
  "media_source",
] as const;

export const scanFrequencies = [
  "hourly",
  "every_6_hours",
  "daily",
  "weekly",
] as const;

export const reliabilityLevels = ["high", "medium", "low"] as const;

export const extractionMethods = [
  "rss",
  "api",
  "html_static",
  "html_dynamic",
  "pdf",
] as const;

export const processingStatuses = [
  "new",
  "duplicate",
  "processed",
  "failed",
] as const;

export const developmentTypes = [
  "Statute",
  "Bill",
  "Regulation",
  "Proposed rule",
  "Final rule",
  "Executive order",
  "Agency guidance",
  "Enforcement action",
  "Public consultation",
  "Policy report",
  "Standards document",
  "International treaty",
  "Government announcement",
  "Code of practice",
  "Other official regulatory development",
] as const;

export const legalAreas = [
  "AI governance",
  "Privacy",
  "Data protection",
  "Consumer protection",
  "Employment",
  "Labor and social law",
  "Cloud and infrastructure",
  "Financial services",
  "Healthcare",
  "Education",
  "Public sector use of AI",
  "Criminal justice",
  "Biometric identification",
  "Algorithmic discrimination",
  "Automated decision-making",
  "Copyright and generative AI",
  "Cybersecurity",
  "Product safety",
  "Competition / antitrust",
  "Professional responsibility",
  "Access to justice",
  "Other",
] as const;

export const importanceLevels = ["critical", "high", "medium", "low"] as const;
export const confidenceLevels = ["high", "medium", "low"] as const;
export const authorityTypes = [
  "Binding law",
  "Proposed law",
  "Regulation",
  "Agency guidance",
  "Enforcement action",
  "Soft law",
  "Technical standard",
  "Governance framework",
  "Policy report",
  "Best practice",
  "Other",
] as const;
export const reviewStatuses = [
  "needs_review",
  "approved",
  "rejected",
  "published",
  "archived",
] as const;

export type Jurisdiction = (typeof jurisdictions)[number];
export type SourceType = (typeof sourceTypes)[number];
export type ScanFrequency = (typeof scanFrequencies)[number];
export type ReliabilityLevel = (typeof reliabilityLevels)[number];
export type ExtractionMethod = (typeof extractionMethods)[number];
export type ProcessingStatus = (typeof processingStatuses)[number];
export type DevelopmentType = (typeof developmentTypes)[number];
export type LegalArea = (typeof legalAreas)[number];
export type ImportanceLevel = (typeof importanceLevels)[number];
export type ConfidenceLevel = (typeof confidenceLevels)[number];
export type AuthorityType = (typeof authorityTypes)[number];
export type ReviewStatus = (typeof reviewStatuses)[number];
