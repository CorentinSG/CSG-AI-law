// Operational checklist for Article 50 of Regulation (EU) 2024/1689.
// Content is derived from the Commission FAQ, the AI Act Service Desk article
// page, and the Code of Practice on Transparency of AI-Generated Content —
// see ARTICLE_50_SOURCES at the bottom of this file.

export type Article50GroupId =
  | "legal"
  | "providers"
  | "deployers"
  | "product"
  | "comms"
  | "vendors";

export type Article50Priority = "high" | "medium";

export type Article50Item = {
  id: string;
  group: Article50GroupId;
  /** Short imperative label shown on the collapsed row. */
  title: string;
  /** Which paragraph of Article 50 the item serves, if any. */
  provision: string;
  /** Why the item exists. */
  purpose: string;
  /** Concrete steps to carry out. */
  actions: string[];
  teams: string[];
  /** What to keep so the control can be evidenced later. */
  evidence: string[];
  priority: Article50Priority;
  timeline: string;
};

export type Article50Group = {
  id: Article50GroupId;
  label: string;
  description: string;
};

/** Article 50 starts applying on this date. */
export const ARTICLE_50_APPLICATION_DATE = "2026-08-02";

/**
 * Limited transition: applies only to the Article 50(2) machine-readable
 * marking duty, and only for systems placed on the market before 2 Aug 2026.
 * It does not postpone any other Article 50 duty.
 */
export const ARTICLE_50_MARKING_GRACE_DATE = "2026-12-02";

export const article50Groups: Article50Group[] = [
  {
    id: "legal",
    label: "Legal & compliance",
    description:
      "Scope the exposure, allocate provider and deployer roles, and decide how compliance will be evidenced.",
  },
  {
    id: "providers",
    label: "Providers",
    description:
      "Entities that develop an AI system and place it on the EU market or put it into service under their own name or trademark.",
  },
  {
    id: "deployers",
    label: "Deployers",
    description:
      "Entities using an AI system under their authority, excluding purely personal non-professional use. A company can be both provider and deployer.",
  },
  {
    id: "product",
    label: "Product & engineering",
    description:
      "Make the disclosures actually appear, stay accessible, and survive the delivery pipeline.",
  },
  {
    id: "comms",
    label: "Communications & editorial",
    description:
      "Label public-facing content, and use the human-review exemption only where it genuinely applies.",
  },
  {
    id: "vendors",
    label: "Vendors & procurement",
    description:
      "Close the contractual gaps between what a supplier marks and what you must display.",
  },
];

export const article50Items: Article50Item[] = [
  // --- Legal & compliance ---
  {
    id: "legal-scoping",
    group: "legal",
    title: "Complete Article 50 scoping and role allocation",
    provision: "Scope",
    purpose:
      "Determine where the company is a provider, a deployer, or both. The fastest triage question is not “Do we use AI?” but which business units are providers, which are deployers, and which outputs reach people directly.",
    actions: [
      "Build a use-case register covering every AI system that reaches people.",
      "Assign a provider or deployer role per workflow.",
      "Identify EU-facing outputs, including non-EU products whose outputs are used in the Union.",
      "Set a RACI by business unit.",
    ],
    teams: ["Legal", "Compliance", "AI governance", "Procurement"],
    evidence: [
      "Use-case inventory",
      "RACI matrix",
      "Territorial-scope memo",
      "Board or steering-pack excerpt",
    ],
    priority: "high",
    timeline: "Immediate",
  },
  {
    id: "legal-code-of-practice",
    group: "legal",
    title: "Decide on the Code of Practice strategy",
    provision: "Art. 50(2), (4), (5)",
    purpose:
      "Choose the simplest evidence model. The Code of Practice on Transparency of AI-Generated Content is voluntary, but the Commission and the AI Board have assessed it as an adequate method for demonstrating compliance with the marking and labelling duties.",
    actions: [
      "Determine whether to sign the Code for the relevant provider and/or deployer functions.",
      "If not signing, define the “alternative adequate means” evidence package — non-signatories remain free to comply otherwise but should expect to prove adequacy more directly.",
    ],
    teams: ["Legal", "Compliance", "Executive sponsor"],
    evidence: [
      "Signatory decision memo",
      "Code adherence plan",
      "Evidence index for the non-signatory alternative",
    ],
    priority: "high",
    timeline: "Within days",
  },
  {
    id: "legal-evidence-file",
    group: "legal",
    title: "Create an Article 50 evidence file",
    provision: "Evidence",
    purpose:
      "Prepare for regulator requests and internal audit. Enforcement is decentralised: national market surveillance authorities will mainly enforce Article 50.",
    actions: [
      "Centralise screenshots, scripts, metadata specs, exception decisions, accessibility reviews, vendor attestations, and publication review records.",
      "Retain dated copies of control changes made before 2 August, and before 2 December for eligible legacy systems.",
    ],
    teams: ["Compliance", "Internal audit", "Records management"],
    evidence: [
      "Evidence register",
      "Retention policy",
      "Control-owner certifications",
    ],
    priority: "high",
    timeline: "Immediate and ongoing",
  },

  // --- Providers ---
  {
    id: "provider-direct-interaction",
    group: "providers",
    title: "Enable direct-interaction disclosure by design",
    provision: "Art. 50(1)",
    purpose:
      "Systems intended to interact directly with natural persons must be designed so people are informed they are interacting with AI, before market placement or service launch.",
    actions: [
      "Identify all systems that directly converse with natural persons.",
      "Decide whether any “obvious interaction” position is defensible — the Commission says this exception should be interpreted restrictively.",
      "Implement a default greeting, banner, or voice disclosure in every channel and locale.",
      "Confirm accessibility support.",
    ],
    teams: ["Product owner", "Legal", "UX", "Engineering"],
    evidence: [
      "Scope memo",
      "Screenshots",
      "Voice prompt scripts",
      "Accessibility review",
      "Decision log on any “obvious” exception",
    ],
    priority: "high",
    timeline: "Immediate — complete before 2 Aug 2026",
  },
  {
    id: "provider-marking",
    group: "providers",
    title: "Implement machine-readable provenance or marking",
    provision: "Art. 50(2)",
    purpose:
      "Synthetic audio, image, video, or text outputs must be machine-readable and detectable as artificially generated or manipulated. Solutions should be effective, interoperable, robust, and reliable so far as technically feasible.",
    actions: [
      "Turn on automated marking for synthetic text, image, audio, and video where in scope.",
      "Document technical feasibility limits by modality.",
      "Test detectability after export, compression, API delivery, and platform upload.",
    ],
    teams: ["Engineering", "ML platform", "Security", "Legal"],
    evidence: [
      "Technical spec",
      "Test logs",
      "Sample marked files",
      "Detectability results",
      "Limitation register",
    ],
    priority: "high",
    timeline:
      "Immediate for live systems; eligible legacy systems by 2 Dec 2026",
  },
  {
    id: "provider-scope-split",
    group: "providers",
    title: "Separate in-scope from out-of-scope outputs",
    provision: "Art. 50(2)",
    purpose:
      "Avoid over-labelling some content while missing others. Source code, short symbol strings, machine-to-machine outputs and some closed-loop industrial outputs fall outside the marking duty.",
    actions: [
      "Classify source code, short strings, machine-to-machine outputs, draft industrial outputs, standard-editing functions, and final consumer-facing outputs.",
      "Document why any output is treated as outside Article 50(2).",
    ],
    teams: ["Legal", "ML governance", "Platform engineering"],
    evidence: [
      "Output classification matrix",
      "Exception rationale",
      "Owner sign-off",
    ],
    priority: "high",
    timeline: "Immediate; refresh monthly",
  },

  // --- Deployers ---
  {
    id: "deployer-deepfake",
    group: "deployers",
    title: "Turn on deepfake labelling",
    provision: "Art. 50(4)",
    purpose:
      "Image, audio, or video content constituting a deepfake must be disclosed as artificially generated or manipulated. Visible or audible disclosure is required — machine-readable marks alone are not enough.",
    actions: [
      "Identify deepfake use cases across ads, training, customer support, social media, entertainment, investor and brand content.",
      "Place visible or audible notices at first exposure.",
      "Do not rely solely on provider metadata.",
    ],
    teams: ["Content operations", "Marketing", "Legal", "Web/app ops"],
    evidence: [
      "Label screenshots",
      "Player overlays",
      "Audio scripts",
      "Publishing SOP",
      "Sample outputs",
    ],
    priority: "high",
    timeline: "Immediate — complete before 2 Aug 2026",
  },
  {
    id: "deployer-public-interest-text",
    group: "deployers",
    title: "Label public-interest text, or control the review exemption",
    provision: "Art. 50(4)",
    purpose:
      "AI-generated or manipulated text published to inform the public on matters of public interest must be disclosed, unless it underwent substantive human review and a person holds editorial responsibility. Spell-checking or grammar checks are not enough.",
    actions: [
      "Flag content involving politics, public health, law, justice, security, environment, consumer safety, or major economic, scientific and cultural debate.",
      "Either label it, or route it through a substantive human review and editorial responsibility workflow.",
    ],
    teams: ["Editorial", "Public affairs", "Legal", "Communications"],
    evidence: [
      "Review checklist",
      "Editor approval record",
      "Publication attestation",
      "Labelled examples",
    ],
    priority: "high",
    timeline: "Immediate",
  },
  {
    id: "deployer-biometric-notices",
    group: "deployers",
    title: "Implement emotion-recognition and biometric exposure notices",
    provision: "Art. 50(3)",
    purpose:
      "People exposed to an emotion recognition or biometric categorisation system must be informed it is operating. Article 50(3) also expressly requires personal data to be processed in accordance with the GDPR — a notice is necessary but not sufficient.",
    actions: [
      "Map kiosks, surveillance systems, workplace analytics, access control, fraud tools, and customer analytics using such functions.",
      "Post notices at first exposure.",
      "Align with the privacy notice and the lawful-basis analysis; assess whether a DPIA or DPO involvement is required.",
    ],
    teams: ["Operations", "Privacy", "Facilities", "Security", "HR", "Product"],
    evidence: [
      "Notice text",
      "Placement photos",
      "Privacy assessment",
      "Data-flow map",
    ],
    priority: "high",
    timeline: "Immediate",
  },

  // --- Product & engineering ---
  {
    id: "product-first-exposure",
    group: "product",
    title: "Ensure notices appear at first interaction or first exposure",
    provision: "Art. 50(5)",
    purpose:
      "The required information must be provided no later than the first interaction or exposure.",
    actions: [
      "Add notices to the first screen, first chat turn, first audio prompt, first playback segment, article header, or equivalent.",
      "Verify across web, mobile, API wrappers, embedded widgets, and third-party distribution channels.",
    ],
    teams: ["Engineering", "UX", "QA"],
    evidence: [
      "Regression tests",
      "Screenshots",
      "Video captures",
      "Release notes",
    ],
    priority: "high",
    timeline: "Immediate",
  },
  {
    id: "product-accessibility",
    group: "product",
    title: "Make notices and labels accessible and perceivable",
    provision: "Art. 50(5)",
    purpose:
      "Information must be clear, distinguishable, and accessible — which also aligns with the GDPR transparency standard.",
    actions: [
      "Use readable contrast, screen-reader labels, captions, alt text, and audible disclosure where needed.",
      "Test with assistive technologies.",
      "Localise the wording.",
    ],
    teams: ["UX", "Accessibility", "Engineering", "Localization"],
    evidence: [
      "Accessibility issue log",
      "WCAG-aligned review notes",
      "Translated strings",
    ],
    priority: "high",
    timeline: "Immediate",
  },
  {
    id: "product-metadata-preservation",
    group: "product",
    title: "Preserve and verify metadata through the pipeline",
    provision: "Art. 50(2)",
    purpose:
      "Provider-side marking is only meaningful if it survives delivery. Many pipelines silently strip provenance information.",
    actions: [
      "Test whether the CDN, CMS, DAM, social tools, image processors, and transcoders strip marks.",
      "Log failures.",
      "Implement preservation rules, or fallback visible labelling.",
    ],
    teams: ["Platform engineering", "CMS team", "Security"],
    evidence: ["Preservation test matrix", "Defect tickets", "Remediation plan"],
    priority: "high",
    timeline:
      "Critical fixes before 2 Aug 2026; eligible legacy fixes before 2 Dec 2026",
  },

  // --- Communications & editorial ---
  {
    id: "comms-human-review",
    group: "comms",
    title: "Build a meaningful human-review workflow for public-interest text",
    provision: "Art. 50(4)",
    purpose:
      "Use the exemption only where it is genuinely available. Review must be substantive, and someone must hold editorial responsibility.",
    actions: [
      "Require subject-matter review by someone with relevant knowledge.",
      "Give the reviewer authority to approve, alter, or reject on substantive grounds.",
      "Never leave “editorial responsibility” undefined.",
    ],
    teams: ["Editorial", "Legal", "Public policy", "Communications"],
    evidence: [
      "Human-review checklist",
      "Named reviewer log",
      "Editorial-responsibility designation",
    ],
    priority: "high",
    timeline: "Immediate",
  },
  {
    id: "comms-label-placement",
    group: "comms",
    title: "Standardise label placement and icon usage",
    provision: "Art. 50(5)",
    purpose:
      "Make disclosures understandable and consistent across channels.",
    actions: [
      "Adopt a style rule for where labels appear on articles, videos, audio players, social posts, and campaign assets.",
      "Use the optional EU icon if helpful, but pair it with plain-language text as the safer default unless usability testing shows icon-only disclosure is clearly understood.",
    ],
    teams: ["Brand", "Communications", "UX", "Legal"],
    evidence: [
      "Style guide",
      "Creative templates",
      "Approval examples",
      "Usability notes",
    ],
    priority: "medium",
    timeline: "Immediate",
  },
  {
    id: "comms-artistic-works",
    group: "comms",
    title: "Handle artistic, satirical and fictional content separately",
    provision: "Art. 50(4)",
    purpose:
      "For evidently artistic, creative, satirical or fictional works, disclosure may be given in a way that does not hamper enjoyment of the work — but the allowance should not be over-claimed.",
    actions: [
      "For films, satire, fiction and analogous works, decide how disclosure can appear without harming enjoyment.",
      "Document why the chosen presentation is appropriate.",
    ],
    teams: ["Editorial", "Production", "Legal"],
    evidence: [
      "Exception memo",
      "Example assets",
      "Content classification log",
    ],
    priority: "medium",
    timeline: "Before publication of each asset",
  },

  // --- Vendors & procurement ---
  {
    id: "vendor-contract-allocation",
    group: "vendors",
    title: "Allocate Article 50 duties contractually",
    provision: "Roles",
    purpose:
      "Prevent responsibility gaps between provider and deployer functions.",
    actions: [
      "Amend contracts to state who supplies machine-readable marking, who displays user-facing labels, who preserves marks, and who responds to regulator inquiries.",
    ],
    teams: ["Procurement", "Legal", "Vendor management"],
    evidence: [
      "Contract addenda",
      "Clause library",
      "Vendor responsibility matrix",
    ],
    priority: "high",
    timeline: "Immediate for top-risk vendors",
  },
  {
    id: "vendor-marking-evidence",
    group: "vendors",
    title: "Obtain vendor evidence on marking capabilities and limits",
    provision: "Art. 50(2)",
    purpose:
      "Prove technical feasibility efforts and preserve escalation rights.",
    actions: [
      "Request documentation on the marking method, supported formats, detectability limits, known metadata-stripping risks, and rollout timing for legacy systems.",
    ],
    teams: ["Procurement", "Engineering", "Legal"],
    evidence: [
      "Vendor questionnaire",
      "Attestations",
      "Technical whitepaper or support tickets",
    ],
    priority: "high",
    timeline: "Immediate",
  },
  {
    id: "vendor-privacy-terms",
    group: "vendors",
    title: "Align privacy terms for biometric or emotion systems",
    provision: "Art. 50(3)",
    purpose:
      "Reduce GDPR exposure where Article 50(3) applies.",
    actions: [
      "Confirm controller and processor roles, lawful-basis support, subprocessor use, retention, data-minimisation controls, security, audit rights, and DPO or DPIA support commitments.",
    ],
    teams: ["Privacy", "Legal", "Procurement", "Security"],
    evidence: [
      "DPA",
      "Transfer assessment if relevant",
      "DPIA input from vendor",
      "Security annex",
    ],
    priority: "high",
    timeline: "Immediate",
  },
];

export type Article50Template = {
  id: string;
  useCase: string;
  wording: string;
  note: string;
};

/**
 * Article 50 does not prescribe exact wording. It requires the information to
 * be clear, distinguishable, accessible, and given by first interaction or
 * exposure. These are illustrative, drafted to the legal standard rather than
 * copied from an official EU template.
 */
export const article50Templates: Article50Template[] = [
  {
    id: "direct-interaction",
    useCase: "Direct AI interaction",
    wording: "You are interacting with an AI system.",
    note: "Shortest defensible version for chat, voice, kiosk, or avatar experiences. Use at the start of the interaction.",
  },
  {
    id: "direct-interaction-escalation",
    useCase: "Direct AI interaction, with escalation",
    wording:
      "You are interacting with our AI assistant. A human can review or take over where available.",
    note: "The second sentence is optional but often good UX. The first sentence carries the Article 50 function.",
  },
  {
    id: "biometric",
    useCase: "Emotion recognition or biometric categorisation",
    wording:
      "This service uses AI-based emotion recognition or biometric categorisation during operation.",
    note: "Article 50(3) does not itself require the purpose to be stated, but a GDPR privacy notice may require broader information.",
  },
  {
    id: "deepfake",
    useCase: "Deepfake video or audio",
    wording:
      "This content has been artificially generated or manipulated using AI.",
    note: "Put it on the player, opening frame, caption, or audible introduction. Do not rely only on hidden metadata.",
  },
  {
    id: "public-interest-text",
    useCase: "AI-generated public-interest text",
    wording:
      "This text was generated or manipulated using AI and was not subject to human editorial review.",
    note: "Use where the human-review exemption is not met.",
  },
  {
    id: "voluntary",
    useCase: "Voluntary disclosure for exempt text",
    wording:
      "This publication used AI assistance and was reviewed by human editors.",
    note: "Not legally required where the exemption applies. Many organisations still use it as a trust measure — a policy choice, not an Article 50 mandate.",
  },
];

export type Article50Source = {
  label: string;
  href: string;
  note: string;
};

export const article50Sources: Article50Source[] = [
  {
    label: "Article 50 — Regulation (EU) 2024/1689 (AI Act Service Desk)",
    href: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50",
    note: "Core legal text: duties, timing, accessibility, and exceptions.",
  },
  {
    label: "Commission FAQ — Transparency obligations under Article 50",
    href: "https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act",
    note: "Operational source for scope, exceptions, human review, the grace period, and enforcement.",
  },
  {
    label:
      "Guidelines on transparency obligations for providers and deployers",
    href: "https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems",
    note: "Commission guidelines adopted in July 2026.",
  },
  {
    label: "Code of Practice on Transparency of AI-Generated Content",
    href: "https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content",
    note: "Voluntary, but assessed as an adequate way to demonstrate compliance with Article 50(2), (4) and (5).",
  },
  {
    label: "Quick facts — Transparency rules for AI systems",
    href: "https://digital-strategy.ec.europa.eu/en/factpages/quick-facts-transparency-rules-ai-systems",
    note: "Official summary of obligations, penalties, grace period, and optional icons.",
  },
  {
    label: "Article 99 — Penalties",
    href: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99",
    note: "Penalty ceilings applicable to Article 50 breaches.",
  },
  {
    label: "Article 2 — Scope",
    href: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-2",
    note: "Extra-territorial reach where outputs are used in the Union.",
  },
];

export function getArticle50ItemsByGroup(group: Article50GroupId) {
  return article50Items.filter((item) => item.group === group);
}

// ---------------------------------------------------------------------------
// Situation triage — "which obligations apply to you?"
// ---------------------------------------------------------------------------

export type Article50DutyId =
  | "duty-50-1"
  | "duty-50-2"
  | "duty-50-3"
  | "duty-50-4-deepfake"
  | "duty-50-4-text"
  | "duty-scope"
  | "duty-grace"
  | "duty-both-roles";

export type Article50Duty = {
  id: Article50DutyId;
  label: string;
  summary: string;
  /** Checklist groups to work through when this duty applies. */
  groups: Article50GroupId[];
};

export const article50Duties: Article50Duty[] = [
  {
    id: "duty-50-1",
    label: "Art. 50(1) — direct-interaction disclosure",
    summary:
      "People must be informed they are interacting with AI, at the latest at the first interaction, in every channel and locale. The “obvious to a reasonable person” exception is interpreted restrictively.",
    groups: ["providers", "product"],
  },
  {
    id: "duty-50-2",
    label: "Art. 50(2) — machine-readable marking",
    summary:
      "Synthetic audio, image, video and text outputs must be marked machine-readable and detectable as artificially generated or manipulated — effective, interoperable, robust and reliable so far as technically feasible. Test that marks survive export, compression and platform upload.",
    groups: ["providers", "product", "vendors"],
  },
  {
    id: "duty-50-3",
    label: "Art. 50(3) — emotion recognition & biometric categorisation",
    summary:
      "People exposed to the system must be informed it is operating, at the latest at first exposure. The notice is necessary but not sufficient: GDPR still requires a lawful basis, and often a DPIA.",
    groups: ["deployers", "legal", "vendors"],
  },
  {
    id: "duty-50-4-deepfake",
    label: "Art. 50(4) — deepfake labelling",
    summary:
      "Deepfake image, audio or video content must carry a visible or audible disclosure at first exposure. Machine-readable marks alone are not enough.",
    groups: ["deployers", "comms"],
  },
  {
    id: "duty-50-4-text",
    label: "Art. 50(4) — public-interest text",
    summary:
      "AI-generated text published to inform the public on matters of public interest must be disclosed — unless it underwent substantive human review and a person holds editorial responsibility. Spell-checking is not enough.",
    groups: ["deployers", "comms"],
  },
  {
    id: "duty-scope",
    label: "Territorial scope (Art. 2)",
    summary:
      "Non-EU providers and deployers can still be in scope where the system's output is used in the Union. Assign an owner for EU-facing compliance even without an EU establishment.",
    groups: ["legal"],
  },
  {
    id: "duty-grace",
    label: "Transition to 2 December 2026 — Art. 50(2) only",
    summary:
      "Systems placed on the market before 2 August 2026 have until 2 December 2026 for the machine-readable marking duty only. Every other Article 50 duty applies from 2 August 2026 — the grace period does not postpone them.",
    groups: ["providers", "legal"],
  },
  {
    id: "duty-both-roles",
    label: "Dual role — provider and deployer",
    summary:
      "A single company can be provider for some workflows and deployer for others. Allocate the role per use case in one register, and assign each Article 50 duty accordingly.",
    groups: ["legal"],
  },
];

export type Article50Situation = {
  id: string;
  statement: string;
  duties: Article50DutyId[];
};

export const article50Situations: Article50Situation[] = [
  {
    id: "sit-interaction",
    statement:
      "A system we offer or operate interacts directly with people — chat, voice assistant, avatar, kiosk.",
    duties: ["duty-50-1"],
  },
  {
    id: "sit-generation",
    statement:
      "We develop or offer a system that generates or manipulates audio, images, video or text.",
    duties: ["duty-50-2"],
  },
  {
    id: "sit-deepfake",
    statement:
      "We publish AI-generated or AI-manipulated images, audio or video that appear real (deepfakes) — including in ads, training or brand content.",
    duties: ["duty-50-4-deepfake"],
  },
  {
    id: "sit-text",
    statement:
      "We publish AI-generated text that informs the public on matters of public interest — politics, health, law, justice, security, environment, consumer safety.",
    duties: ["duty-50-4-text"],
  },
  {
    id: "sit-biometric",
    statement:
      "We use emotion recognition or biometric categorisation — workplace analytics, kiosks, CCTV analytics, access control, fraud tools.",
    duties: ["duty-50-3"],
  },
  {
    id: "sit-non-eu",
    statement:
      "We are established outside the EU, but outputs of our AI systems are used in the Union.",
    duties: ["duty-scope"],
  },
  {
    id: "sit-legacy",
    statement:
      "Some of our in-scope systems were placed on the market before 2 August 2026.",
    duties: ["duty-grace"],
  },
  {
    id: "sit-both",
    statement:
      "Different business units both build AI systems and use third-party AI tools.",
    duties: ["duty-both-roles"],
  },
];

// ---------------------------------------------------------------------------
// Scenario library — edge cases and special situations
// ---------------------------------------------------------------------------

export type Article50ScenarioCategory = "provider" | "deployer" | "special";

export type Article50Scenario = {
  id: string;
  category: Article50ScenarioCategory;
  title: string;
  situation: string;
  applies: string[];
  traps?: string[];
};

export const article50ScenarioCategories: {
  id: Article50ScenarioCategory;
  label: string;
}[] = [
  { id: "provider", label: "Provider situations" },
  { id: "deployer", label: "Deployer situations" },
  { id: "special", label: "Special cases" },
];

export const article50Scenarios: Article50Scenario[] = [
  // --- Provider situations ---
  {
    id: "sc-chatbot",
    category: "provider",
    title: "Customer-facing chatbot or voice assistant",
    situation:
      "You build or offer a system intended to interact directly with natural persons.",
    applies: [
      "Art. 50(1): design the disclosure into the system before market placement — default greeting, banner or voice prompt, in every channel and locale.",
      "Disclosure at the latest at the first interaction.",
    ],
    traps: [
      "The “obvious AI interaction” exception is interpreted restrictively — document any reliance on it.",
      "A disclosure that exists in one channel but not in an embedded widget or API wrapper is a gap.",
    ],
  },
  {
    id: "sc-genai-product",
    category: "provider",
    title: "Generative AI product — image, audio, video or text",
    situation:
      "Your system produces synthetic content within Article 50(2).",
    applies: [
      "Machine-readable marking, detectable as artificially generated or manipulated.",
      "Solutions effective, interoperable, robust and reliable so far as technically feasible — document feasibility limits by modality.",
    ],
    traps: [
      "Marks that do not survive export, compression, API delivery or platform upload.",
      "Relying on marking alone where a deployer also needs a visible disclosure.",
    ],
  },
  {
    id: "sc-editing",
    category: "provider",
    title: "Assistive or standard-editing features only",
    situation:
      "Your AI feature retouches, corrects or adjusts content without substantially altering the input.",
    applies: [
      "No marking duty where the input is not substantially altered (standard-editing exception).",
    ],
    traps: [
      "The line between “standard editing” and generation is factual — document the analysis per feature, and revisit when features gain generative capability.",
    ],
  },
  {
    id: "sc-legacy",
    category: "provider",
    title: "System placed on the market before 2 August 2026",
    situation: "An in-scope system predates the application date.",
    applies: [
      "Transition until 2 December 2026 — but only for the Art. 50(2) machine-readable marking duty.",
      "All other Article 50 duties apply from 2 August 2026.",
    ],
    traps: [
      "Treating the grace period as a general postponement — it is not.",
      "Systems placed on the market on or after 2 August 2026 get no transition at all.",
    ],
  },
  {
    id: "sc-b2b",
    category: "provider",
    title: "B2B, machine-to-machine or closed-loop industrial outputs",
    situation:
      "Outputs are source code, short symbol strings, machine-to-machine data, or non-final industrial outputs.",
    applies: [
      "These can fall outside the Art. 50(2) marking duty; the guidelines also describe a narrow B2B or industrial exemption under stated conditions.",
    ],
    traps: [
      "The exemption is narrow and conditional — keep a documented rationale per output type, signed off by an owner.",
      "An “industrial” output that later reaches consumers re-enters scope.",
    ],
  },
  {
    id: "sc-non-eu-provider",
    category: "provider",
    title: "Non-EU provider with users in the Union",
    situation:
      "You have no EU establishment, but your system's outputs are used in the EU.",
    applies: [
      "Article 2 scope: non-EU providers and deployers can still be in scope where outputs are used in the Union.",
    ],
    traps: [
      "Assuming geography alone puts you out of scope — map where outputs actually land, not where servers sit.",
    ],
  },

  // --- Deployer situations ---
  {
    id: "sc-embedded-chatbot",
    category: "deployer",
    title: "Vendor chatbot embedded on your site or app",
    situation:
      "You deploy a third-party conversational system under your authority.",
    applies: [
      "The provider builds the disclosure; you need operational controls so it actually appears in use — in your theme, your locales, your channels.",
    ],
    traps: [
      "A custom skin or integration that hides the provider's disclosure.",
      "No contractual clarity on who answers a regulator's question.",
    ],
  },
  {
    id: "sc-deepfake-marketing",
    category: "deployer",
    title: "Deepfake in marketing, training or entertainment content",
    situation:
      "You publish AI-generated or manipulated image, audio or video that appears real.",
    applies: [
      "Art. 50(4): visible or audible disclosure at first exposure — player overlay, opening frame, caption or audible introduction.",
    ],
    traps: [
      "Relying on the provider's hidden metadata alone — it does not satisfy the visible-disclosure duty.",
      "Labels that disappear when content is downloaded, shared, embedded or reposted.",
    ],
  },
  {
    id: "sc-artistic",
    category: "deployer",
    title: "Evidently artistic, satirical or fictional work",
    situation:
      "The deepfake is part of a film, satire, fiction or analogous work.",
    applies: [
      "Disclosure may be given in a way that does not hamper enjoyment of the work.",
    ],
    traps: [
      "Over-claiming the allowance for content that is not evidently artistic — classify and document each asset.",
    ],
  },
  {
    id: "sc-news-text",
    category: "deployer",
    title: "AI-drafted articles on public-interest topics",
    situation:
      "You publish AI-generated text informing the public on politics, health, law, justice, security, environment, consumer safety or major public debate.",
    applies: [
      "Label the text — or run it through substantive human review with a person holding editorial responsibility.",
    ],
    traps: [
      "Spell-checking or grammar passes do not qualify as substantive review.",
      "“Editorial responsibility” left undefined — name the person.",
    ],
  },
  {
    id: "sc-internal-text",
    category: "deployer",
    title: "Internal-only AI text, never published",
    situation:
      "AI drafts internal reports, memos or emails that are not published to inform the public.",
    applies: [
      "The Art. 50(4) text duty targets text published to inform the public on matters of public interest — purely internal documents are generally outside it.",
    ],
    traps: [
      "Internal content that later gets published — build the labelling check into the publication step, not the drafting step.",
    ],
  },
  {
    id: "sc-hr-emotion",
    category: "deployer",
    title: "Emotion recognition in HR, sales or support",
    situation:
      "Workplace analytics, interview tools or call-centre systems infer emotions.",
    applies: [
      "Art. 50(3): inform exposed persons the system is operating, at first exposure.",
      "GDPR in parallel: lawful basis, transparency, and likely a DPIA — a notice alone is not compliance.",
    ],
    traps: [
      "Forgetting that other AI Act chapters (including high-risk duties) may apply on top of Article 50.",
    ],
  },
  {
    id: "sc-kiosk-biometric",
    category: "deployer",
    title: "Biometric categorisation in physical spaces",
    situation:
      "Kiosks, retail analytics or CCTV-linked systems categorise people on biometric data.",
    applies: [
      "Art. 50(3) notice at first exposure — posted where people actually see it.",
      "Large-scale monitoring of publicly accessible areas is a typical DPIA trigger under the GDPR.",
    ],
    traps: [
      "A notice hidden in a privacy policy no one sees before exposure.",
    ],
  },
  {
    id: "sc-old-content",
    category: "deployer",
    title: "Content created before 2 August 2026",
    situation: "Your archives contain AI-generated content from before the application date.",
    applies: [
      "No retroactive labelling is required; the Commission encourages voluntary labelling where feasible.",
    ],
    traps: [
      "Re-publishing or re-cutting old content after 2 August 2026 — treat that as a new publication decision.",
    ],
  },

  // --- Special cases ---
  {
    id: "sc-both-roles",
    category: "special",
    title: "You are both provider and deployer",
    situation:
      "One business unit ships an AI product; another uses third-party AI tools.",
    applies: [
      "Allocate the role per use case in a single register, and assign each Article 50 duty accordingly.",
    ],
    traps: [
      "Duties falling into the gap between two teams that each assume the other owns them.",
    ],
  },
  {
    id: "sc-employees",
    category: "special",
    title: "Employees using AI tools at work",
    situation:
      "Staff use AI systems in the course of their job.",
    applies: [
      "Employees acting under the authority and control of a legal entity are generally not separate deployers — the company holds the duties.",
    ],
    traps: [
      "Shadow AI: tools adopted by teams without appearing in the company's use-case register.",
    ],
  },
  {
    id: "sc-eu-institutions",
    category: "special",
    title: "EU institutions, bodies and agencies",
    situation: "The provider or deployer is an EU institution.",
    applies: [
      "The European Data Protection Supervisor is the competent authority; the Commission fact page notes fines up to €750,000.",
    ],
  },
  {
    id: "sc-sme",
    category: "special",
    title: "SMEs and start-ups",
    situation: "You are a small company with limited compliance resources.",
    applies: [
      "The duties are the same, but fines carry lower caps under the AI Act's proportionality rules (general ceiling: €15 million or 3% of worldwide annual turnover).",
    ],
    traps: [
      "Deferring scoping because of size — the register and front-end notices are the minimum viable controls.",
    ],
  },
  {
    id: "sc-gpai",
    category: "special",
    title: "System built on your own GPAI model, or integrated into a designated platform",
    situation:
      "The same entity provides both the system and the general-purpose model, or the system is integrated into a designated very large online platform or search engine.",
    applies: [
      "The AI Office has a specific enforcement role in these configurations, alongside national market surveillance authorities.",
    ],
  },
  {
    id: "sc-law-enforcement",
    category: "special",
    title: "Law-enforcement uses",
    situation:
      "The system is used for the detection, prevention, investigation or prosecution of criminal offences.",
    applies: [
      "Specific exceptions exist across Art. 50(1)–(4), under the conditions stated in each paragraph.",
    ],
    traps: [
      "The exceptions are conditional, not a blanket carve-out — document the reliance conditions for each use.",
    ],
  },
];

export function getArticle50DutiesForSituations(situationIds: string[]) {
  const dutyIds = new Set<Article50DutyId>();
  for (const situation of article50Situations) {
    if (situationIds.includes(situation.id)) {
      situation.duties.forEach((duty) => dutyIds.add(duty));
    }
  }
  return article50Duties.filter((duty) => dutyIds.has(duty.id));
}
