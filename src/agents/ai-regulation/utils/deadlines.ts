const monthNames =
  "(January|February|March|April|May|June|July|August|September|October|November|December)";

const deadlinePatterns = [
  new RegExp(`\\b${monthNames}\\s+\\d{1,2},\\s+\\d{4}\\b`, "g"),
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b(comment|comments|effective|deadline|compliance).{0,30}\b(by|on|before)\b.{0,20}/gi,
];

export function extractDeadlines(text: string) {
  const results = new Set<string>();

  for (const pattern of deadlinePatterns) {
    const matches = text.match(pattern) ?? [];
    for (const match of matches) {
      results.add(match.trim());
    }
  }

  return results.size
    ? Array.from(results)
    : ["No clear deadline was detected in the reviewed source."];
}

export function extractObligations(text: string) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const obligations = sentences.filter((sentence) =>
    /(must|should|required|obligation|duty|maintain|document|assess|review)/i.test(
      sentence,
    ),
  );

  return obligations.length
    ? obligations.slice(0, 4)
    : ["No binding obligations were identified in the reviewed source."];
}
