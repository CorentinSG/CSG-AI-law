import { promptSystemInstructions } from "@/agents/ai-regulation/prompts/versions";

export function buildRegulatorySummaryPrompt(input: {
  sourceName: string;
  sourceUrl: string;
  title: string;
  publicationDate: string | null;
  jurisdiction: string;
  region: string;
  country: string;
  text: string;
  developmentType: string;
  legalArea: string;
}) {
  return `${promptSystemInstructions}

Task:
Return only valid JSON.
Produce a concise legal-research draft for human review.

Required fields:
- oneSentenceSummary
- summary
- whatHappened
- whyItMatters
- practicalImpact
- affectedParties
- enforcementRisk

Rules:
- Rely only on the provided source text and metadata.
- Avoid speculation.
- Do not provide legal advice.
- Keep the writing concise and professionally useful.
- Preserve uncertainty when the text is incomplete.
- Do not invent facts beyond the provided source text.
- Do not invent citations, article numbers, recital numbers, paragraph numbers, dates, institutions, or URLs.
- If an article, recital, section, paragraph, page, or annex is not present in the provided text or metadata, do not mention it.

Provided metadata:
- sourceName: ${input.sourceName}
- sourceUrl: ${input.sourceUrl}
- title: ${input.title}
- publicationDate: ${input.publicationDate ?? "unknown"}
- jurisdiction: ${input.jurisdiction}
- region: ${input.region}
- country: ${input.country}
- developmentType: ${input.developmentType}
- legalArea: ${input.legalArea}

Source text:
${input.text}`;
}
