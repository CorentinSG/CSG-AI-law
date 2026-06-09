import type {
  DevelopmentType,
  ImportanceLevel,
  Jurisdiction,
  LegalArea,
} from "@/db/schema";

const developmentTypeRules: Array<[RegExp, DevelopmentType]> = [
  [/executive order|presidential action/i, "Executive order"],
  [/proposed rule|notice of proposed/i, "Proposed rule"],
  [/final rule/i, "Final rule"],
  [/court rule|rules of the chief administrator|chief administrative judge administrative order/i, "Final rule"],
  [/international standard|management system standard|iso\/iec 42001/i, "Standards document"],
  [/guidance|framework|tool|recommendation/i, "Agency guidance"],
  [/enforcement|fine|settlement|penalty/i, "Enforcement action"],
  [/consultation|request for information|call for evidence/i, "Public consultation"],
  [/policy report|report|observatory/i, "Policy report"],
  [/code of practice/i, "Code of practice"],
  [/treaty|convention/i, "International treaty"],
  [/\bbill\b|\blegislation\b|\bdraft law\b|\bproposed act\b/i, "Bill"],
  [/announcement|update/i, "Government announcement"],
];

const legalAreaRules: Array<[RegExp, LegalArea]> = [
  [/privacy|data protection|gdpr|personal data/i, "Data protection"],
  [/consumer/i, "Consumer protection"],
  [/employment|workplace|hiring/i, "Employment"],
  [/financial|bank|credit|securities/i, "Financial services"],
  [/health|medical/i, "Healthcare"],
  [/education|school/i, "Education"],
  [/public sector|agency|government procurement|benefits/i, "Public sector use of AI"],
  [/criminal justice|policing/i, "Criminal justice"],
  [/biometric|facial recognition/i, "Biometric identification"],
  [/discrimination|bias|civil rights/i, "Algorithmic discrimination"],
  [/automated decision|adjudication/i, "Automated decision-making"],
  [/copyright|generative/i, "Copyright and generative AI"],
  [/cybersecurity|security/i, "Cybersecurity"],
  [/product safety/i, "Product safety"],
  [/competition|antitrust/i, "Competition / antitrust"],
  [/lawyer|legal ethics|professional|attorney|court papers|court filings|filed in court/i, "Professional responsibility"],
  [/access to justice/i, "Access to justice"],
  [/governance|framework|ai act|standards/i, "AI governance"],
];

export function inferDevelopmentType(text: string): DevelopmentType {
  for (const [pattern, value] of developmentTypeRules) {
    if (pattern.test(text)) return value;
  }

  return "Other official regulatory development";
}

export function inferLegalArea(text: string): LegalArea {
  for (const [pattern, value] of legalAreaRules) {
    if (pattern.test(text)) return value;
  }

  return "Other";
}

export function inferJurisdiction(sourceName: string, text: string): Jurisdiction {
  const combined = `${sourceName} ${text}`;

  if (/california/i.test(combined)) return "California";
  if (/new york/i.test(combined)) return "New York";
  if (/france|cnil/i.test(combined)) return "France";
  if (/united kingdom|uk|ico/i.test(combined)) return "United Kingdom";
  if (/canada/i.test(combined)) return "Canada";
  if (/european union|eu ai office|eur-lex/i.test(combined))
    return "European Union";
  if (/oecd/i.test(combined)) return "OECD";
  if (/council of europe/i.test(combined)) return "Council of Europe";

  return "United States federal";
}

export function inferImportanceLevel(text: string): ImportanceLevel {
  if (/binding law|enters into force|major enforcement|executive order/i.test(text))
    return "critical";
  if (
    /court rule|court papers|professional responsibility|attorney filings|sanction|remedial action/i.test(
      text,
    )
  ) {
    return "high";
  }
  if (/international standard|iso\/iec 42001|nist ai rmf|governance framework/i.test(text))
    return "medium";
  if (/proposed rule|guidance|consultation|major/i.test(text)) return "high";
  if (/tool|sector|framework|update/i.test(text)) return "medium";
  return "low";
}
