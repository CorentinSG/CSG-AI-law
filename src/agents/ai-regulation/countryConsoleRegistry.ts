import { getAustriaLiveLegalIntelligenceData } from "@/agents/ai-regulation/austriaLegalNewsAgent";
import { getBelgiumLiveLegalIntelligenceData } from "@/agents/ai-regulation/belgiumLegalNewsAgent";
import { getFranceLiveLegalIntelligenceData } from "@/agents/ai-regulation/franceLegalNewsAgent";
import { getGermanyLiveLegalIntelligenceData } from "@/agents/ai-regulation/germanyLegalNewsAgent";
import { getIrelandLiveLegalIntelligenceData } from "@/agents/ai-regulation/irelandLegalNewsAgent";
import { getItalyLiveLegalIntelligenceData } from "@/agents/ai-regulation/italyLegalNewsAgent";
import { getNetherlandsLiveLegalIntelligenceData } from "@/agents/ai-regulation/netherlandsLegalNewsAgent";
import { getSpainLiveLegalIntelligenceData } from "@/agents/ai-regulation/spainLegalNewsAgent";
import { getSwedenLiveLegalIntelligenceData } from "@/agents/ai-regulation/swedenLegalNewsAgent";
import { getAustriaAiIntelligenceSnapshot } from "@/content/ai-regulation/austria-ai-intelligence";
import { getBelgiumAiIntelligenceSnapshot } from "@/content/ai-regulation/belgium-ai-intelligence";
import { getFranceAiIntelligenceSnapshot } from "@/content/ai-regulation/france-ai-intelligence";
import { getGermanyAiIntelligenceSnapshot } from "@/content/ai-regulation/germany-ai-intelligence";
import { getIrelandAiIntelligenceSnapshot } from "@/content/ai-regulation/ireland-ai-intelligence";
import { getItalyAiIntelligenceSnapshot } from "@/content/ai-regulation/italy-ai-intelligence";
import { getNetherlandsAiIntelligenceSnapshot } from "@/content/ai-regulation/netherlands-ai-intelligence";
import { getSpainAiIntelligenceSnapshot } from "@/content/ai-regulation/spain-ai-intelligence";
import { getSwedenAiIntelligenceSnapshot } from "@/content/ai-regulation/sweden-ai-intelligence";

/**
 * Minimal structural contracts for the Country Console template
 * (src/app/[lang]/ai-regulation/europe/[country]/page.tsx). They describe
 * exactly what the console renders, so every country agent/snapshot module —
 * which all return richer, nominally distinct types — is assignable without
 * casts. When the 9 hand-written agents migrate to the factory (Wave 3.1),
 * only this registry needs repointing.
 */
export interface ConsoleLiveItem {
  item: {
    id: string;
    title: string;
    shortSummary: string;
    developmentType: string;
    sourceName: string;
    sourceUrl: string;
    officialSourceUrl: string | null;
    officialSourceFound: boolean;
    publicationDate: string | null;
  };
  currentness: {
    freshnessLabel: string;
  };
}

export interface ConsoleLiveSummary {
  breakingSignals: number;
  currentSignals: number;
  highUrgencySignals: number;
  watchSignals: number;
  staleSignals: number;
  officialLike: number;
  hardLawSignals: number;
  caseLawSignals: number;
  enforcementSignals: number;
}

export interface ConsoleLiveData {
  items: ConsoleLiveItem[];
  summary: ConsoleLiveSummary;
}

export interface ConsoleSnapshot {
  authorityMap: Array<{
    id: string;
    category: string;
    statusLabel: string;
    title: string;
    note: string;
    publicationDate?: string | null;
    sourceLabel: string;
    sourceUrl: string;
  }>;
  verifiedDecisions: Array<{
    id: string;
    authorityType: string;
    docketOrCaseNumber?: string | null;
    title: string;
    shortSummary: string;
    courtOrAuthority: string;
    date?: string | null;
    officialSourceUrl?: string | null;
  }>;
  timeline: Array<{
    id: string;
    category: string;
    title: string;
    note: string;
    date: string;
    sourceLabel: string;
    sourceUrl: string;
  }>;
}

export interface CountryConsoleEntry {
  getLiveData: (limit: number) => Promise<ConsoleLiveData>;
  getSnapshot: () => ConsoleSnapshot;
}

const registry: Record<string, CountryConsoleEntry> = {
  france: {
    getLiveData: getFranceLiveLegalIntelligenceData,
    getSnapshot: getFranceAiIntelligenceSnapshot,
  },
  germany: {
    getLiveData: getGermanyLiveLegalIntelligenceData,
    getSnapshot: getGermanyAiIntelligenceSnapshot,
  },
  spain: {
    getLiveData: getSpainLiveLegalIntelligenceData,
    getSnapshot: getSpainAiIntelligenceSnapshot,
  },
  italy: {
    getLiveData: getItalyLiveLegalIntelligenceData,
    getSnapshot: getItalyAiIntelligenceSnapshot,
  },
  netherlands: {
    getLiveData: getNetherlandsLiveLegalIntelligenceData,
    getSnapshot: getNetherlandsAiIntelligenceSnapshot,
  },
  belgium: {
    getLiveData: getBelgiumLiveLegalIntelligenceData,
    getSnapshot: getBelgiumAiIntelligenceSnapshot,
  },
  austria: {
    getLiveData: getAustriaLiveLegalIntelligenceData,
    getSnapshot: getAustriaAiIntelligenceSnapshot,
  },
  sweden: {
    getLiveData: getSwedenLiveLegalIntelligenceData,
    getSnapshot: getSwedenAiIntelligenceSnapshot,
  },
  ireland: {
    getLiveData: getIrelandLiveLegalIntelligenceData,
    getSnapshot: getIrelandAiIntelligenceSnapshot,
  },
};

export function getCountryConsoleEntry(slug: string): CountryConsoleEntry | null {
  return registry[slug] ?? null;
}
