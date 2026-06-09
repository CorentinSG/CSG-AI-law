export type ResearchPublicationStatus = "published" | "draft" | "forthcoming";

export type ResearchCategory =
  | "AI Regulation"
  | "AI Litigation"
  | "AI Governance"
  | "AI & Legal Ethics"
  | "Legal Technology"
  | "Access to Justice"
  | "Comparative AI Law"
  | "EU AI Law"
  | "U.S. AI Law"
  | "Soft Law & Standards"
  | "Legal Intelligence Systems"
  | "Research Notes";

export type ResearchBodySection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type ResearchReference = {
  label: string;
  href?: string;
  note?: string;
};

export type ResearchEntry = {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  status: ResearchPublicationStatus;
  category: ResearchCategory;
  tags: string[];
  jurisdiction?: string;
  readingTime: string;
  summary: string;
  abstract: string;
  publishedAt?: string;
  updatedAt?: string;
  featured?: boolean;
  relatedSlugs?: string[];
  body: ResearchBodySection[];
  references?: ResearchReference[];
};

const author = "Corentin Saint-Girons";

export const researchEntries: ResearchEntry[] = [
  {
    slug: "emerging-architecture-ai-regulation",
    title: "The Emerging Architecture of AI Regulation",
    subtitle:
      "Why AI compliance now depends on reading statutes, supervisory guidance, and governance frameworks together rather than in isolation.",
    author,
    status: "published",
    category: "AI Regulation",
    tags: [
      "AI regulation",
      "Governance frameworks",
      "Comparative AI Law",
      "Legal Intelligence",
    ],
    jurisdiction: "Comparative / International",
    readingTime: "8 min read",
    summary:
      "A public note on how AI regulation is becoming a layered architecture of law, guidance, enforcement signals, and governance frameworks.",
    abstract:
      "AI compliance is no longer shaped only by enacted rules. In practice, obligations and expectations are emerging through a combination of binding law, implementation guidance, supervisory attention, and standards-linked governance frameworks.",
    featured: true,
    relatedSlugs: [
      "why-soft-law-matters-ai-compliance",
      "eu-us-ai-governance-comparative-note",
      "monitoring-to-meaning-legal-research-platforms",
    ],
    body: [
      {
        heading: "A layered regulatory environment",
        paragraphs: [
          "The public conversation around AI law often looks for a single controlling instrument: a statute, an AI act, or a set of administrative rules. In practice, the operating environment is more layered than that. Legal effect is distributed across formal law, agency guidance, enforcement posture, procurement expectations, internal governance requirements, and technical standards.",
          "That layered structure matters for lawyers, compliance teams, and researchers because it changes how risk is identified. A development may be legally non-binding and still shape documentation expectations, audit readiness, or the standard of care used by institutions when they evaluate AI systems.",
        ],
      },
      {
        heading: "Why legal intelligence cannot stop at hard law",
        paragraphs: [
          "A serious AI law research platform should therefore monitor more than enacted legislation. It should track which instruments are formally binding, which are proposed or consultative, and which are becoming practically influential because supervisors, procurers, or courts may treat them as persuasive governance baselines.",
          "This does not mean collapsing everything into the same category. The central discipline is classification. Binding law, soft law, standards, and best-practice materials each operate differently and should be identified with precision rather than flattened into a single stream of 'AI policy' content.",
        ],
        bullets: [
          "Binding law creates formal obligations.",
          "Guidance can shape interpretation and compliance posture.",
          "Enforcement can reveal practical theories of risk.",
          "Standards and frameworks often become operational reference points.",
        ],
      },
      {
        heading: "Implications for the platform",
        paragraphs: [
          "That is the reason this platform treats the AI Regulation Monitor, the soft-law and standards layer, and future research notes as connected but distinct surfaces. Monitoring is useful, but it becomes more valuable when linked to a publication layer that can explain what kind of authority a source actually has and why it matters.",
          "The goal is not volume. It is structure: a cleaner way to observe how AI law develops across jurisdictions and across different forms of authority.",
        ],
      },
    ],
    references: [
      {
        label: "AI Regulation Monitor",
        href: "/ai-regulation",
        note: "Public monitor for reviewed and published items.",
      },
      {
        label: "Standards and governance frameworks",
        href: "/standards",
        note: "Public explanation of soft law and standards coverage.",
      },
    ],
  },
  {
    slug: "why-soft-law-matters-ai-compliance",
    title: "Why Soft Law Matters in AI Compliance",
    subtitle:
      "Non-binding frameworks frequently become the operational language of AI governance long before formal law answers every question.",
    author,
    status: "published",
    category: "Soft Law & Standards",
    tags: [
      "NIST AI RMF",
      "ISO/IEC 42001",
      "OWASP AIMA",
      "Soft law",
      "Governance",
    ],
    jurisdiction: "International / U.S.",
    readingTime: "7 min read",
    summary:
      "A public note on why governance frameworks and standards matter even when they are not automatically binding law.",
    abstract:
      "Soft law and technical standards do not always create formal legal duties, but they can shape internal controls, procurement expectations, assurance practices, and eventually enforcement narratives. For AI compliance, they are often too important to ignore.",
    relatedSlugs: [
      "emerging-architecture-ai-regulation",
      "from-monitoring-to-meaning",
      "legal-intelligence-systems-future-regulatory-monitoring",
    ],
    body: [
      {
        heading: "Soft law as operational infrastructure",
        paragraphs: [
          "Many organizations encounter AI governance first through operational questions rather than through a completed body of sector-specific law. They need documentation practices, accountability structures, testing records, risk escalation pathways, and assurance language before all legal questions have settled.",
          "That is where soft law and standards often become influential. Frameworks like the NIST AI RMF provide a shared vocabulary for identifying and documenting risk. Standards-adjacent materials can then shape how governance programs are described internally and externally.",
        ],
      },
      {
        heading: "Three different functions",
        paragraphs: [
          "The three materials highlighted here should not be treated as identical. NIST AI RMF functions as a governance framework. ISO/IEC 42001 is a management system standard. OWASP AIMA contributes best-practice and security-oriented guidance. The authority level is different, but each can matter in a mature compliance conversation.",
        ],
        bullets: [
          "NIST AI RMF: governance and lifecycle risk framing.",
          "ISO/IEC 42001: management system structure and accountability scaffolding.",
          "OWASP AIMA: security and implementation-oriented best practices.",
        ],
      },
      {
        heading: "Why classification matters",
        paragraphs: [
          "The platform therefore labels these materials separately instead of presenting them as binding law. That distinction is not cosmetic. It is essential to honest legal analysis. A useful legal intelligence system should explain influence without overstating legal force.",
        ],
      },
    ],
    references: [
      {
        label: "Standards",
        href: "/standards",
        note: "Public page on standards and soft law coverage.",
      },
      {
        label: "NIST AI RMF source monitoring",
        href: "/ai-regulation",
        note: "Reviewed monitor items may appear publicly after publication.",
      },
    ],
  },
  {
    slug: "ai-legal-ethics-early-questions-lawyers",
    title:
      "Early Questions on AI, Legal Ethics, and Professional Responsibility",
    subtitle:
      "A forthcoming note on supervision, transparency, diligence, and risk framing when AI tools move into legal work.",
    author,
    status: "forthcoming",
    category: "AI & Legal Ethics",
    tags: ["Professional responsibility", "Legal ethics", "Lawyers", "AI tools"],
    jurisdiction: "U.S. / Comparative",
    readingTime: "Forthcoming",
    summary:
      "A forthcoming note on professional responsibility questions raised by AI-assisted legal services and legal workflows.",
    abstract:
      "This note will examine how duties of competence, supervision, confidentiality, communication, and diligence may evolve as AI tools move deeper into legal research, drafting, review, and client-facing workflows.",
    relatedSlugs: [
      "legal-intelligence-systems-future-regulatory-monitoring",
      "ai-regulation-access-to-justice",
    ],
    body: [
      {
        heading: "Preview",
        paragraphs: [
          "This research note is in development. The final piece will focus on how AI deployment in legal services reframes questions of supervision, documentation, transparency to clients, and the boundaries of acceptable reliance on machine-generated work.",
          "It will also consider how legal ethics interacts with product design. In many cases, the practical safeguards that matter most are not only legal rules, but workflow decisions around review, escalation, and evidence preservation.",
        ],
      },
    ],
  },
  {
    slug: "eu-us-ai-governance-comparative-note",
    title: "EU and U.S. Approaches to AI Governance",
    subtitle:
      "A structured comparison of how regulatory architecture differs when jurisdictions rely on legislation, sectoral oversight, and governance frameworks in different proportions.",
    author,
    status: "forthcoming",
    category: "Comparative AI Law",
    tags: ["EU AI Law", "U.S. AI Law", "Comparative AI Law", "Governance"],
    jurisdiction: "European Union / United States",
    readingTime: "Note in development",
    summary:
      "A forthcoming comparative note on the different legal techniques used to govern AI across the EU and the United States.",
    abstract:
      "This piece will compare how EU and U.S. institutions are building AI governance through different blends of formal legislation, sector-specific oversight, enforcement, procurement, and governance frameworks.",
    relatedSlugs: [
      "emerging-architecture-ai-regulation",
      "from-monitoring-to-meaning",
    ],
    body: [
      {
        heading: "Preview",
        paragraphs: [
          "The comparative value of AI law research lies partly in identifying differences of legal form. Similar policy concerns can produce very different institutional responses depending on administrative traditions, federal structure, sectoral regulation, and the maturity of public governance frameworks.",
          "This note will focus on those differences rather than trying to flatten them into a single universal AI governance narrative.",
        ],
      },
    ],
  },
  {
    slug: "legal-intelligence-systems-future-regulatory-monitoring",
    title: "Legal Intelligence Systems and Regulatory Monitoring",
    subtitle:
      "Why legal monitoring becomes more useful when sources, authority levels, and review workflows are structured rather than merely aggregated.",
    author,
    status: "forthcoming",
    category: "Legal Intelligence Systems",
    tags: [
      "Legal intelligence",
      "Regulatory monitoring",
      "Human review",
      "Structured analysis",
    ],
    readingTime: "Note in development",
    summary:
      "A note in development on how human-reviewed legal intelligence systems can organize AI law developments more meaningfully than a generic feed.",
    abstract:
      "This piece will argue that monitoring only becomes durable legal intelligence when it includes source discipline, authority classification, editorial review, and structured comparison across jurisdictions.",
    relatedSlugs: [
      "emerging-architecture-ai-regulation",
      "from-monitoring-to-meaning",
      "ai-regulation-access-to-justice",
    ],
    body: [
      {
        heading: "Preview",
        paragraphs: [
          "A monitoring product that simply accumulates sources can generate noise faster than understanding. The harder challenge is editorial structure: distinguishing what is binding, what is influential, what is repetitive, and what deserves deeper legal analysis.",
          "This forthcoming note will use the architecture of the current platform as a case study in how legal intelligence systems can remain useful without becoming generic AI-content machines.",
        ],
      },
    ],
  },
  {
    slug: "ai-regulation-access-to-justice",
    title: "AI Regulation and Access to Justice",
    subtitle:
      "A note on why AI law infrastructure should also be evaluated through public-interest use, institutional access, and practical legal accessibility.",
    author,
    status: "forthcoming",
    category: "Access to Justice",
    tags: ["Access to Justice", "Public interest", "AI governance", "Legal tools"],
    readingTime: "Note in development",
    summary:
      "A forthcoming note on how AI law tooling and commentary platforms might better serve public-interest legal work and access-to-justice goals.",
    abstract:
      "As AI regulation grows more complex, legal information asymmetries may widen. This note will explore how research tools, monitors, and structured publication systems can support broader public understanding rather than only enterprise compliance.",
    relatedSlugs: [
      "ai-legal-ethics-early-questions-lawyers",
      "legal-intelligence-systems-future-regulatory-monitoring",
    ],
    body: [
      {
        heading: "Preview",
        paragraphs: [
          "AI governance is often discussed through enterprise readiness and regulator expectations. Those questions matter, but they should not crowd out access-to-justice considerations. Public-interest legal work also depends on intelligible, navigable research infrastructure.",
          "This forthcoming note will connect AI regulation monitoring to questions of accessibility, comparative public understanding, and legal information design.",
        ],
      },
    ],
  },
  {
    slug: "from-monitoring-to-meaning",
    title: "From Monitoring to Meaning",
    subtitle:
      "An internal draft on how editorial systems can turn regulatory signals into legal understanding without collapsing into generic commentary.",
    author,
    status: "draft",
    category: "Research Notes",
    tags: ["Internal draft", "Editorial systems", "AI Law"],
    readingTime: "Internal draft",
    summary:
      "Internal draft not intended for public exposure.",
    abstract:
      "This draft exists to test private/public separation in the research architecture and should not be publicly visible.",
    body: [
      {
        heading: "Internal draft",
        paragraphs: [
          "This draft should remain hidden from public routes until a future publication step is chosen explicitly.",
        ],
      },
    ],
  },
];

export const researchCategories: ResearchCategory[] = [
  "AI Regulation",
  "AI Litigation",
  "AI Governance",
  "AI & Legal Ethics",
  "Legal Technology",
  "Access to Justice",
  "Comparative AI Law",
  "EU AI Law",
  "U.S. AI Law",
  "Soft Law & Standards",
  "Legal Intelligence Systems",
  "Research Notes",
];

function sortResearchEntries(entries: ResearchEntry[]) {
  return [...entries].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    if (dateA !== dateB) return dateB - dateA;
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.title.localeCompare(b.title);
  });
}

export function getAllResearchEntries() {
  return sortResearchEntries(researchEntries);
}

export function getPublicResearchEntries() {
  return sortResearchEntries(
    researchEntries.filter((entry) => entry.status !== "draft"),
  );
}

export function getFeaturedResearchEntry() {
  return getPublicResearchEntries().find((entry) => entry.featured) ?? null;
}

export function getResearchEntryBySlug(slug: string) {
  return researchEntries.find((entry) => entry.slug === slug) ?? null;
}

export function getPublicResearchEntryBySlug(slug: string) {
  const entry = getResearchEntryBySlug(slug);
  if (!entry || entry.status === "draft") return null;
  return entry;
}

export function getResearchEntriesByCategory(category: ResearchCategory) {
  return getPublicResearchEntries().filter((entry) => entry.category === category);
}

export function getResearchCategoryCounts() {
  return researchCategories
    .map((category) => ({
      category,
      count: getPublicResearchEntries().filter((entry) => entry.category === category)
        .length,
    }))
    .filter((item) => item.count > 0);
}

export function getRelatedResearchEntries(entry: ResearchEntry, limit = 3) {
  const relatedBySlug = new Set(entry.relatedSlugs ?? []);
  const others = getPublicResearchEntries().filter((candidate) => candidate.slug !== entry.slug);

  return sortResearchEntries(
    others.filter(
      (candidate) =>
        relatedBySlug.has(candidate.slug) ||
        candidate.category === entry.category ||
        candidate.tags.some((tag) => entry.tags.includes(tag)),
    ),
  ).slice(0, limit);
}
