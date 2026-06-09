import type { NormalizedRegulatoryUpdateDraft } from "@/agents/ai-regulation/types";
import { extractDeadlines, extractObligations } from "@/agents/ai-regulation/utils/deadlines";
import type { AuthorityType } from "@/db/schema";

export const aiSummarizer = {
  summarize(input: {
    title: string;
    text: string;
    legalArea: NormalizedRegulatoryUpdateDraft["legalArea"];
    developmentType: NormalizedRegulatoryUpdateDraft["developmentType"];
    authorityType: AuthorityType;
  }): Pick<
    NormalizedRegulatoryUpdateDraft,
    | "title"
    | "oneSentenceSummary"
    | "summary"
    | "whatHappened"
    | "whyItMatters"
    | "practicalImpact"
    | "affectedParties"
    | "keyObligations"
    | "complianceDeadlines"
    | "enforcementRisk"
  > {
    const base = input.text.replace(/\s+/g, " ").trim();
    const short = base.slice(0, 280);
    const nonBinding =
      input.authorityType === "Soft law" ||
      input.authorityType === "Technical standard" ||
      input.authorityType === "Governance framework" ||
      input.authorityType === "Best practice" ||
      input.authorityType === "Policy report" ||
      input.authorityType === "Agency guidance" ||
      input.authorityType === "Proposed law";

    return {
      title: input.title,
      oneSentenceSummary: nonBinding
        ? `${input.authorityType} material touching ${input.legalArea.toLowerCase()} issues in the AI governance and regulatory landscape.`
        : `${input.developmentType} touching ${input.legalArea.toLowerCase()} issues in the AI regulation landscape.`,
      summary: short,
      whatHappened: base.slice(0, 420),
      whyItMatters: nonBinding
        ? "This item may shape compliance expectations, governance design, comparative legal analysis, or regulator-facing best practices even if it is not automatically binding law."
        : "This item may affect regulatory expectations, comparative legal analysis, or compliance planning for organizations working with AI systems.",
      practicalImpact:
        nonBinding
          ? "Counsel and compliance teams should compare the source against existing AI governance, documentation, oversight, and disclosure practices while noting that this material may be influential without being directly binding."
          : "Counsel and compliance teams should compare the source against existing AI governance, documentation, oversight, and disclosure practices before relying on it operationally.",
      affectedParties: [
        "Lawyers",
        "Compliance teams",
        "AI developers",
        "Regulated organizations",
      ],
      keyObligations: extractObligations(base),
      complianceDeadlines: extractDeadlines(base),
      enforcementRisk:
        input.developmentType === "Enforcement action"
          ? "The source appears to carry direct enforcement significance."
          : nonBinding
            ? "The source appears non-binding on its face, but it may still influence supervisory expectations, audits, procurement decisions, or future compliance benchmarks."
          : "The source should be reviewed to determine whether it signals future enforcement priorities or compliance risk.",
    };
  },
};
