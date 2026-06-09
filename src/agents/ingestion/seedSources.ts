/**
 * Initial seed sources for the Firecrawl + Scrapling ingestion pipeline.
 *
 * These are the authoritative official legal sources for AI law monitoring.
 * Method assignment:
 *   - firecrawl:  broad discovery sources where we want link enumeration + clean Markdown
 *   - scrapling:  targeted high-value pages with stable but important official updates
 *   - hybrid:     official sites where Firecrawl discovers links and Scrapling extracts detail
 *
 * To add a source at runtime: use the admin source management interface or
 * run the seed script: npm run seed:ingestion-sources
 *
 * IMPORTANT: these sources represent seed/initial registrations.
 * Do not fabricate publication dates, content, or legal conclusions.
 */

export interface IngestionSourceSeed {
  id: string;
  name: string;
  url: string;
  crawl_root_url?: string;
  region: string;
  jurisdiction: string;
  source_category: "official" | "regulator" | "court" | "parliament" | "media" | "newsletter";
  source_type: string;
  ingestion_method: "firecrawl" | "scrapling" | "hybrid";
  crawl_frequency: "daily" | "every_6_hours" | "weekly";
  reliability_level: "high" | "medium" | "low";
  notes: string;
}

export const INGESTION_SEED_SOURCES: IngestionSourceSeed[] = [
  // ── Europe ────────────────────────────────────────────────────────────

  {
    id: "ing-eu-ai-office",
    name: "EU AI Office",
    url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    crawl_root_url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    region: "Europe",
    jurisdiction: "European Union",
    source_category: "official",
    source_type: "regulator_page",
    ingestion_method: "hybrid",
    crawl_frequency: "daily",
    reliability_level: "high",
    notes:
      "EU AI Office — primary oversight body under the EU AI Act. " +
      "Hybrid: Firecrawl discovers pages, Scrapling extracts structured content.",
  },
  {
    id: "ing-eu-digital-strategy",
    name: "European Commission Digital Strategy / AI",
    url: "https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence",
    crawl_root_url: "https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence",
    region: "Europe",
    jurisdiction: "European Union",
    source_category: "official",
    source_type: "regulator_page",
    ingestion_method: "firecrawl",
    crawl_frequency: "daily",
    reliability_level: "high",
    notes:
      "European Commission AI policy hub. Firecrawl for broad discovery of policy pages and documents.",
  },
  {
    id: "ing-ep-ai",
    name: "European Parliament AI pages",
    url: "https://www.europarl.europa.eu/topics/en/article/20230601STO93804/eu-ai-act-first-regulation-on-artificial-intelligence",
    crawl_root_url: "https://www.europarl.europa.eu/topics/en/article/20230601STO93804",
    region: "Europe",
    jurisdiction: "European Union",
    source_category: "parliament",
    source_type: "legislative_database",
    ingestion_method: "scrapling",
    crawl_frequency: "weekly",
    reliability_level: "high",
    notes:
      "European Parliament AI Act tracking page. " +
      "Scrapling for reliable extraction from EP's stable but periodically updated page.",
  },
  {
    id: "ing-edpb-news",
    name: "EDPB News & Documents",
    url: "https://edpb.europa.eu/our-work-tools/our-documents_en",
    crawl_root_url: "https://edpb.europa.eu/news_en",
    region: "Europe",
    jurisdiction: "European Union",
    source_category: "regulator",
    source_type: "regulator_page",
    ingestion_method: "hybrid",
    crawl_frequency: "daily",
    reliability_level: "high",
    notes:
      "EDPB official news and guidance documents. " +
      "Hybrid: Firecrawl maps document index, Scrapling extracts structured content.",
  },

  // ── United States ─────────────────────────────────────────────────────

  {
    id: "ing-ny-courts-rules",
    name: "New York Courts Uniform Rules",
    url: "https://www.nycourts.gov/rules/",
    crawl_root_url: "https://www.nycourts.gov/rules/",
    region: "United States",
    jurisdiction: "New York",
    source_category: "court",
    source_type: "court_database",
    ingestion_method: "scrapling",
    crawl_frequency: "weekly",
    reliability_level: "high",
    notes:
      "New York State Unified Court System rules. " +
      "Scrapling for reliable extraction — Part 161 AI disclosure rules and future amendments. " +
      "Note: HTTP 403 from this environment at runtime; parser-ready but runtime-blocked.",
  },
  {
    id: "ing-cppa",
    name: "California Privacy Protection Agency",
    url: "https://cppa.ca.gov/regulations/",
    crawl_root_url: "https://cppa.ca.gov/news_and_announcements/",
    region: "United States",
    jurisdiction: "California",
    source_category: "regulator",
    source_type: "regulator_page",
    ingestion_method: "hybrid",
    crawl_frequency: "daily",
    reliability_level: "high",
    notes:
      "CPPA — California automated decision-making and AI rules. " +
      "Hybrid: Firecrawl discovers new pages, Scrapling extracts regulations/guidance.",
  },
  {
    id: "ing-co-ag-ai",
    name: "Colorado Attorney General AI Act",
    url: "https://coag.gov/resources/artificial-intelligence/",
    crawl_root_url: "https://coag.gov/resources/artificial-intelligence/",
    region: "United States",
    jurisdiction: "Colorado",
    source_category: "official",
    source_type: "regulator_page",
    ingestion_method: "firecrawl",
    crawl_frequency: "weekly",
    reliability_level: "high",
    notes:
      "Colorado AG resources on the Colorado AI Act (SB 24-205). " +
      "Firecrawl for broad discovery of resources and guidance documents.",
  },
  {
    id: "ing-ftc-ai",
    name: "FTC AI-related pages",
    url: "https://www.ftc.gov/policy/advocacy-research/tech-at-ftc/artificial-intelligence",
    crawl_root_url: "https://www.ftc.gov/policy/advocacy-research/tech-at-ftc/artificial-intelligence",
    region: "United States",
    jurisdiction: "United States federal",
    source_category: "regulator",
    source_type: "regulator_page",
    ingestion_method: "hybrid",
    crawl_frequency: "daily",
    reliability_level: "high",
    notes:
      "FTC AI-related enforcement actions, guidance, and policy statements. " +
      "Hybrid: Firecrawl discovers new documents/actions, Scrapling extracts structured content.",
  },
];
