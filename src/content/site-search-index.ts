import { getEuropeCountryProfiles } from "@/content/ai-regulation/europe-country-profiles";
import { getUsStateAiLawProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { getPublicResearchEntries } from "@/content/research";

export type SearchEntry = {
  title: string;
  href: string;
  group: "Page" | "Section" | "Country" | "State" | "Note";
  hint?: string;
  /** extra terms to match against (not displayed) */
  keywords?: string;
};

const pages: SearchEntry[] = [
  { title: "Home", href: "/", group: "Page", hint: "Overview" },
  { title: "AI Law Hub", href: "/ai-regulation", group: "Page", hint: "Unified legal intelligence", keywords: "news database monitor" },
  { title: "Europe", href: "/ai-regulation/europe", group: "Page", hint: "EU AI Act, Member States", keywords: "eu european union" },
  { title: "United States", href: "/ai-regulation/united-states", group: "Page", hint: "Federal + 50 states", keywords: "us usa america federal" },
  { title: "Notes", href: "/research", group: "Page", hint: "Commentary & analysis", keywords: "research writing blog" },
  { title: "Standards", href: "/standards", group: "Page", hint: "Soft law & frameworks", keywords: "iso nist frameworks" },
  { title: "Practice Areas", href: "/practice-areas", group: "Page", hint: "Legal domains covered" },
  { title: "Contact", href: "/contact", group: "Page", hint: "Professional inquiries" },
];

const europeSections: SearchEntry[] = [
  ["live", "Ongoing monitoring"],
  ["ai-act", "EU AI Act baseline"],
  ["timeline", "EU timeline"],
  ["governance", "Governance & case law"],
  ["standards", "Soft law & standards"],
  ["map", "Implementation map"],
  ["countries", "Country profiles"],
  ["sources", "Monitoring sources"],
].map(([id, title]) => ({
  title: `Europe · ${title}`,
  href: `/ai-regulation/europe#${id}`,
  group: "Section" as const,
}));

const usSections: SearchEntry[] = [
  ["live", "Ongoing monitoring"],
  ["federal", "Federal baseline"],
  ["timeline", "U.S. timeline"],
  ["states", "State implementation map"],
  ["profiles", "Priority state profiles"],
  ["governance", "Governance & case law"],
  ["sources", "Monitoring sources"],
].map(([id, title]) => ({
  title: `United States · ${title}`,
  href: `/ai-regulation/united-states#${id}`,
  group: "Section" as const,
}));

/**
 * Flat, client-safe index of everything the site search can jump to:
 * top-level pages, hub sections, every country/state profile, and every note.
 * Built once and memoised by the search component.
 */
export function buildSiteSearchIndex(): SearchEntry[] {
  const countries: SearchEntry[] = getEuropeCountryProfiles().map((p) => ({
    title: p.countryName,
    href: `/ai-regulation/europe/${p.slug}`,
    group: "Country",
    hint: "Europe",
    keywords: p.countryCode,
  }));

  const states: SearchEntry[] = getUsStateAiLawProfiles().map((p) => ({
    title: p.stateName,
    href: `/ai-regulation/united-states/${p.slug}`,
    group: "State",
    hint: "United States",
    keywords: p.stateCode,
  }));

  const notes: SearchEntry[] = getPublicResearchEntries().map((e) => ({
    title: e.title,
    href: `/research/${e.slug}`,
    group: "Note",
    hint: e.category,
    keywords: (e.tags ?? []).join(" "),
  }));

  return [...pages, ...europeSections, ...usSections, ...countries, ...states, ...notes];
}
