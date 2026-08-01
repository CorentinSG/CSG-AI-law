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
