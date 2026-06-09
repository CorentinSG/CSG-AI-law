import { promptSystemInstructions } from "@/agents/ai-regulation/prompts/versions";

export function buildObligationExtractionPrompt(input: {
  sourceName: string;
  sourceUrl: string;
  title: string;
  publicationDate: string | null;
  text: string;
}) {
  return `${promptSystemInstructions}

Task:
Return only valid JSON.
Extract obligations, deadlines, and practical compliance signals from the official source text.

Required fields:
- keyObligations
- complianceDeadlines

Rules:
- Rely only on the provided source text and metadata.
- Avoid speculation.
- Do not invent compliance deadlines.
- Do not invent obligations.
- Do not invent citations, article numbers, recital numbers, paragraph numbers, dates, institutions, or URLs.
- If no deadline is clearly stated, return ["No clear deadline detected"].
- If no obligation is clearly stated, return ["No specific obligation detected from the provided text"].
- Do not provide legal advice.

Provided metadata:
- sourceName: ${input.sourceName}
- sourceUrl: ${input.sourceUrl}
- title: ${input.title}
- publicationDate: ${input.publicationDate ?? "unknown"}

Source text:
${input.text}`;
}
