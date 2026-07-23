import { getBulgariaLiveLegalIntelligenceData } from "@/agents/ai-regulation/bulgariaLegalNewsAgent";
import { getCroatiaLiveLegalIntelligenceData } from "@/agents/ai-regulation/croatiaLegalNewsAgent";
import { getCyprusLiveLegalIntelligenceData } from "@/agents/ai-regulation/cyprusLegalNewsAgent";
import { getCzechiaLiveLegalIntelligenceData } from "@/agents/ai-regulation/czechiaLegalNewsAgent";
import { getDenmarkLiveLegalIntelligenceData } from "@/agents/ai-regulation/denmarkLegalNewsAgent";
import { getEstoniaLiveLegalIntelligenceData } from "@/agents/ai-regulation/estoniaLegalNewsAgent";
import { getFinlandLiveLegalIntelligenceData } from "@/agents/ai-regulation/finlandLegalNewsAgent";
import { getGreeceLiveLegalIntelligenceData } from "@/agents/ai-regulation/greeceLegalNewsAgent";
import { getHungaryLiveLegalIntelligenceData } from "@/agents/ai-regulation/hungaryLegalNewsAgent";
import { getLatviaLiveLegalIntelligenceData } from "@/agents/ai-regulation/latviaLegalNewsAgent";
import { getLithuaniaLiveLegalIntelligenceData } from "@/agents/ai-regulation/lithuaniaLegalNewsAgent";
import { getLuxembourgLiveLegalIntelligenceData } from "@/agents/ai-regulation/luxembourgLegalNewsAgent";
import { getMaltaLiveLegalIntelligenceData } from "@/agents/ai-regulation/maltaLegalNewsAgent";
import { getPolandLiveLegalIntelligenceData } from "@/agents/ai-regulation/polandLegalNewsAgent";
import { getPortugalLiveLegalIntelligenceData } from "@/agents/ai-regulation/portugalLegalNewsAgent";
import { getRomaniaLiveLegalIntelligenceData } from "@/agents/ai-regulation/romaniaLegalNewsAgent";
import { getSlovakiaLiveLegalIntelligenceData } from "@/agents/ai-regulation/slovakiaLegalNewsAgent";
import { getSloveniaLiveLegalIntelligenceData } from "@/agents/ai-regulation/sloveniaLegalNewsAgent";

/**
 * Slug → live-intelligence loader for every EU country served by the shared
 * factory agent (uniform return shape, including clustered `stories`).
 * The nine countries with bespoke agents and page blocks (France, Germany,
 * Spain, Italy, Netherlands, Belgium, Austria, Sweden, Ireland) are
 * intentionally absent — their pages fetch their dedicated agents directly.
 */
const factoryCountryLiveLoaders = {
  bulgaria: getBulgariaLiveLegalIntelligenceData,
  croatia: getCroatiaLiveLegalIntelligenceData,
  cyprus: getCyprusLiveLegalIntelligenceData,
  czechia: getCzechiaLiveLegalIntelligenceData,
  denmark: getDenmarkLiveLegalIntelligenceData,
  estonia: getEstoniaLiveLegalIntelligenceData,
  finland: getFinlandLiveLegalIntelligenceData,
  greece: getGreeceLiveLegalIntelligenceData,
  hungary: getHungaryLiveLegalIntelligenceData,
  latvia: getLatviaLiveLegalIntelligenceData,
  lithuania: getLithuaniaLiveLegalIntelligenceData,
  luxembourg: getLuxembourgLiveLegalIntelligenceData,
  malta: getMaltaLiveLegalIntelligenceData,
  poland: getPolandLiveLegalIntelligenceData,
  portugal: getPortugalLiveLegalIntelligenceData,
  romania: getRomaniaLiveLegalIntelligenceData,
  slovakia: getSlovakiaLiveLegalIntelligenceData,
  slovenia: getSloveniaLiveLegalIntelligenceData,
} satisfies Record<string, (limit?: number) => Promise<unknown>>;

export type CountryLiveLegalIntelligenceData = Awaited<
  ReturnType<typeof getBulgariaLiveLegalIntelligenceData>
>;

export function getCountryLiveIntelligenceLoader(
  slug: string,
): ((limit?: number) => Promise<CountryLiveLegalIntelligenceData>) | null {
  return (
    factoryCountryLiveLoaders[slug as keyof typeof factoryCountryLiveLoaders] ?? null
  );
}
