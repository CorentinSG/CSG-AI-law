import { promptSystemInstructions } from "@/agents/ai-regulation/prompts/versions";

export function relevancePrompt(text: string) {
  return `${promptSystemInstructions}

Task: Decide whether the item is an official AI regulatory development.
Reject generic AI news, blogs, opinion pieces, unofficial commentary, and general technology updates.

Source text:
${text}`;
}

export function classificationPrompt(text: string) {
  return `${promptSystemInstructions}

Task: Classify the jurisdiction, development type, legal area, importance level, and confidence level.

Source text:
${text}`;
}

export function summaryPrompt(text: string) {
  return `${promptSystemInstructions}

Task: Produce a professional legal intelligence draft with:
- one sentence summary
- what happened
- why it matters
- practical legal impact
- affected parties

Source text:
${text}`;
}
