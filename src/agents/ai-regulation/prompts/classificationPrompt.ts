import { promptSystemInstructions } from "@/agents/ai-regulation/prompts/versions";

export function buildRegulatoryClassificationPrompt(input: {
  sourceName: string;
  sourceUrl: string;
  jurisdiction: string;
  region: string;
  country: string;
  title: string;
  publicationDate: string | null;
  text: string;
}) {
  return `${promptSystemInstructions}

Task:
Return only valid JSON.
Classify the official item using only the provided source text and metadata.

Required fields:
- jurisdiction
- developmentType
- legalArea
- importanceLevel
- confidenceLevel
- tags

Rules:
- Rely only on the provided source text and metadata.
- Avoid speculation.
- Do not invent citations, article numbers, recital numbers, paragraph numbers, dates, institutions, or URLs.
- If citation metadata is not provided, leave citation-specific assumptions out of the answer.
- If the item is ambiguous, choose a lower confidence level.
- Distinguish binding law from proposed law, guidance, standards, policy reports, and announcements.
- Do not provide legal advice.
- Preserve the official source URL conceptually, but do not repeat it unless relevant to classification.
- Use concise legal-research language.

Provided metadata:
- sourceName: ${input.sourceName}
- sourceUrl: ${input.sourceUrl}
- jurisdictionHint: ${input.jurisdiction}
- regionHint: ${input.region}
- countryHint: ${input.country}
- title: ${input.title}
- publicationDate: ${input.publicationDate ?? "unknown"}

Source text:
${input.text}`;
}
