import { promptSystemInstructions } from "@/agents/ai-regulation/prompts/versions";

// Single combined prompt covering classification, narrative summary, and
// obligation extraction. The source text is sent to the model once instead of
// three times, cutting input token usage by roughly two thirds per item.
export function buildRegulatoryAnalysisPrompt(input: {
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
Analyze the official item using only the provided source text and metadata, producing classification, a concise legal-research draft for human review, and extracted obligations in a single response.

Required fields:
- jurisdiction
- developmentType
- legalArea
- importanceLevel
- confidenceLevel
- tags
- oneSentenceSummary
- summary
- whatHappened
- whyItMatters
- practicalImpact
- affectedParties
- enforcementRisk
- keyObligations
- complianceDeadlines

Rules:
- Rely only on the provided source text and metadata.
- Avoid speculation.
- Do not provide legal advice.
- Do not invent facts beyond the provided source text.
- Do not invent citations, article numbers, recital numbers, paragraph numbers, dates, institutions, or URLs.
- If an article, recital, section, paragraph, page, or annex is not present in the provided text or metadata, do not mention it.
- If the item is ambiguous, choose a lower confidence level.
- Distinguish binding law from proposed law, guidance, standards, policy reports, and announcements.
- Keep the writing concise and professionally useful.
- Preserve uncertainty when the text is incomplete.
- Do not invent compliance deadlines or obligations.
- If no deadline is clearly stated, return ["No clear deadline detected"].
- If no obligation is clearly stated, return ["No specific obligation detected from the provided text"].

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
