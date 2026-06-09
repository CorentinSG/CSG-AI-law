import type { NormalizedRegulatoryUpdateDraft } from "@/agents/ai-regulation/types";
import {
  inferDevelopmentType,
  inferImportanceLevel,
  inferJurisdiction,
  inferLegalArea,
} from "@/agents/ai-regulation/utils/classification";
import { inferAuthorityType } from "@/agents/ai-regulation/utils/authority";
import type { AuthorityType } from "@/db/schema";

export const aiClassifier = {
  classify(input: {
    title: string;
    text: string;
    sourceName: string;
    publicationDate?: string | null;
    jurisdictionHint?: NormalizedRegulatoryUpdateDraft["jurisdiction"];
    developmentTypeHint?: NormalizedRegulatoryUpdateDraft["developmentType"];
    legalAreaHint?: NormalizedRegulatoryUpdateDraft["legalArea"];
    authorityTypeHint?: AuthorityType;
  }): Pick<
    NormalizedRegulatoryUpdateDraft,
    | "jurisdiction"
    | "developmentType"
    | "legalArea"
    | "importanceLevel"
    | "confidenceLevel"
    | "tags"
    | "publicationDate"
  > & {
    authorityType: AuthorityType;
  } {
    const combined = `${input.title}. ${input.text}`;
    const developmentType =
      input.developmentTypeHint ?? inferDevelopmentType(combined);
    const legalArea = input.legalAreaHint ?? inferLegalArea(combined);
    const authorityType = inferAuthorityType({
      developmentType,
      title: input.title,
      text: input.text,
      sourceName: input.sourceName,
      authorityTypeHint: input.authorityTypeHint,
    });

    return {
      jurisdiction:
        input.jurisdictionHint ?? inferJurisdiction(input.sourceName, combined),
      developmentType,
      legalArea,
      importanceLevel: inferImportanceLevel(combined),
      confidenceLevel: input.text.length > 200 ? "high" : "medium",
      tags: Array.from(
        new Set(
          [
            input.sourceName,
            legalArea,
            developmentType,
            authorityType,
          ]
            .map((value) => value.toLowerCase())
            .map((value) => value.replace(/\s+/g, "-")),
        ),
      ),
      publicationDate: input.publicationDate ?? null,
      authorityType,
    };
  },
};
