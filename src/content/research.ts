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

/** Languages a note can be read in. Independent of the site's UI locale. */
export type ArticleLanguage = "en" | "fr" | "es";

export const ARTICLE_LANGUAGES: ArticleLanguage[] = ["en", "fr", "es"];

export const ARTICLE_LANGUAGE_LABELS: Record<ArticleLanguage, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

/**
 * A rendition of a note in one language. Everything a reader sees changes;
 * metadata that is language-neutral (dates, image, tags) does not.
 */
export type ResearchTranslation = {
  title: string;
  subtitle: string;
  readingTime: string;
  summary: string;
  abstract: string;
  body: ResearchBodySection[];
  references?: ResearchReference[];
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
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  featured?: boolean;
  relatedSlugs?: string[];
  body: ResearchBodySection[];
  references?: ResearchReference[];
  /** The language the author wrote in. Defaults to English. */
  originalLanguage?: ArticleLanguage;
  /** Renditions in other languages, offered through the language switcher. */
  translations?: Partial<Record<ArticleLanguage, ResearchTranslation>>;
};

// Public registry consumed by the research routes and tests.

// --- ARCHIVE : entrées retirées temporairement, à republier avec contenu rédigé ---
const author = "Corentin Saint-Girons";
export const researchEntries: ResearchEntry[] = [
  {
    slug: "ai-office-pouvoirs-enquete-sanction-gpai",
    title:
      "L'AI Office européen peut désormais enquêter sur les fournisseurs d'IA et les sanctionner",
    subtitle:
      "Depuis le 2 août 2026, la Commission dispose enfin des pouvoirs qui manquaient à un an d'obligations GPAI. Les règles n'ont pas changé : c'est le pouvoir de les faire respecter qui est né.",
    author,
    status: "published",
    category: "EU AI Law",
    tags: [
      "AI Office",
      "GPAI",
      "Enforcement",
      "Règlement IA",
      "Sanctions",
      "Modèles à usage général",
    ],
    jurisdiction: "Union européenne",
    readingTime: "9 min de lecture",
    originalLanguage: "fr",
    summary:
      "Depuis le 2 août 2026, le Bureau européen de l'IA dispose de pouvoirs formels d'enquête et de sanction sur les fournisseurs de modèles à usage général : accès aux modèles, mesures correctives, retrait du marché, amendes jusqu'à 15 M€ ou 3 % du chiffre d'affaires mondial. Compétence exclusive et centralisée, portée extraterritoriale assumée.",
    abstract:
      "Depuis le dimanche 2 août 2026, le Bureau européen de l'IA (AI Office), rattaché à la Commission européenne, dispose de pouvoirs formels d'enquête et de sanction à l'égard des fournisseurs de modèles d'IA à usage général (GPAI), les modèles qui sous-tendent ChatGPT, Claude, Gemini ou Le Chat. Le 2 août 2026 ne crée aucune obligation nouvelle : il transforme des obligations vieilles d'un an en obligations opposables.",
    image: "/images/research/ai-office-enforcement.png",
    publishedAt: "2026-08-05",
    featured: true,
    relatedSlugs: [
      "eu-ai-act-changing-how-law-firms-use-ai",
      "when-ai-makes-legal-filings-easier-but-justice-harder",
      "ai-summaries-rule-1006-admissibility",
    ],
    body: [
      {
        heading: "L'essentiel",
        paragraphs: [
          "Depuis le dimanche 2 août 2026, le Bureau européen de l'IA (AI Office), rattaché à la Commission européenne, dispose de pouvoirs formels d'enquête et de sanction à l'égard des fournisseurs de modèles d'IA à usage général (GPAI), les modèles qui sous-tendent ChatGPT, Claude, Gemini ou Le Chat. La Commission l'a annoncé officiellement dans un communiqué du 31 juillet 2026 : « À partir du 2 août 2026, l'AI Office de la Commission européenne, avec les autorités nationales, commencera à faire appliquer le règlement sur l'IA. »[1]",
          "Concrètement, l'AI Office peut désormais exiger la documentation technique d'un modèle, mener ses propres évaluations (y compris via un accès à l'interface ou au code), ordonner des mesures correctives, restreindre ou retirer un modèle du marché européen, et proposer des amendes pouvant atteindre 15 millions d'euros ou 3 % du chiffre d'affaires annuel mondial, le montant le plus élevé étant retenu.[2]",
        ],
      },
      {
        heading: "Pourquoi maintenant ? Une année d'obligations sans dents",
        paragraphs: [
          "Le règlement (UE) 2024/1689 (l'« AI Act »), entré en vigueur le 1er août 2024, s'applique par étapes. Les obligations de fond des fournisseurs de modèles GPAI (chapitre V, articles 53 à 55 : tenir une documentation technique à jour, informer les développeurs en aval, adopter une politique de respect du droit d'auteur, publier un résumé des contenus d'entraînement, et, pour les modèles à « risque systémique » au-delà de 10²⁵ FLOP d'entraînement, évaluer les modèles, atténuer les risques, notifier les incidents graves et assurer la cybersécurité) s'appliquent depuis le 2 août 2025 en vertu de l'article 113.[4]",
          "Mais pendant un an, ces obligations étaient dépourvues de mécanisme de contrainte : les colégislateurs avaient expressément différé l'article 101 (amendes GPAI) et le chapitre IX (pouvoirs d'enquête, articles 88 à 94) au 2 août 2026. La Commission l'avait elle-même écrit dans ses lignes directrices du 19 novembre 2025 : « Durant la première année à compter du 2 août 2025, la Commission ne peut prendre aucune mesure d'exécution, car ses pouvoirs d'exécution n'entrent en application que le 2 août 2026. » Comme le résume Tech Policy Press : « Bien que ces obligations aient commencé à s'appliquer l'an dernier, la Commission ne peut qu'à présent enquêter, ordonner des mesures correctives et imposer des amendes. »[7]",
          "Les règles n'ont donc pas changé le 2 août 2026 ; c'est le pouvoir de les faire respecter qui est né.",
        ],
      },
      {
        heading: "Quels pouvoirs, exactement ?",
        paragraphs: [
          "Selon la page officielle de la Commission sur le cadre d'enforcement, l'AI Office dispose de deux familles de pouvoirs.[2]",
          "Pouvoirs d'enquête. L'AI Office peut adresser des demandes d'information (RFI) pour vérifier la conformité : soit des RFI « simples », soit des RFI adoptées par décision formelle de la Commission. Répondre de façon inexacte ou trompeuse à une RFI simple est en soi passible d'amende ; ne pas répondre, ou répondre incomplètement, à une RFI par décision l'est aussi. Pour les modèles GPAI, l'AI Office, ou des experts indépendants qu'il désigne, peut exiger l'accès au modèle pour conduire ses propres évaluations (article 92, y compris via l'interface ou le code source), et demander au fournisseur de prendre des mesures allant jusqu'à la restriction de la disponibilité publique du modèle. Pour les systèmes d'IA relevant de sa compétence, il peut aussi mener des auditions et des inspections dans les locaux des fournisseurs.[9]",
          "Pouvoirs de sanction. Si l'AI Office établit une violation intentionnelle ou par négligence, la Commission peut adopter une décision d'amende. Les manquements aux obligations GPAI sont plafonnés à 15 M€ ou 3 % du chiffre d'affaires mondial (article 101). Les pratiques d'IA interdites (article 5 : notation sociale, manipulation, exploitation de vulnérabilités…) relèvent du plafond supérieur de 35 M€ ou 7 % ; la fourniture d'informations inexactes ou trompeuses aux autorités relève d'un plancher de 7,5 M€ ou 1 %.[2]",
          "Point structurel décisif : en vertu de l'article 88, la Commission détient une compétence exclusive et centralisée pour superviser et faire respecter les obligations des fournisseurs de modèles GPAI, exercée via l'AI Office, contrairement au reste de l'AI Act, confié aux autorités nationales de surveillance du marché. Les autorités nationales peuvent demander à la Commission d'agir, mais ne peuvent pas agir elles-mêmes contre les fournisseurs de modèles. L'AI Office est également compétent pour les systèmes d'IA développés par le même fournisseur que le modèle sous-jacent (ou son groupe), et pour les systèmes d'IA intégrés aux très grandes plateformes désignées sous le DSA.[8]",
          "L'AI Office s'appuie en outre sur trois canaux de signalement lancés à cette occasion : un outil de plainte ouvert à toute personne physique ou morale, un outil sécurisé pour lanceurs d'alerte internes, et un canal de plainte réservé aux fournisseurs en aval qui intègrent le modèle GPAI d'un tiers.[1]",
        ],
      },
      {
        heading: "Une portée mondiale assumée",
        paragraphs: [
          "Ces pouvoirs s'appliquent à tout fournisseur mettant un modèle GPAI à disposition dans l'UE, quel que soit son lieu d'établissement. « Une adresse américaine ne place pas un laboratoire hors de portée du régulateur européen », a déclaré à CNBC Elisabetta Righini, associée du cabinet Sidley Austin, qui rappelle que les fournisseurs non européens doivent en outre désigner un représentant autorisé établi dans l'UE (article 54). Elle souligne un point souvent sous-estimé : « La responsabilité GPAI ne se limite pas aux manquements de fond : refuser une demande d'information, donner des réponses trompeuses ou bloquer une évaluation de modèle est sanctionnable en soi. »[5]",
          "Anthropic, OpenAI, Google, Meta, Mistral et xAI sont donc tous dans le périmètre. Le rapporteur du texte au Parlement européen, Brando Benifei, présente l'AI Office comme « la première autorité au monde dotée de véritables pouvoirs d'enquête et d'exécution sur les modèles d'IA avancés ».",
        ],
      },
      {
        heading: "Ce qui s'applique aussi, et ce qui a été reporté",
        paragraphs: [
          "La même date a activé deux autres volets, souvent confondus avec le volet GPAI. D'abord la transparence : l'article 50 devient exécutoire, les chatbots doivent dire qu'ils sont des IA, les deepfakes doivent être étiquetés, et les contenus générés ou modifiés par IA doivent porter un marquage lisible par machine. Seule exception : le marquage machine de l'article 50(2) bénéficie d'un délai au 2 décembre 2026 pour les systèmes déjà sur le marché avant le 2 août 2026.[10] Ensuite, le régime général de sanctions et la pleine compétence des autorités nationales de surveillance du marché s'activent également.",
          "En revanche, le « Digital Omnibus sur l'IA » (règlement (UE) 2026/1744, entré en vigueur le 27 juillet 2026 après un vote du Parlement du 16 juin) a reporté les obligations relatives aux systèmes à haut risque : au 2 décembre 2027 pour les cas d'usage sensibles de l'annexe III (recrutement, crédit, éducation, services essentiels…) et au 2 août 2028 pour l'IA intégrée aux produits réglementés de l'annexe I. Le calendrier GPAI, lui, n'a pas bougé, et c'est un choix délibéré : donner du temps aux utilisateurs de systèmes à haut risque, mais maintenir la pression sur la poignée d'entreprises dont les modèles servent de fondation à tout le reste.[10]",
          "À noter aussi : les modèles mis sur le marché de l'Union avant le 2 août 2025 bénéficient, eux, d'un délai de mise en conformité jusqu'au 2 août 2027 (article 111(3)).[9]",
        ],
      },
      {
        heading: "Le Code de bonnes pratiques devient la ligne de partage",
        paragraphs: [
          "Le Code de bonnes pratiques GPAI, voie volontaire de démonstration de conformité, compte parmi ses signataires Amazon, Anthropic, Google, IBM, Microsoft, Mistral AI et OpenAI, mais pas Meta, tandis que xAI n'a signé que le chapitre sûreté et sécurité. Pour les signataires, la supervision se concentre sur le respect du Code ; les non-signataires devront démontrer une conformité équivalente « par d'autres moyens adéquats », ce qui expose à des demandes d'information plus détaillées. Un second code, sur la transparence des contenus générés par IA, a réuni plus de 180 signataires selon la Commission.[11]",
        ],
      },
      {
        heading: "L'accès aux modèles devient un rapport de force juridique",
        paragraphs: [
          "L'UE a négocié pendant des mois l'accès au modèle avancé Mythos d'Anthropic avant que l'entreprise n'accepte de le partager avec l'agence de cybersécurité ENISA, après un déplacement de hauts fonctionnaires de la Commission à San Francisco ; OpenAI avait auparavant offert un accès à son modèle GPT-5.5-Cyber. Désormais, l'article 92 permet d'exiger cet accès. La Commission est par ailleurs en discussion avec OpenAI et Anthropic à la suite d'incidents de cyberattaques impliquant leurs modèles, selon Reuters.[5]",
        ],
      },
      {
        heading: "Un nouveau front dans les tensions transatlantiques",
        paragraphs: [
          "Ces pouvoirs arrivent quelques semaines après l'amende d'environ 1 milliard de dollars infligée à Google au titre du DMA en juillet 2026, qui avait conduit le président américain Donald Trump à menacer l'UE de droits de douane « substantiels ». L'enforcement de l'AI Act donne à Bruxelles un levier supplémentaire sur les entreprises américaines, et les laboratoires américains se retrouvent face à deux gouvernements exigeant des formes de contrôle pré-déploiement, de part et d'autre de l'Atlantique.[5]",
        ],
      },
      {
        heading: "Pour l'écosystème en aval : une assurance et un risque de dépendance",
        paragraphs: [
          "Les entreprises qui construisent des produits sur le modèle d'un tiers ne portent pas les obligations des articles 53 à 55 (celles-ci pèsent sur le fournisseur du modèle), mais elles y gagnent un droit à l'information (annexe XII) et un canal de plainte officiel. Revers de la médaille : si l'AI Office ordonne la restriction, le retrait ou le rappel d'un modèle (article 93), tous les produits construits dessus sont affectés.[9]",
          "Attention également à la requalification : un fine-tuning dépassant un tiers du compute d'entraînement d'origine, ou la mise sur le marché d'un modèle sous sa propre marque, fait de l'entreprise un fournisseur soumis à la supervision de l'AI Office.",
        ],
      },
      {
        heading: "Un démarrage probablement graduel",
        paragraphs: [
          "Au « jour zéro », aucune amende publique n'avait été prononcée au titre des articles 99 ou 101, et seuls 9 des 27 États membres avaient pleinement désigné leurs autorités nationales compétentes.[11] Un responsable de la Commission a indiqué à Tech Policy Press que l'AI Office entendait maintenir un « dialogue constructif » avec les fournisseurs. Les premières réactions des entreprises vont dans le même sens : OpenAI dit avoir « collaboré étroitement avec la Commission européenne » et vouloir « continuer à travailler ensemble », et Google se dit « déterminé à respecter toutes les règles applicables ».[5]",
        ],
      },
      {
        heading: "Conclusion",
        paragraphs: [
          "Le 2 août 2026 ne crée aucune obligation nouvelle pour les fournisseurs de modèles : il transforme des obligations vieilles d'un an en obligations opposables, adossées à un régulateur central unique, doté d'un droit de regard sur les modèles eux-mêmes et d'amendes indexées sur le chiffre d'affaires mondial.",
          "Comme le formule Tech Policy Press, les premiers mois d'enforcement diront « si l'AI Act devient un cadre de responsabilité effectif ou reste largement un ensemble d'obligations sur le papier ». La question n'est plus de savoir si Bruxelles a le pouvoir d'enquêter et de sanctionner les grands laboratoires d'IA : elle l'a, depuis dimanche. La question est de savoir quand, et contre qui, elle l'utilisera pour la première fois.",
        ],
      },
    ],
    references: [
      {
        label:
          "[1] Commission européenne, communiqué de presse du 31 juillet 2026 (IP/26/1714)",
        href: "https://ec.europa.eu/commission/presscorner/home/en",
        note: "« Commission starts enforcing AI Act rules and new transparency requirements on 2 August ».",
      },
      {
        label:
          "[2] Commission européenne, The enforcement framework of the AI Act",
        href: "https://digital-strategy.ec.europa.eu/en/policies/ai-act-enforcement",
        note: "Pouvoirs d'enquête et de sanction de l'AI Office, plafonds d'amendes.",
      },
      {
        label: "[3] AI Act, calendrier d'application (Shaping Europe's digital future)",
        href: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
      },
      {
        label:
          "[4] Règlement (UE) 2024/1689, EUR-Lex (articles 53-55, 88-94, 99, 101, 111, 113)",
        href: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      },
      {
        label:
          "[5] CNBC, « Anthropic, OpenAI among firms facing new EU AI Act enforcement powers » (3 août 2026)",
      },
      {
        label:
          "[6] Reuters, « EU says necessary to monitor high-risk AI systems… » (31 juillet 2026)",
      },
      {
        label:
          "[7] Tech Policy Press, « Brussels Gains New AI Act Enforcement Powers… » (30 juillet 2026)",
      },
      {
        label:
          "[8] artificialintelligenceact.eu (Future of Life Institute), « Enforcement of Chapter V under the EU AI Act »",
        href: "https://artificialintelligenceact.eu/",
      },
      {
        label: "[9] Bratby Law, « GPAI enforcement: fines begin 2 August 2026 » (1er août 2026)",
      },
      {
        label:
          "[10] Gaming Tech Law (Giulio Coraggio), « EU AI Act 2 August 2026: What Applies and What Was Delayed » (2 août 2026)",
      },
      {
        label:
          "[11] Axis Intelligence, « EU AI Act Enforcement Statistics 2026: Day 0 Compliance Data » (2 août 2026)",
        note: "Décompte des signataires et des autorités nationales désignées, adossé au tracker du Future of Life Institute.",
      },
      {
        label: "Checklist interactive : obligations de transparence (article 50)",
        href: "/eu-ai-act/article-50-checklist",
        note: "Outil gratuit : triage par situation, contrôles par rôle, cas limites. Purement indicatif, pas un conseil juridique.",
      },
    ],
    translations: {
      en: {
        title:
          "The EU AI Office can now investigate AI providers and fine them",
        subtitle:
          "Since 2 August 2026, the Commission finally holds the powers that a year of GPAI obligations lacked. The rules did not change: the power to enforce them came into being.",
        readingTime: "9 min read",
        summary:
          "Since 2 August 2026, the European AI Office holds formal investigation and sanction powers over providers of general-purpose AI models: model access, corrective measures, market withdrawal, and fines up to €15 million or 3% of worldwide turnover. Exclusive centralised competence, with deliberate extraterritorial reach.",
        abstract:
          "Since Sunday 2 August 2026, the European AI Office, part of the European Commission, holds formal powers to investigate and sanction providers of general-purpose AI (GPAI), the models behind ChatGPT, Claude, Gemini and Le Chat. 2 August 2026 creates no new obligation: it turns year-old obligations into enforceable ones.",
        body: [
          {
            heading: "The essentials",
            paragraphs: [
              "Since Sunday 2 August 2026, the European AI Office, part of the European Commission, holds formal powers to investigate and sanction providers of general-purpose AI (GPAI), the models behind ChatGPT, Claude, Gemini and Le Chat. The Commission announced it in a press release of 31 July 2026: “From 2 August 2026, the European Commission's AI Office, together with national authorities, will start enforcing the AI Act.”[1]",
              "In practice, the AI Office can now require a model's technical documentation, run its own evaluations (including through interface or code access), order corrective measures, restrict or withdraw a model from the European market, and propose fines of up to €15 million or 3% of worldwide annual turnover, whichever is higher.[2]",
            ],
          },
          {
            heading: "Why now? A year of obligations without teeth",
            paragraphs: [
              "Regulation (EU) 2024/1689, the AI Act, entered into force on 1 August 2024 and applies in stages. The substantive obligations of GPAI model providers (Chapter V, Articles 53 to 55: maintaining up-to-date technical documentation, informing downstream developers, adopting a copyright policy, publishing a summary of training content, and, for models with systemic risk above 10²⁵ training FLOP, evaluating models, mitigating risks, reporting serious incidents and ensuring cybersecurity) have applied since 2 August 2025 under Article 113.[4]",
              "But for a year those obligations had no enforcement mechanism: the co-legislators had expressly deferred Article 101 (GPAI fines) and Chapter IX (investigation powers, Articles 88 to 94) to 2 August 2026. The Commission wrote as much in its guidelines of 19 November 2025: “During the first year from 2 August 2025, the Commission cannot take any enforcement action, as its enforcement powers only become applicable on 2 August 2026.” As Tech Policy Press puts it: “Although these obligations began to apply last year, only now can the Commission investigate, order corrective measures and impose fines.”[7]",
              "So the rules did not change on 2 August 2026; the power to enforce them came into being.",
            ],
          },
          {
            heading: "Which powers, exactly?",
            paragraphs: [
              "According to the Commission's official page on the enforcement framework, the AI Office holds two families of powers.[2]",
              "Investigation powers. The AI Office can issue requests for information (RFIs) to verify compliance: either “simple” RFIs or RFIs adopted by formal Commission decision. Answering a simple RFI inaccurately or misleadingly is itself finable; failing to answer, or answering incompletely, an RFI by decision is too. For GPAI models, the AI Office, or independent experts it designates, can require access to the model to run its own evaluations (Article 92, including through the interface or source code), and require the provider to take measures up to restricting the model's public availability. For AI systems within its competence, it can also conduct hearings and inspections at providers' premises.[9]",
              "Sanction powers. Where the AI Office establishes an intentional or negligent infringement, the Commission can adopt a fining decision. Breaches of GPAI obligations are capped at €15 million or 3% of worldwide turnover (Article 101). Prohibited AI practices (Article 5: social scoring, manipulation, exploitation of vulnerabilities) fall under the higher ceiling of €35 million or 7%; supplying inaccurate or misleading information to authorities falls under a floor of €7.5 million or 1%.[2]",
              "One decisive structural point: under Article 88, the Commission holds exclusive, centralised competence to supervise and enforce the obligations of GPAI model providers, exercised through the AI Office, unlike the rest of the AI Act, which is entrusted to national market surveillance authorities. National authorities can ask the Commission to act, but cannot act themselves against model providers. The AI Office is also competent for AI systems developed by the same provider as the underlying model (or its group), and for AI systems integrated into very large online platforms designated under the DSA.[8]",
              "The AI Office also relies on three reporting channels launched for the occasion: a complaint tool open to any natural or legal person, a secure tool for internal whistleblowers, and a complaint channel reserved for downstream providers integrating a third party's GPAI model.[1]",
            ],
          },
          {
            heading: "A deliberately global reach",
            paragraphs: [
              "These powers apply to any provider making a GPAI model available in the EU, wherever it is established. “A US address does not put a lab beyond the reach of the European regulator,” Elisabetta Righini, a partner at Sidley Austin, told CNBC, noting that non-EU providers must also designate an authorised representative established in the EU (Article 54). She stresses an often-underestimated point: “GPAI liability is not limited to substantive breaches: refusing a request for information, giving misleading answers or blocking a model evaluation is sanctionable in itself.”[5]",
              "Anthropic, OpenAI, Google, Meta, Mistral and xAI are therefore all within scope. The Parliament's rapporteur on the text, Brando Benifei, presents the AI Office as “the first authority in the world with genuine investigation and enforcement powers over advanced AI models”.",
            ],
          },
          {
            heading: "What else applies, and what was postponed",
            paragraphs: [
              "The same date activated two other strands, often confused with the GPAI one. First, transparency: Article 50 becomes enforceable, chatbots must say they are AI, deepfakes must be labelled, and AI-generated or modified content must carry machine-readable marking. The single exception: the machine marking of Article 50(2) benefits from a transition to 2 December 2026 for systems already on the market before 2 August 2026.[10] Second, the general penalty regime and the full competence of national market surveillance authorities also activate.",
              "By contrast, the “Digital Omnibus on AI” (Regulation (EU) 2026/1744, in force on 27 July 2026 after a Parliament vote of 16 June) postponed the high-risk system obligations: to 2 December 2027 for the sensitive use cases of Annex III (recruitment, credit, education, essential services) and to 2 August 2028 for AI embedded in the regulated products of Annex I. The GPAI timetable did not move, and that is a deliberate choice: give time to users of high-risk systems, but keep the pressure on the handful of companies whose models underpin everything else.[10]",
              "Note also: models placed on the Union market before 2 August 2025 have until 2 August 2027 to comply (Article 111(3)).[9]",
            ],
          },
          {
            heading: "The Code of Practice becomes the dividing line",
            paragraphs: [
              "The GPAI Code of Practice, a voluntary route for demonstrating compliance, counts Amazon, Anthropic, Google, IBM, Microsoft, Mistral AI and OpenAI among its signatories, but not Meta, while xAI signed only the safety and security chapter. For signatories, supervision focuses on adherence to the Code; non-signatories must demonstrate equivalent compliance “by other adequate means”, which exposes them to more detailed information requests. A second code, on transparency of AI-generated content, gathered more than 180 signatories according to the Commission.[11]",
            ],
          },
          {
            heading: "Model access becomes a legal power relationship",
            paragraphs: [
              "The EU negotiated for months over access to Anthropic's advanced Mythos model before the company agreed to share it with the cybersecurity agency ENISA, after senior Commission officials travelled to San Francisco; OpenAI had previously offered access to its GPT-5.5-Cyber model. Article 92 now allows that access to be required. The Commission is moreover in discussions with OpenAI and Anthropic following cyberattack incidents involving their models, according to Reuters.[5]",
            ],
          },
          {
            heading: "A new front in transatlantic tensions",
            paragraphs: [
              "These powers arrive a few weeks after the roughly $1 billion fine imposed on Google under the DMA in July 2026, which led US President Donald Trump to threaten the EU with “substantial” tariffs. AI Act enforcement gives Brussels additional leverage over American companies, and US labs now face two governments demanding forms of pre-deployment control, on either side of the Atlantic.[5]",
            ],
          },
          {
            heading: "For the downstream ecosystem: assurance and dependency risk",
            paragraphs: [
              "Companies building products on a third party's model do not carry the Article 53 to 55 obligations (those sit on the model provider), but they gain a right to information (Annex XII) and an official complaint channel. The flip side: if the AI Office orders the restriction, withdrawal or recall of a model (Article 93), every product built on it is affected.[9]",
              "Watch out for reclassification too: fine-tuning beyond a third of the original training compute, or placing a model on the market under your own brand, makes the company a provider subject to AI Office supervision.",
            ],
          },
          {
            heading: "A likely gradual start",
            paragraphs: [
              "At “day zero”, no public fine had been issued under Articles 99 or 101, and only 9 of the 27 Member States had fully designated their competent national authorities.[11] A Commission official told Tech Policy Press that the AI Office intended to maintain a “constructive dialogue” with providers. Early company reactions point the same way: OpenAI says it has “worked closely with the European Commission” and wants to “keep working together”, and Google says it is “determined to comply with all applicable rules”.[5]",
            ],
          },
          {
            heading: "Conclusion",
            paragraphs: [
              "2 August 2026 creates no new obligation for model providers: it turns year-old obligations into enforceable ones, backed by a single central regulator with a right to look into the models themselves and fines indexed on worldwide turnover.",
              "As Tech Policy Press puts it, the first months of enforcement will tell “whether the AI Act becomes an effective accountability framework or remains largely a set of obligations on paper”. The question is no longer whether Brussels has the power to investigate and sanction the major AI labs: it has, since Sunday. The question is when, and against whom, it will use it for the first time.",
            ],
          },
        ],
      },
      es: {
        title:
          "La Oficina Europea de IA ya puede investigar y sancionar a los proveedores de IA",
        subtitle:
          "Desde el 2 de agosto de 2026, la Comisión dispone por fin de las competencias que le faltaban tras un año de obligaciones GPAI. Las normas no han cambiado: lo que ha nacido es el poder de hacerlas cumplir.",
        readingTime: "9 min de lectura",
        summary:
          "Desde el 2 de agosto de 2026, la Oficina Europea de IA dispone de competencias formales de investigación y sanción sobre los proveedores de modelos de IA de uso general: acceso a los modelos, medidas correctoras, retirada del mercado y multas de hasta 15 millones de euros o el 3 % del volumen de negocios mundial. Competencia exclusiva y centralizada, con alcance extraterritorial asumido.",
        abstract:
          "Desde el domingo 2 de agosto de 2026, la Oficina Europea de IA, dependiente de la Comisión Europea, dispone de competencias formales para investigar y sancionar a los proveedores de modelos de IA de uso general (GPAI), los modelos que sustentan ChatGPT, Claude, Gemini o Le Chat. El 2 de agosto de 2026 no crea ninguna obligación nueva: convierte obligaciones de hace un año en obligaciones exigibles.",
        body: [
          {
            heading: "Lo esencial",
            paragraphs: [
              "Desde el domingo 2 de agosto de 2026, la Oficina Europea de IA, dependiente de la Comisión Europea, dispone de competencias formales para investigar y sancionar a los proveedores de modelos de IA de uso general (GPAI), los modelos que sustentan ChatGPT, Claude, Gemini o Le Chat. La Comisión lo anunció en un comunicado del 31 de julio de 2026: «A partir del 2 de agosto de 2026, la Oficina de IA de la Comisión Europea, junto con las autoridades nacionales, comenzará a aplicar el Reglamento de IA».[1]",
              "En la práctica, la Oficina de IA puede ahora exigir la documentación técnica de un modelo, realizar sus propias evaluaciones (incluido el acceso a la interfaz o al código), ordenar medidas correctoras, restringir o retirar un modelo del mercado europeo y proponer multas de hasta 15 millones de euros o el 3 % del volumen de negocios anual mundial, aplicándose el importe más elevado.[2]",
            ],
          },
          {
            heading: "¿Por qué ahora? Un año de obligaciones sin dientes",
            paragraphs: [
              "El Reglamento (UE) 2024/1689, o «Reglamento de IA», en vigor desde el 1 de agosto de 2024, se aplica por etapas. Las obligaciones sustantivas de los proveedores de modelos GPAI (capítulo V, artículos 53 a 55: mantener documentación técnica actualizada, informar a los desarrolladores posteriores, adoptar una política de respeto de los derechos de autor, publicar un resumen de los contenidos de entrenamiento y, para los modelos con «riesgo sistémico» por encima de 10²⁵ FLOP de entrenamiento, evaluar los modelos, mitigar los riesgos, notificar incidentes graves y garantizar la ciberseguridad) se aplican desde el 2 de agosto de 2025 en virtud del artículo 113.[4]",
              "Pero durante un año esas obligaciones carecieron de mecanismo de coerción: los colegisladores habían aplazado expresamente el artículo 101 (multas GPAI) y el capítulo IX (competencias de investigación, artículos 88 a 94) al 2 de agosto de 2026. La propia Comisión lo escribió en sus directrices del 19 de noviembre de 2025: «Durante el primer año a partir del 2 de agosto de 2025, la Comisión no puede adoptar ninguna medida de ejecución, ya que sus competencias de ejecución solo son aplicables a partir del 2 de agosto de 2026». Como resume Tech Policy Press: «Aunque estas obligaciones empezaron a aplicarse el año pasado, solo ahora puede la Comisión investigar, ordenar medidas correctoras e imponer multas».[7]",
              "Las normas, por tanto, no cambiaron el 2 de agosto de 2026; lo que nació fue el poder de hacerlas cumplir.",
            ],
          },
          {
            heading: "¿Qué competencias, exactamente?",
            paragraphs: [
              "Según la página oficial de la Comisión sobre el marco de ejecución, la Oficina de IA dispone de dos familias de competencias.[2]",
              "Competencias de investigación. La Oficina de IA puede dirigir solicitudes de información (RFI) para verificar el cumplimiento, ya sean RFI «simples» o RFI adoptadas por decisión formal de la Comisión. Responder de forma inexacta o engañosa a una RFI simple es en sí mismo sancionable; no responder, o responder de forma incompleta, a una RFI por decisión también lo es. Para los modelos GPAI, la Oficina de IA, o expertos independientes que designe, puede exigir el acceso al modelo para realizar sus propias evaluaciones (artículo 92, incluido el acceso a la interfaz o al código fuente) y exigir al proveedor medidas que pueden llegar a restringir la disponibilidad pública del modelo. Para los sistemas de IA de su competencia, puede además celebrar audiencias e inspecciones en los locales de los proveedores.[9]",
              "Competencias sancionadoras. Si la Oficina de IA acredita una infracción intencionada o por negligencia, la Comisión puede adoptar una decisión de multa. Los incumplimientos de las obligaciones GPAI están limitados a 15 millones de euros o el 3 % del volumen de negocios mundial (artículo 101). Las prácticas de IA prohibidas (artículo 5: puntuación social, manipulación, explotación de vulnerabilidades) se sitúan en el límite superior de 35 millones de euros o el 7 %; facilitar información inexacta o engañosa a las autoridades corresponde a un umbral de 7,5 millones de euros o el 1 %.[2]",
              "Un punto estructural decisivo: en virtud del artículo 88, la Comisión ostenta una competencia exclusiva y centralizada para supervisar y hacer cumplir las obligaciones de los proveedores de modelos GPAI, ejercida a través de la Oficina de IA, a diferencia del resto del Reglamento, encomendado a las autoridades nacionales de vigilancia del mercado. Las autoridades nacionales pueden pedir a la Comisión que actúe, pero no pueden actuar por sí mismas contra los proveedores de modelos. La Oficina de IA es también competente para los sistemas de IA desarrollados por el mismo proveedor que el modelo subyacente (o su grupo) y para los sistemas de IA integrados en las plataformas en línea de muy gran tamaño designadas conforme al DSA.[8]",
              "La Oficina de IA se apoya además en tres canales de notificación lanzados con este motivo: una herramienta de denuncia abierta a cualquier persona física o jurídica, una herramienta segura para denunciantes internos y un canal de denuncia reservado a los proveedores posteriores que integran el modelo GPAI de un tercero.[1]",
            ],
          },
          {
            heading: "Un alcance mundial asumido",
            paragraphs: [
              "Estas competencias se aplican a todo proveedor que ponga un modelo GPAI a disposición en la UE, con independencia de su lugar de establecimiento. «Una dirección estadounidense no sitúa a un laboratorio fuera del alcance del regulador europeo», declaró a CNBC Elisabetta Righini, socia del despacho Sidley Austin, que recuerda que los proveedores no europeos deben además designar un representante autorizado establecido en la UE (artículo 54). Subraya un punto a menudo subestimado: «La responsabilidad GPAI no se limita a los incumplimientos sustantivos: negarse a una solicitud de información, dar respuestas engañosas o bloquear una evaluación de modelo es sancionable por sí mismo».[5]",
              "Anthropic, OpenAI, Google, Meta, Mistral y xAI están, por tanto, todos dentro del perímetro. El ponente del texto en el Parlamento Europeo, Brando Benifei, presenta la Oficina de IA como «la primera autoridad del mundo dotada de verdaderas competencias de investigación y ejecución sobre los modelos de IA avanzados».",
            ],
          },
          {
            heading: "Qué se aplica también, y qué se ha aplazado",
            paragraphs: [
              "La misma fecha activó otros dos ámbitos, a menudo confundidos con el ámbito GPAI. En primer lugar, la transparencia: el artículo 50 pasa a ser exigible, los chatbots deben indicar que son IA, los deepfakes deben etiquetarse y los contenidos generados o modificados por IA deben llevar un marcado legible por máquina. Única excepción: el marcado automático del artículo 50(2) dispone de un plazo hasta el 2 de diciembre de 2026 para los sistemas ya comercializados antes del 2 de agosto de 2026.[10] En segundo lugar, se activan igualmente el régimen general de sanciones y la plena competencia de las autoridades nacionales de vigilancia del mercado.",
              "En cambio, el «Digital Omnibus sobre IA» (Reglamento (UE) 2026/1744, en vigor el 27 de julio de 2026 tras una votación del Parlamento el 16 de junio) aplazó las obligaciones relativas a los sistemas de alto riesgo: al 2 de diciembre de 2027 para los casos de uso sensibles del anexo III (contratación, crédito, educación, servicios esenciales) y al 2 de agosto de 2028 para la IA integrada en los productos regulados del anexo I. El calendario GPAI, en cambio, no se ha movido, y es una elección deliberada: dar tiempo a los usuarios de sistemas de alto riesgo pero mantener la presión sobre el puñado de empresas cuyos modelos sirven de base a todo lo demás.[10]",
              "Cabe señalar también que los modelos comercializados en la Unión antes del 2 de agosto de 2025 disponen de un plazo de adaptación hasta el 2 de agosto de 2027 (artículo 111(3)).[9]",
            ],
          },
          {
            heading: "El Código de buenas prácticas se convierte en la línea divisoria",
            paragraphs: [
              "El Código de buenas prácticas GPAI, vía voluntaria de demostración del cumplimiento, cuenta entre sus firmantes con Amazon, Anthropic, Google, IBM, Microsoft, Mistral AI y OpenAI, pero no con Meta, mientras que xAI solo firmó el capítulo de seguridad. Para los firmantes, la supervisión se centra en el respeto del Código; los no firmantes deberán demostrar un cumplimiento equivalente «por otros medios adecuados», lo que los expone a solicitudes de información más detalladas. Un segundo código, sobre la transparencia de los contenidos generados por IA, reunió a más de 180 firmantes según la Comisión.[11]",
            ],
          },
          {
            heading: "El acceso a los modelos se vuelve una relación de fuerza jurídica",
            paragraphs: [
              "La UE negoció durante meses el acceso al modelo avanzado Mythos de Anthropic antes de que la empresa aceptara compartirlo con la agencia de ciberseguridad ENISA, tras un desplazamiento de altos funcionarios de la Comisión a San Francisco; OpenAI había ofrecido previamente acceso a su modelo GPT-5.5-Cyber. Ahora, el artículo 92 permite exigir ese acceso. La Comisión mantiene además conversaciones con OpenAI y Anthropic a raíz de incidentes de ciberataques que implican a sus modelos, según Reuters.[5]",
            ],
          },
          {
            heading: "Un nuevo frente en las tensiones transatlánticas",
            paragraphs: [
              "Estas competencias llegan pocas semanas después de la multa de unos 1.000 millones de dólares impuesta a Google en virtud del DMA en julio de 2026, que llevó al presidente estadounidense Donald Trump a amenazar a la UE con aranceles «sustanciales». La ejecución del Reglamento de IA da a Bruselas una palanca adicional sobre las empresas estadounidenses, y los laboratorios estadounidenses se encuentran ante dos gobiernos que exigen formas de control previo al despliegue, a ambos lados del Atlántico.[5]",
            ],
          },
          {
            heading: "Para el ecosistema posterior: una garantía y un riesgo de dependencia",
            paragraphs: [
              "Las empresas que construyen productos sobre el modelo de un tercero no soportan las obligaciones de los artículos 53 a 55 (que recaen sobre el proveedor del modelo), pero ganan un derecho a la información (anexo XII) y un canal de denuncia oficial. La otra cara de la moneda: si la Oficina de IA ordena la restricción, la retirada o la recuperación de un modelo (artículo 93), todos los productos construidos sobre él se ven afectados.[9]",
              "Atención también a la reclasificación: un ajuste fino que supere un tercio del cómputo de entrenamiento original, o la comercialización de un modelo bajo marca propia, convierte a la empresa en proveedor sujeto a la supervisión de la Oficina de IA.",
            ],
          },
          {
            heading: "Un arranque probablemente gradual",
            paragraphs: [
              "En el «día cero» no se había impuesto ninguna multa pública en virtud de los artículos 99 o 101, y solo 9 de los 27 Estados miembros habían designado plenamente sus autoridades nacionales competentes.[11] Un responsable de la Comisión indicó a Tech Policy Press que la Oficina de IA pretendía mantener un «diálogo constructivo» con los proveedores. Las primeras reacciones de las empresas apuntan en el mismo sentido: OpenAI afirma haber «colaborado estrechamente con la Comisión Europea» y querer «seguir trabajando juntos», y Google se declara «decidido a cumplir todas las normas aplicables».[5]",
            ],
          },
          {
            heading: "Conclusión",
            paragraphs: [
              "El 2 de agosto de 2026 no crea ninguna obligación nueva para los proveedores de modelos: convierte obligaciones de hace un año en obligaciones exigibles, respaldadas por un regulador central único, dotado de un derecho de examen sobre los propios modelos y de multas indexadas al volumen de negocios mundial.",
              "Como lo formula Tech Policy Press, los primeros meses de ejecución dirán «si el Reglamento de IA se convierte en un marco de responsabilidad efectivo o sigue siendo en gran medida un conjunto de obligaciones sobre el papel». La cuestión ya no es si Bruselas tiene el poder de investigar y sancionar a los grandes laboratorios de IA: lo tiene, desde el domingo. La cuestión es cuándo, y contra quién, lo utilizará por primera vez.",
            ],
          },
        ],
      },
    },
  },
  {
    slug: "eu-ai-act-changing-how-law-firms-use-ai",
    title: "The EU AI Act is changing how law firms use artificial intelligence",
    subtitle:
      "Article 50 applies from 2 August 2026. It does not ban AI in legal practice, and it does not require a label on every AI-assisted document — but it does create targeted duties that most firms have not yet mapped.",
    author,
    status: "published",
    category: "EU AI Law",
    tags: [
      "EU AI Act",
      "Article 50",
      "Law firms",
      "Transparency obligations",
      "Professional responsibility",
      "Confidentiality",
    ],
    jurisdiction: "European Union",
    readingTime: "13 min read",
    summary:
      "From 2 August 2026, Article 50 of the EU AI Act creates transparency duties for direct AI interactions, synthetic content, deepfakes and certain public-interest publications. A practical guide for law firms: provider or deployer, chatbot notices, the human-review exception, confidentiality, AI literacy, and what a proportionate compliance programme looks like.",
    abstract:
      "From 2 August 2026, law firms operating in or connected to the European Union must pay closer attention to how they use artificial intelligence. Article 50 of the EU Artificial Intelligence Act introduces new transparency obligations for systems that interact directly with individuals, generate synthetic content, use emotion recognition or biometric categorisation, or produce deepfakes and certain publications intended to inform the public.",
    image: "/images/research/law-firms-ai-act-article-50.png",
    publishedAt: "2026-08-03",
    relatedSlugs: [
      "when-ai-makes-legal-filings-easier-but-justice-harder",
      "ai-summaries-rule-1006-admissibility",
      "white-collar-revolution-law-firms-ai",
    ],
    translations: {
      fr: {
        title:
          "Le règlement IA change la façon dont les cabinets d'avocats utilisent l'intelligence artificielle",
        subtitle:
          "L'article 50 s'applique depuis le 2 août 2026. Il n'interdit pas l'IA dans la pratique du droit, et n'impose pas une mention sur chaque document assisté par IA, mais il crée des obligations ciblées que la plupart des cabinets n'ont pas encore cartographiées.",
        readingTime: "13 min de lecture",
        summary:
          "Depuis le 2 août 2026, l'article 50 du règlement IA crée des obligations de transparence pour les interactions directes avec l'IA, les contenus synthétiques, les hypertrucages et certaines publications d'intérêt public. Guide pratique pour les cabinets : fournisseur ou déployeur, mentions pour les agents conversationnels, exception de relecture humaine, confidentialité, culture de l'IA, et à quoi ressemble un programme de conformité proportionné.",
        abstract:
          "Depuis le 2 août 2026, les cabinets d'avocats établis dans l'Union européenne ou en lien avec elle doivent prêter une attention accrue à leur usage de l'intelligence artificielle. L'article 50 du règlement européen sur l'intelligence artificielle introduit de nouvelles obligations de transparence pour les systèmes qui interagissent directement avec des personnes, génèrent des contenus synthétiques, recourent à la reconnaissance des émotions ou à la catégorisation biométrique, ou produisent des hypertrucages et certaines publications destinées à informer le public.",
        body: [
          {
            heading: "Ce que l'article 50 exige réellement",
            paragraphs: [
              "Depuis le 2 août 2026, les cabinets d'avocats établis dans l'Union européenne ou en lien avec elle doivent prêter une attention accrue à leur usage de l'intelligence artificielle. L'article 50 du règlement européen sur l'intelligence artificielle introduit de nouvelles obligations de transparence pour les systèmes qui interagissent directement avec des personnes, génèrent des contenus synthétiques, recourent à la reconnaissance des émotions ou à la catégorisation biométrique, ou produisent des hypertrucages et certaines publications destinées à informer le public.[2]",
              "Ces règles ne signifient pas que les avocats doivent divulguer chaque usage de l'intelligence artificielle. Un contrat, une note juridique, un courriel ou une écriture judiciaire n'ont pas automatiquement besoin d'une mention « IA » du seul fait qu'un outil d'IA a aidé à préparer un premier jet. Les obligations dépendent du type de système, du rôle joué par le cabinet et de la manière dont le contenu obtenu est présenté aux clients ou au public.",
            ],
          },
          {
            heading: "Fournisseur ou déployeur : la première question",
            paragraphs: [
              "Pour la plupart des cabinets, le point de départ consiste à déterminer si le cabinet agit comme fournisseur ou comme déployeur d'un système d'IA.",
              "Un cabinet est ordinairement déployeur lorsqu'il utilise un produit développé et fourni par un tiers. Ce sera généralement le cas lorsqu'il s'abonne à un assistant de recherche juridique existant, à une plateforme de revue documentaire, à un outil de traduction ou à un service d'IA générative.",
              "La situation change lorsque le cabinet développe son propre système, en commande le développement à une autre société, modifie substantiellement un système existant ou présente sous sa propre marque un système en marque blanche. Dans ces cas, le cabinet peut devenir fournisseur. Un cabinet qui développe et exploite son propre agent conversationnel juridique destiné aux clients peut être à la fois fournisseur et déployeur, puisqu'il met le système en service sous son nom et contrôle son utilisation.",
              "Les avocats exerçant au sein d'un cabinet ne seront normalement pas traités comme des déployeurs distincts lorsqu'ils utilisent l'IA sous l'autorité et les instructions du cabinet. C'est l'entité juridique qui exerce le contrôle sur le système qui est en principe le déployeur. Un avocat exerçant seul, qui sélectionne et exploite lui-même un système d'IA, peut toutefois relever personnellement de cette définition.",
              "Cette distinction ne supprime pas les responsabilités professionnelles de l'avocat pris individuellement. Quelle que soit la qualification du cabinet au regard du règlement, les avocats restent responsables de la confidentialité, de la compétence, de l'indépendance, de l'exactitude des faits et de leur comportement envers les clients et les juridictions.",
            ],
          },
          {
            heading: "Agents conversationnels et systèmes de prise de contact",
            paragraphs: [
              "L'un des changements les plus visibles concerne les agents conversationnels destinés aux clients, les assistants vocaux et les systèmes automatisés de prise de contact. Lorsqu'une personne interagit directement avec un système d'IA, le fournisseur doit normalement veiller à ce qu'elle soit informée qu'elle communique avec une intelligence artificielle.",
              "L'information doit apparaître au début de l'interaction. La dissimuler dans des conditions générales, une politique de confidentialité ou une documentation technique a peu de chances de suffire. La mention doit en outre être claire, distinguable et accessible.",
              "Un agent conversationnel de cabinet pourrait donc commencer en indiquant que l'utilisateur interagit avec un assistant d'intelligence artificielle exploité pour le compte du cabinet. Le cabinet peut ensuite ajouter que l'assistant fournit des informations générales, ne crée pas de relation avocat-client, ne doit pas recevoir d'informations confidentielles et peut produire des réponses incomplètes ou inexactes.",
              "Ces avertissements supplémentaires ne découlent pas directement de l'article 50, mais ils aident à traiter les risques de responsabilité professionnelle, de confidentialité et de protection des consommateurs. Un prestataire tiers peut rester juridiquement responsable de mettre en œuvre la mention d'interaction avec l'IA, mais le cabinet devrait néanmoins tester le système et s'assurer que sa personnalisation n'a pas supprimé ni masqué cette mention.",
            ],
          },
          {
            heading: "Contenus synthétiques et marquage lisible par machine",
            paragraphs: [
              "L'article 50 encadre aussi les contenus audio, images, vidéos et textes synthétiques. Les fournisseurs de systèmes qui génèrent ou manipulent ce type de contenu peuvent être tenus d'y intégrer des marquages lisibles par machine permettant de détecter que le contenu a été généré ou modifié artificiellement.",
              "Cette obligation technique pèse généralement sur le fournisseur du système de contenu synthétique, et non sur chaque avocat qui utilise un outil d'IA générative. Un cabinet utilisant un générateur de texte tiers ne sera normalement pas censé concevoir son propre système de filigrane. L'analyse peut différer lorsque le cabinet développe, modifie substantiellement ou distribue le système sous sa propre marque.",
              "Les règles prévoient une exception pour les outils d'édition standard qui ne changent pas substantiellement le sens du contenu d'origine. Correction grammaticale, vérification orthographique, mise en forme et améliorations stylistiques mineures peuvent relever de cette exception. Une réécriture substantielle, une restructuration ou des changements de fond, de ton ou de message exigent une appréciation plus attentive.",
            ],
          },
          {
            heading: "Les hypertrucages dans la communication du cabinet",
            paragraphs: [
              "Les hypertrucages font l'objet d'une obligation distincte. Un cabinet qui publie des contenus audio, images ou vidéos réalistes, générés ou manipulés par IA, donnant faussement l'apparence de représenter une personne, un objet, un lieu ou un événement réel, doit fournir une information claire.",
              "On peut citer la voix clonée d'un associé utilisée en publicité, un avatar numérique réaliste présenté comme un véritable avocat, ou une reconstitution par IA d'un accident ou d'une opération susceptible d'être prise pour des images authentiques. L'information doit être visible ou audible dès la première présentation du contenu. Des métadonnées cachées ou un filigrane invisible du fournisseur ne satisferont pas l'obligation d'information qui pèse sur le déployeur.",
              "Le contexte reste déterminant. Une animation manifestement fictive ou stylisée peut ne pas correspondre à la définition de l'hypertrucage. Les œuvres artistiques, satiriques et de fiction relèvent d'un standard d'information plus souple, sans être pour autant totalement exemptées.",
            ],
          },
          {
            heading: "Publications d'intérêt public et exception de relecture humaine",
            paragraphs: [
              "Une autre règle importante concerne les textes générés ou substantiellement manipulés par IA et publiés dans le but d'informer le public sur une question d'intérêt public. Cette catégorie peut inclure des actualités juridiques, des analyses réglementaires, des comptes rendus de décisions, des commentaires de droit électoral, des articles de politique publique et des communications relatives à la protection des consommateurs ou aux droits fondamentaux.",
              "L'article 50 prévoit toutefois une exception importante lorsque la publication a fait l'objet d'une véritable relecture humaine et qu'une personne physique ou morale en assume la responsabilité éditoriale.",
              "Pour les cabinets, cette exception deviendra vraisemblablement la voie principale de conformité pour les publications juridiques assistées par IA. L'avocat relecteur doit faire davantage qu'approuver rapidement le texte ou en corriger la grammaire. Il devrait en examiner le fond, vérifier les faits et les sources juridiques, apprécier la fiabilité des références et disposer du pouvoir de modifier ou de refuser la publication.",
              "Un second outil d'IA ne peut pas remplacer cette relecture humaine. De même, si des modifications substantielles générées par IA interviennent après l'approbation de l'avocat, la version révisée devrait être relue à nouveau.",
            ],
          },
          {
            heading: "Écritures judiciaires et devoirs de vérification",
            paragraphs: [
              "Une écriture judiciaire ordinaire ne relèvera pas automatiquement de la règle sur les publications d'intérêt public du seul fait qu'elle devient ensuite accessible via un registre public. La finalité de la publication reste pertinente. Le document doit être publié avec l'intention d'informer le public sur une question d'intérêt public. Les règles de procédure nationales et les décisions de justice peuvent néanmoins créer des obligations d'information distinctes.",
              "Le règlement ne crée pas non plus d'obligation générale d'indiquer à une juridiction ou à la partie adverse que l'intelligence artificielle a été utilisée pour la recherche ou la rédaction. Les avocats doivent examiner les règles applicables devant la juridiction concernée. Certaines peuvent exiger des attestations, des déclarations ou des restrictions quant à l'usage de l'IA.",
              "Même en l'absence d'obligation d'information, l'avocat doit vérifier personnellement chaque affirmation de fait, chaque source juridique, chaque citation et chaque affirmation procédurale soumise à la juridiction. Le résultat produit par une intelligence artificielle doit être traité comme un matériau non vérifié tant qu'il n'a pas été confronté à des sources faisant autorité et au dossier de la procédure.",
              "Des décisions fabriquées et des citations inexactes peuvent exposer les avocats à des poursuites disciplinaires, à des condamnations pour outrage, à des actions en responsabilité professionnelle et à une atteinte sérieuse à leur réputation. Le fait que l'erreur provienne d'un système d'IA ne transfère pas la responsabilité loin de l'avocat qui s'y est fié.",
            ],
          },
          {
            heading: "Confidentialité, prestataires et conflits d'intérêts",
            paragraphs: [
              "La confidentialité est une autre préoccupation centrale. Le risque principal naît souvent avant même que le système produise un résultat, au moment où l'avocat saisit les informations d'un client dans le système.",
              "Instructions, écritures, contrats, correspondance, enregistrements et ensembles documentaires peuvent être conservés, consultés par le personnel du prestataire, partagés avec des sous-traitants ou utilisés pour améliorer un modèle. Les cabinets doivent donc comprendre comment un fournisseur traite l'information avant d'autoriser le téléversement de documents confidentiels ou couverts par le secret professionnel.",
              "Cette préoccupation ne se limite pas aux agents conversationnels évidents. L'intelligence artificielle s'intègre de plus en plus aux plateformes de messagerie, aux logiciels PDF, aux services de transcription, aux outils de traduction, aux navigateurs, aux systèmes de gestion documentaire et aux applications de productivité. Certaines fonctions peuvent s'activer automatiquement sans que l'avocat réalise que des informations sont traitées par un système d'IA.",
              "Les cabinets devraient tenir une liste d'outils approuvés, utiliser des comptes entreprise lorsque c'est possible et interdire la saisie d'informations confidentielles dans des systèmes publics non approuvés. Les contrats avec les prestataires devraient traiter la conservation des données, l'entraînement des modèles, la sécurité, les sous-traitants, la suppression, les droits d'audit et la notification des incidents. Des restrictions d'accès par dossier, le chiffrement et l'anonymisation peuvent également s'imposer.",
              "L'usage de l'IA peut créer des conflits d'intérêts lorsque des informations relatives à différents clients sont placées dans des espaces de travail partagés, des systèmes de recherche ou des jeux de données d'entraînement. Les cabinets devraient s'assurer que les informations confidentielles ne peuvent pas être retrouvées d'un dossier à l'autre et que l'accès est limité conformément aux murailles de Chine et aux autorisations par dossier.",
            ],
          },
          {
            heading: "Information, et non consentement, en principe",
            paragraphs: [
              "L'article 50 exige en principe une information plutôt qu'un consentement. Il n'impose pas de règle universelle obligeant chaque client à approuver chaque usage de l'intelligence artificielle. Un consentement peut néanmoins être nécessaire au titre des règles déontologiques, du droit de la protection des données, des conventions d'honoraires, des directives de conseil externe, ou en raison de la sensibilité d'un dossier particulier.",
              "Les cabinets devraient envisager de donner une information générale sur un usage encadré de l'IA dans leurs lettres de mission ou leurs mentions de confidentialité. Une approbation plus spécifique du client peut être appropriée lorsque des documents identifiables ou confidentiels seront traités, lorsque les éléments du client pourraient servir à l'entraînement ou à l'affinage d'un modèle, ou lorsqu'un système automatisé fournit des indications juridiques directement aux clients.",
            ],
          },
          {
            heading: "La culture de l'IA comme obligation d'organisation",
            paragraphs: [
              "La maîtrise de l'intelligence artificielle constitue également une obligation d'organisation. Les fournisseurs et les déployeurs doivent prendre des mesures pour garantir que les avocats, les collaborateurs et les prestataires qui utilisent l'IA pour leur compte disposent d'une compréhension appropriée de la technologie.",
              "La formation doit refléter le rôle de la personne et les risques du système. Les avocats peuvent avoir besoin d'une formation sur les hallucinations, la vérification des sources, la confidentialité et l'indépendance professionnelle. Les équipes de ressources humaines peuvent avoir besoin d'orientations sur les outils biométriques et la discrimination à l'embauche. Les équipes marketing devraient comprendre les règles applicables aux hypertrucages et aux publications d'intérêt public. Les fonctions achats et technologies devraient comprendre la qualification de fournisseur, les flux de données et les obligations des prestataires.",
            ],
          },
          {
            heading: "Un programme de conformité proportionné",
            paragraphs: [
              "Le règlement n'impose pas à chaque cabinet de bâtir un département de conformité étoffé. Une petite structure peut mettre en place un programme proportionné composé d'un associé responsable, d'une liste d'outils approuvés, d'une formation de base, d'une mention pour l'agent conversationnel lorsque c'est nécessaire, d'un processus de relecture des publications et d'une procédure écrite de réponse aux incidents.[1]",
              "Les cabinets plus grands peuvent avoir besoin de structures de gouvernance plus complexes, incluant des registres centraux d'IA, des évaluations de rôle par juridiction, des tests techniques, le cloisonnement des dossiers, le suivi des prestataires et une relecture formelle des communications publiques.",
            ],
          },
          {
            heading: "Se préparer aux incidents liés à l'IA",
            paragraphs: [
              "Les cabinets devraient aussi se préparer aux incidents impliquant l'intelligence artificielle. Il peut s'agir de la divulgation d'informations confidentielles, d'une source fabriquée dans une écriture, d'un hypertrucage non étiqueté, d'un défaut d'affichage de la mention d'un agent conversationnel, de la perte de données de provenance ou de la publication de contenus générés par IA sans relecture humaine appropriée.",
              "Lorsqu'un incident survient, le cabinet devrait arrêter ou isoler le système concerné, préserver les éléments de preuve pertinents, identifier les clients ou dossiers touchés et apprécier si une notification s'impose. L'analyse peut mobiliser les règles déontologiques, les devoirs envers les juridictions, les polices d'assurance, les obligations contractuelles et le règlement général sur la protection des données.",
            ],
          },
          {
            heading: "Sanctions et calendrier",
            paragraphs: [
              "Le non-respect de l'article 50 peut entraîner des amendes administratives pouvant atteindre 15 millions d'euros ou 3 % du chiffre d'affaires annuel mondial de l'organisation pour l'exercice précédent. Les cabinets de petite et moyenne taille peuvent bénéficier de plafonds plus favorables, sans être exemptés des obligations de transparence.[4]",
              "Les principales obligations de transparence de l'article 50 s'appliquent depuis le 2 août 2026. Il n'existe pas de délai de grâce général pour les mentions relatives aux agents conversationnels, l'étiquetage des hypertrucages, les textes d'intérêt public ou les informations relatives à la reconnaissance des émotions et à la catégorisation biométrique. Une transition limitée jusqu'au 2 décembre 2026 s'applique uniquement à certains fournisseurs de systèmes de contenus synthétiques déjà mis sur le marché avant le 2 août 2026.[3]",
            ],
          },
          {
            heading: "Ce que cela signifie en pratique",
            paragraphs: [
              "La conséquence pratique pour la profession n'est pas que l'intelligence artificielle devient interdite. Ni que chaque document juridique assisté par IA doit porter un avertissement. Les cabinets doivent plutôt comprendre les systèmes qu'ils utilisent, déterminer leur rôle juridique, protéger les informations confidentielles, mettre en place les informations requises et assurer une supervision humaine effective.[1]",
              "L'article 50 s'applique depuis le 2 août 2026 et crée des obligations ciblées pour les interactions directes avec l'IA, les contenus synthétiques, les hypertrucages et certaines publications d'intérêt public. Pour la plupart des cabinets, toutefois, les principes décisifs resteront familiers : le jugement professionnel, la vérification attentive, la protection des informations du client et la responsabilité individuelle quant à la qualité et à l'intégrité du travail juridique.",
            ],
          },
        ],
      },
      es: {
        title:
          "El Reglamento de IA está cambiando cómo los despachos de abogados usan la inteligencia artificial",
        subtitle:
          "El artículo 50 se aplica desde el 2 de agosto de 2026. No prohíbe la IA en el ejercicio del derecho ni exige una advertencia en cada documento asistido por IA, pero crea obligaciones concretas que la mayoría de los despachos aún no ha cartografiado.",
        readingTime: "13 min de lectura",
        summary:
          "Desde el 2 de agosto de 2026, el artículo 50 del Reglamento de IA crea obligaciones de transparencia para las interacciones directas con IA, los contenidos sintéticos, los deepfakes y ciertas publicaciones de interés público. Guía práctica para despachos: proveedor o responsable del despliegue, avisos en chatbots, excepción de revisión humana, confidencialidad, alfabetización en IA y cómo es un programa de cumplimiento proporcionado.",
        abstract:
          "Desde el 2 de agosto de 2026, los despachos de abogados establecidos en la Unión Europea o vinculados a ella deben prestar mayor atención a cómo usan la inteligencia artificial. El artículo 50 del Reglamento europeo de inteligencia artificial introduce nuevas obligaciones de transparencia para los sistemas que interactúan directamente con personas, generan contenidos sintéticos, emplean reconocimiento de emociones o categorización biométrica, o producen deepfakes y ciertas publicaciones destinadas a informar al público.",
        body: [
          {
            heading: "Qué exige realmente el artículo 50",
            paragraphs: [
              "Desde el 2 de agosto de 2026, los despachos de abogados establecidos en la Unión Europea o vinculados a ella deben prestar mayor atención a cómo usan la inteligencia artificial. El artículo 50 del Reglamento europeo de inteligencia artificial introduce nuevas obligaciones de transparencia para los sistemas que interactúan directamente con personas, generan contenidos sintéticos, emplean reconocimiento de emociones o categorización biométrica, o producen deepfakes y ciertas publicaciones destinadas a informar al público.[2]",
              "Estas normas no significan que los abogados deban divulgar cada uso de la inteligencia artificial. Un contrato, un dictamen, un correo o un escrito judicial no necesitan automáticamente una etiqueta de IA solo porque una herramienta de IA ayudara a preparar un primer borrador. Las obligaciones dependen del tipo de sistema, del papel del despacho y de cómo se presenta el contenido resultante a los clientes o al público.",
            ],
          },
          {
            heading: "Proveedor o responsable del despliegue: la primera pregunta",
            paragraphs: [
              "Para la mayoría de los despachos, el punto de partida es determinar si actúan como proveedor o como responsable del despliegue de un sistema de IA.",
              "Un despacho es normalmente responsable del despliegue cuando usa un producto desarrollado y suministrado por un tercero. Suele ser el caso cuando se suscribe a un asistente de investigación jurídica existente, a una plataforma de revisión documental, a una herramienta de traducción o a un servicio de IA generativa.",
              "La situación cambia cuando el despacho desarrolla su propio sistema, encarga su desarrollo a otra empresa, modifica sustancialmente un sistema existente o presenta bajo su propia marca un sistema de marca blanca. En esos casos, el despacho puede convertirse en proveedor. Un despacho que desarrolla y opera su propio chatbot jurídico dirigido a clientes puede ser a la vez proveedor y responsable del despliegue, ya que pone el sistema en servicio bajo su nombre y controla su uso.",
              "Los abogados que trabajan dentro de un despacho no serán normalmente tratados como responsables del despliegue independientes cuando usen IA bajo la autoridad e instrucciones del despacho. La entidad jurídica que ejerce el control sobre el sistema es en principio la responsable. Un abogado que ejerce por cuenta propia y que selecciona y opera él mismo un sistema de IA sí puede quedar incluido personalmente en esa definición.",
              "Esta distinción no elimina las responsabilidades profesionales del abogado individual. Con independencia de cómo se califique al despacho conforme al Reglamento, los abogados siguen siendo responsables de la confidencialidad, la competencia, la independencia, la exactitud de los hechos y su conducta ante clientes y tribunales.",
            ],
          },
          {
            heading: "Chatbots y sistemas de admisión de clientes",
            paragraphs: [
              "Uno de los cambios más visibles afecta a los chatbots dirigidos a clientes, los asistentes de voz y los sistemas automatizados de admisión. Cuando una persona interactúa directamente con un sistema de IA, el proveedor debe normalmente garantizar que se le informe de que está comunicándose con inteligencia artificial.",
              "La información debe aparecer al inicio de la interacción. Ocultarla en condiciones generales, en una política de privacidad o en documentación técnica difícilmente bastará. El aviso debe además ser claro, distinguible y accesible.",
              "Un chatbot de despacho podría por tanto comenzar indicando que el usuario interactúa con un asistente de inteligencia artificial operado para el despacho. El despacho puede añadir después que el asistente ofrece información general, no crea una relación abogado-cliente, no debe recibir información confidencial y puede producir respuestas incompletas o inexactas.",
              "Estas advertencias adicionales no derivan directamente del artículo 50, pero ayudan a abordar riesgos de responsabilidad profesional, confidencialidad y protección del consumidor. Un proveedor externo puede seguir siendo jurídicamente responsable de implantar el aviso de interacción con IA, pero el despacho debería aun así probar el sistema y asegurarse de que su personalización no ha eliminado ni oscurecido ese aviso.",
            ],
          },
          {
            heading: "Contenido sintético y marcado legible por máquina",
            paragraphs: [
              "El artículo 50 regula también el audio, las imágenes, el vídeo y el texto sintéticos. Los proveedores de sistemas que generan o manipulan este tipo de contenido pueden estar obligados a incorporar marcas legibles por máquina que permitan detectar que el contenido ha sido generado o modificado artificialmente.",
              "Esta obligación técnica recae en general sobre el proveedor del sistema de contenido sintético, no sobre cada abogado que usa una herramienta de IA generativa. De un despacho que utiliza un generador de texto de terceros no se esperará normalmente que diseñe su propio sistema de marca de agua. El análisis puede ser distinto cuando el despacho desarrolla, modifica sustancialmente o distribuye el sistema bajo su propia marca.",
              "Las normas contienen una excepción para las herramientas de edición estándar que no cambian sustancialmente el significado del contenido original. Corrección gramatical, revisión ortográfica, formato y mejoras estilísticas menores pueden ampararse en esa excepción. Una reescritura material, una reestructuración o cambios en el fondo, el tono o el mensaje exigen una valoración más cuidadosa.",
            ],
          },
          {
            heading: "Deepfakes en la comunicación del despacho",
            paragraphs: [
              "Los deepfakes están sujetos a una obligación separada. Un despacho que publique audio, imágenes o vídeo realistas generados o manipulados por IA que aparenten falsamente representar a una persona, objeto, lugar o hecho real debe facilitar una información clara.",
              "Ejemplos posibles: la voz clonada de un socio usada en publicidad, un avatar digital realista presentado como un abogado real, o una reconstrucción por IA de un accidente o una operación que pudiera confundirse con imágenes auténticas. La información debe ser visible o audible en la primera exposición al contenido. Metadatos ocultos o una marca de agua invisible del proveedor no satisfarán la obligación de informar que pesa sobre el responsable del despliegue.",
              "El contexto sigue importando. Una animación manifiestamente ficticia o estilizada puede no encajar en la definición de deepfake. Las obras artísticas, satíricas y de ficción están sujetas a un estándar de información más flexible, pero no quedan completamente exentas.",
            ],
          },
          {
            heading: "Publicaciones de interés público y la excepción de revisión humana",
            paragraphs: [
              "Otra regla importante afecta al texto generado o materialmente manipulado por IA y publicado con el fin de informar al público sobre un asunto de interés público. Esta categoría puede incluir actualizaciones jurídicas, análisis regulatorios, crónicas de resoluciones, comentarios de derecho electoral, artículos de política pública y comunicaciones sobre protección del consumidor o derechos fundamentales.",
              "El artículo 50 prevé, no obstante, una excepción importante cuando la publicación ha pasado por una revisión humana genuina y una persona física o jurídica asume la responsabilidad editorial.",
              "Para los despachos, esta excepción será probablemente la vía principal de cumplimiento en las publicaciones jurídicas asistidas por IA. El abogado revisor debe hacer algo más que aprobar el texto rápidamente o corregir su gramática. Debería examinar el fondo, verificar los hechos y las fuentes jurídicas, valorar la fiabilidad de las referencias y tener autoridad para modificar o rechazar la publicación.",
              "Una segunda herramienta de IA no puede sustituir esa revisión humana. Del mismo modo, si tras la aprobación del abogado se introducen cambios sustanciales generados por IA, la versión revisada debería volver a revisarse.",
            ],
          },
          {
            heading: "Escritos judiciales y deberes de verificación",
            paragraphs: [
              "Un escrito judicial ordinario no quedará automáticamente incluido en la regla de las publicaciones de interés público por el mero hecho de resultar después accesible a través de un registro público. La finalidad de la publicación sigue siendo relevante. El documento debe publicarse con la intención de informar al público sobre un asunto de interés público. Las normas procesales nacionales y las resoluciones judiciales pueden, no obstante, crear obligaciones de información distintas.",
              "El Reglamento tampoco crea una obligación general de comunicar a un tribunal o a la parte contraria que se usó inteligencia artificial para la investigación o la redacción. Los abogados deben examinar las normas aplicables ante el tribunal concreto. Algunos pueden exigir certificaciones, declaraciones o restricciones sobre el uso de IA.",
              "Incluso cuando no se exija información, el abogado debe verificar personalmente cada afirmación fáctica, cada fuente jurídica, cada cita y cada manifestación procesal presentada al tribunal. El resultado de la inteligencia artificial debe tratarse como material no verificado hasta contrastarlo con fuentes autorizadas y con el expediente probatorio.",
              "Casos fabricados y citas inexactas pueden exponer a los abogados a expedientes disciplinarios, declaraciones de desacato, reclamaciones por negligencia profesional y un daño reputacional grave. Que el error se originara en un sistema de IA no traslada la responsabilidad lejos del abogado que confió en él.",
            ],
          },
          {
            heading: "Confidencialidad, proveedores y conflictos",
            paragraphs: [
              "La confidencialidad es otra preocupación central. El riesgo principal surge a menudo antes de que el sistema genere resultado alguno, cuando el abogado introduce la información de un cliente en el sistema.",
              "Instrucciones, escritos, contratos, correspondencia, grabaciones y colecciones documentales pueden conservarse, ser consultados por personal del proveedor, compartirse con subencargados o usarse para mejorar un modelo. Los despachos deberían por tanto entender cómo trata la información un proveedor antes de permitir que se suba material confidencial o amparado por el secreto profesional.",
              "Esta preocupación no se limita a los chatbots evidentes. La inteligencia artificial se integra cada vez más en plataformas de correo, software PDF, servicios de transcripción, herramientas de traducción, navegadores, sistemas de gestión documental y aplicaciones de productividad. Algunas funciones pueden activarse automáticamente sin que el abogado advierta que un sistema de IA está tratando información.",
              "Los despachos deberían mantener una lista de herramientas aprobadas, usar cuentas empresariales cuando sea posible y prohibir la introducción de información confidencial en sistemas públicos no aprobados. Los contratos con proveedores deberían abordar la conservación de datos, el entrenamiento de modelos, la seguridad, los subencargados, la supresión, los derechos de auditoría y la notificación de incidentes. Restricciones de acceso por asunto, cifrado y anonimización también pueden ser necesarios.",
              "El uso de IA puede generar conflictos de intereses cuando información de distintos clientes se coloca en espacios de trabajo compartidos, sistemas de recuperación o conjuntos de entrenamiento. Los despachos deberían asegurar que la información confidencial no pueda recuperarse entre asuntos y que el acceso esté limitado conforme a las murallas éticas y a los permisos por expediente.",
            ],
          },
          {
            heading: "Información, no consentimiento, por regla general",
            paragraphs: [
              "El artículo 50 exige por regla general información más que consentimiento. No impone una norma universal que obligue a cada cliente a aprobar cada uso de inteligencia artificial. El consentimiento puede seguir siendo necesario conforme a las normas deontológicas, al derecho de protección de datos, a las hojas de encargo, a las directrices de asesoramiento externo o por la sensibilidad de un asunto concreto.",
              "Los despachos deberían valorar ofrecer información general sobre un uso controlado de la IA en sus hojas de encargo o avisos de privacidad. Una aprobación más específica del cliente puede ser adecuada cuando vayan a tratarse documentos identificables o confidenciales, cuando el material del cliente pueda usarse para entrenamiento o ajuste fino, o cuando un sistema automatizado ofrezca orientación jurídica directamente a los clientes.",
            ],
          },
          {
            heading: "La alfabetización en IA como obligación organizativa",
            paragraphs: [
              "La alfabetización en inteligencia artificial es además una obligación organizativa. Proveedores y responsables del despliegue deben adoptar medidas para garantizar que los abogados, empleados y colaboradores que usan IA por su cuenta posean una comprensión adecuada de la tecnología.",
              "La formación debe reflejar el papel de cada persona y los riesgos del sistema. Los abogados pueden necesitar formación sobre alucinaciones, verificación de fuentes, confidencialidad e independencia profesional. Los equipos de recursos humanos pueden necesitar orientación sobre herramientas biométricas y discriminación laboral. Los equipos de marketing deberían conocer las reglas sobre deepfakes y publicaciones de interés público. Las áreas de compras y tecnología deberían entender la calificación como proveedor, los flujos de datos y las obligaciones de los proveedores.",
            ],
          },
          {
            heading: "Un programa de cumplimiento proporcionado",
            paragraphs: [
              "El Reglamento no exige que cada despacho construya un departamento de cumplimiento extenso. Una práctica pequeña puede implantar un programa proporcionado formado por un socio responsable, una lista de herramientas aprobadas, formación básica, un aviso en el chatbot cuando sea necesario, un proceso de revisión de publicaciones y un procedimiento escrito de respuesta a incidentes.[1]",
              "Los despachos mayores pueden necesitar estructuras de gobernanza más complejas, incluidos registros centrales de IA, evaluaciones de rol por jurisdicción, pruebas técnicas, segregación de asuntos, seguimiento de proveedores y revisión formal de las comunicaciones públicas.",
            ],
          },
          {
            heading: "Prepararse para los incidentes de IA",
            paragraphs: [
              "Los despachos deberían prepararse también para incidentes que impliquen inteligencia artificial. Pueden incluir la divulgación de información confidencial, una autoridad fabricada en un escrito, un deepfake sin etiquetar, un fallo al mostrar el aviso de un chatbot, la pérdida de datos de procedencia o la publicación de contenido generado por IA sin la revisión humana adecuada.",
              "Cuando se produce un incidente, el despacho debería detener o aislar el sistema afectado, preservar las pruebas relevantes, identificar a los clientes o asuntos implicados y valorar si procede notificar. El análisis puede implicar normas deontológicas, deberes ante los tribunales, pólizas de seguro, obligaciones contractuales y el Reglamento General de Protección de Datos.",
            ],
          },
          {
            heading: "Sanciones y calendario",
            paragraphs: [
              "El incumplimiento del artículo 50 puede acarrear multas administrativas de hasta 15 millones de euros o el 3 % del volumen de negocios anual mundial de la organización en el ejercicio anterior. Los despachos pequeños y medianos pueden beneficiarse de topes más favorables, pero no quedan exentos de las obligaciones de transparencia.[4]",
              "Las principales obligaciones de transparencia del artículo 50 se aplican desde el 2 de agosto de 2026. No hay período de gracia general para los avisos de chatbots, el etiquetado de deepfakes, el texto de interés público o los avisos sobre reconocimiento de emociones y categorización biométrica. Una transición limitada hasta el 2 de diciembre de 2026 se aplica solo a determinados proveedores de sistemas de contenido sintético ya comercializados antes del 2 de agosto de 2026.[3]",
            ],
          },
          {
            heading: "Qué significa esto en la práctica",
            paragraphs: [
              "La consecuencia práctica para la profesión no es que la inteligencia artificial quede prohibida. Ni que todo documento jurídico asistido por IA requiera una advertencia. Los despachos deben, más bien, entender los sistemas que usan, determinar su papel jurídico, proteger la información confidencial, introducir la información exigida y garantizar una supervisión humana efectiva.[1]",
              "El artículo 50 se aplica desde el 2 de agosto de 2026 y crea deberes concretos para las interacciones directas con IA, el contenido sintético, los deepfakes y ciertas publicaciones de interés público. Para la mayoría de los despachos, sin embargo, los principios decisivos seguirán siendo los de siempre: juicio profesional, verificación cuidadosa, protección de la información del cliente y responsabilidad individual por la calidad y la integridad del trabajo jurídico.",
            ],
          },
        ],
      },
    },
    body: [
      {
        heading: "What Article 50 actually requires",
        paragraphs: [
          "From 2 August 2026, law firms operating in or connected to the European Union must pay closer attention to how they use artificial intelligence. Article 50 of the EU Artificial Intelligence Act introduces new transparency obligations for systems that interact directly with individuals, generate synthetic content, use emotion recognition or biometric categorisation, or produce deepfakes and certain publications intended to inform the public.[2]",
          "These rules do not mean that lawyers must disclose every use of artificial intelligence. A contract, legal memorandum, email or court submission does not automatically need an AI label simply because an AI tool helped prepare a first draft. The obligations depend on the type of system, the role played by the law firm and the way the resulting content is presented to clients or the public.",
        ],
      },
      {
        heading: "Provider or deployer: the first question",
        paragraphs: [
          "For most law firms, the starting point is determining whether the firm is acting as a provider or a deployer of an AI system.",
          "A firm is ordinarily a deployer when it uses a product developed and supplied by a third party. This will generally be the case when a firm subscribes to an existing legal research assistant, document review platform, translation tool or generative AI service.",
          "The situation changes when the firm develops its own system, commissions another company to develop one, materially modifies an existing system or presents a white-labelled system under the firm's own name. In those circumstances, the firm may become a provider. A firm that develops and operates its own client-facing legal chatbot may be both the provider and the deployer, because it places the system into service under its name and controls how it is used.",
          "Individual lawyers working within a law firm will not normally be treated as separate deployers when they use AI under the firm's authority and instructions. The legal entity exercising control over the system is generally the deployer. A sole practitioner who independently selects and operates an AI system may, however, personally fall within that definition.",
          "This distinction does not remove the individual lawyer's professional responsibilities. Regardless of how the firm is classified under the AI Act, lawyers remain responsible for confidentiality, competence, independence, factual accuracy and their conduct towards clients and courts.",
        ],
      },
      {
        heading: "Client-facing chatbots and intake systems",
        paragraphs: [
          "One of the most visible changes concerns client-facing chatbots, voice assistants and automated intake systems. When a person directly interacts with an AI system, the provider must normally ensure that the person is informed that they are communicating with artificial intelligence.",
          "The disclosure should appear at the beginning of the interaction. Hiding the information in terms and conditions, a privacy policy or technical documentation is unlikely to be sufficient. The notice must also be clear, distinguishable and accessible.",
          "A law firm chatbot could therefore begin by stating that the user is interacting with an artificial intelligence assistant operated for the firm. The firm may then add that the assistant provides general information, does not create a lawyer-client relationship, should not receive confidential information and may produce incomplete or inaccurate answers.",
          "These additional warnings do not arise directly from Article 50, but they help address professional responsibility, confidentiality and consumer protection risks. A third-party vendor may remain legally responsible for implementing the AI interaction notice, but the law firm should still test the system and ensure that its customisation has not removed or obscured the disclosure.",
        ],
      },
      {
        heading: "Synthetic content and machine-readable marking",
        paragraphs: [
          "Article 50 also regulates synthetic audio, images, video and text. Providers of systems that generate or manipulate this type of content may be required to include machine-readable marks that allow the content to be detected as artificially generated or modified.",
          "This technical obligation generally falls on the provider of the synthetic content system, rather than every lawyer who uses a generative AI tool. A law firm using a third-party text generator will not normally be expected to engineer its own watermarking system. The analysis may be different when the firm develops, substantially modifies or distributes the system under its own name.",
          "The rules contain an exception for tools that perform standard editing without substantially changing the meaning of the original content. Grammar correction, spelling checks, formatting and minor stylistic improvements may fall within this exception. Material rewriting, restructuring or changes to the substance, tone or intended message require a more careful assessment.",
        ],
      },
      {
        heading: "Deepfakes in firm communications",
        paragraphs: [
          "Deepfakes are subject to a separate obligation. A law firm that publishes realistic AI-generated or manipulated audio, images or video that falsely appear to depict a real person, object, place or event must provide a clear disclosure.",
          "Potential examples include a cloned partner's voice used in advertising, a realistic digital avatar presented as a real lawyer, or an AI reconstruction of an accident or transaction that could be mistaken for authentic footage. The disclosure must be visible or audible when the content is first presented. Hidden metadata or an invisible provider watermark will not satisfy the deployer's obligation to inform the audience.",
          "The context remains important. An obviously fictional or stylised animation may not meet the definition of a deepfake. Artistic, satirical and fictional works are subject to a more flexible disclosure standard, but they are not completely exempt.",
        ],
      },
      {
        heading: "Public-interest publications and the human-review exception",
        paragraphs: [
          "Another important rule concerns AI-generated or materially manipulated text published for the purpose of informing the public about a matter of public interest. This category may include legal updates, regulatory analyses, court reports, election law commentary, public policy articles and communications relating to consumer protection or fundamental rights.",
          "However, Article 50 provides an important exception where the publication has undergone genuine human review and a natural or legal person assumes editorial responsibility.",
          "For law firms, this exception is likely to become the main route to compliance for AI-assisted legal publications. The reviewing lawyer must do more than approve the text quickly or correct its grammar. The reviewer should examine the substance, verify the facts and legal authorities, assess the reliability of the sources and have the authority to modify or reject the publication.",
          "A second AI tool cannot replace this human review. Similarly, if substantial AI-generated changes are made after the lawyer approves the publication, the revised version should be reviewed again.",
        ],
      },
      {
        heading: "Court filings and verification duties",
        paragraphs: [
          "A conventional court filing will not automatically fall within the public-interest publication rule merely because it later becomes accessible through a public court record. The purpose of the publication remains relevant. The document must be published with the intention of informing the public about a matter of public interest. National procedural rules and court orders may nevertheless create separate disclosure obligations.",
          "The AI Act also does not create a general obligation to tell a court or opposing counsel that artificial intelligence was used for legal research or drafting. Lawyers must instead examine the rules applicable to the particular court or tribunal. Some courts may require certifications, declarations or restrictions concerning AI use.",
          "Even where no disclosure is required, the lawyer must personally verify every factual statement, legal authority, quotation and procedural representation submitted to the court. Artificial intelligence output should be treated as unverified material until it has been checked against authoritative sources and the evidential record.",
          "Fabricated cases and inaccurate quotations can expose lawyers to disciplinary proceedings, contempt findings, professional negligence claims and serious reputational damage. The fact that the error originated from an AI system does not transfer responsibility away from the lawyer who relied on it.",
        ],
      },
      {
        heading: "Confidentiality, vendors and conflicts",
        paragraphs: [
          "Confidentiality is another central concern. The main risk often arises before an AI system generates any output, when a lawyer enters a client's information into the system.",
          "Prompts, pleadings, contracts, correspondence, recordings and document collections may be retained, accessed by vendor personnel, shared with subprocessors or used to improve a model. Law firms should therefore understand how a provider processes information before allowing confidential or privileged material to be uploaded.",
          "This concern is not limited to obvious chatbots. Artificial intelligence is increasingly integrated into email platforms, PDF software, transcription services, translation tools, browsers, document management systems and productivity applications. Some functions may be activated automatically without the lawyer realising that information is being processed by an AI system.",
          "Law firms should maintain an approved list of tools, use enterprise accounts where possible and prohibit the entry of confidential information into unapproved public systems. Vendor agreements should address data retention, model training, security, subprocessors, deletion, audit rights and incident notification. Matter-level access restrictions, encryption and redaction may also be necessary.",
          "The use of AI can create conflicts of interest when information relating to different clients is placed in shared workspaces, retrieval systems or training datasets. Firms should ensure that confidential information cannot be retrieved across matters and that access is limited according to professional ethical walls and matter permissions.",
        ],
      },
      {
        heading: "Information, not consent — usually",
        paragraphs: [
          "Article 50 generally requires information rather than consent. It does not impose a universal rule requiring every client to approve every use of artificial intelligence. Consent may still be necessary under professional conduct rules, data protection law, engagement terms, outside counsel guidelines or because of the sensitivity of a particular matter.",
          "Firms should consider providing general information about controlled AI use in their engagement letters or privacy notices. More specific client approval may be appropriate when identifiable or confidential documents will be processed, when client material may be used for training or fine-tuning, or when an automated system provides client-facing legal guidance.",
        ],
      },
      {
        heading: "AI literacy as an organisational duty",
        paragraphs: [
          "Artificial intelligence literacy is also an organisational obligation. Providers and deployers must take measures to ensure that lawyers, staff members and contractors using AI on their behalf possess an appropriate understanding of the technology.",
          "Training should reflect the person's role and the risks of the system. Lawyers may need training on hallucinations, source verification, confidentiality and professional independence. Human resources teams may require guidance on biometric tools and employment discrimination. Marketing teams should understand the rules governing deepfakes and public-interest publications. Procurement and technology personnel should understand provider classification, data flows and vendor obligations.",
        ],
      },
      {
        heading: "A proportionate compliance programme",
        paragraphs: [
          "The AI Act does not require every firm to build an extensive compliance department. A small practice can implement a proportionate programme consisting of a responsible partner, an approved tool list, basic training, a chatbot notice where necessary, a publication review process and a written incident response procedure.[1]",
          "Larger firms may need more complex governance structures, including central AI registers, jurisdiction-specific role assessments, technical testing, matter segregation, vendor monitoring and formal review of public communications.",
        ],
      },
      {
        heading: "Preparing for AI incidents",
        paragraphs: [
          "Law firms should also prepare for incidents involving artificial intelligence. These may include the disclosure of confidential information, fabricated authority in a filing, an unlabelled deepfake, a failure to display a chatbot notice, loss of provenance data or publication of AI-generated content without appropriate human review.",
          "When an incident occurs, the firm should stop or isolate the affected system, preserve relevant evidence, identify the clients or matters involved and assess whether notification is required. The analysis may involve professional conduct rules, court duties, insurance policies, contractual obligations and the General Data Protection Regulation.",
        ],
      },
      {
        heading: "Penalties and timing",
        paragraphs: [
          "Failure to comply with Article 50 can lead to administrative fines of up to €15 million or 3 percent of the organisation's worldwide annual turnover for the preceding financial year. Small and medium-sized firms may benefit from more favourable penalty ceilings, but they are not exempt from the transparency obligations.[4]",
          "The main Article 50 transparency obligations apply from 2 August 2026. There is no general grace period for chatbot disclosures, deepfake labels, public-interest text or notices concerning emotion recognition and biometric categorisation. A limited transition until 2 December 2026 applies only to certain providers of synthetic content systems that were already placed on the market before 2 August 2026.[3]",
        ],
      },
      {
        heading: "What this means in practice",
        paragraphs: [
          "The practical consequence for the legal profession is not that artificial intelligence becomes prohibited. Nor does every AI-assisted legal document require a warning. Instead, firms must understand the systems they use, determine their legal role, protect confidential information, introduce the required disclosures and ensure meaningful human supervision.[1]",
          "Article 50 applies from 2 August 2026 and creates targeted duties for direct AI interactions, synthetic content, deepfakes and certain public-interest publications. For most law firms, however, the decisive principles will remain familiar ones: professional judgement, careful verification, protection of client information and individual accountability for the quality and integrity of legal work.",
        ],
      },
    ],
    references: [
      {
        label:
          "[1] Article 50 compliance checklist — interactive tool on this site",
        href: "/eu-ai-act/article-50-checklist",
        note: "Situation triage, 18 controls by role with owners and evidence to retain, 20 edge-case scenarios, and sample disclosure wording. Indicative only — not legal advice.",
      },
      {
        label:
          "[2] Article 50 — Regulation (EU) 2024/1689 (AI Act Service Desk)",
        href: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50",
        note: "Core legal text: duties, timing, accessibility, and exceptions.",
      },
      {
        label:
          "[3] Commission FAQ — Transparency obligations under Article 50",
        href: "https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act",
        note: "Operational source for scope, exceptions, human review, and the limited transition to 2 December 2026.",
      },
      {
        label: "[4] Article 99 — Penalties",
        href: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99",
        note: "Penalty ceilings applicable to Article 50 breaches.",
      },
    ],
  },
  {
    slug: "when-ai-makes-legal-filings-easier-but-justice-harder",
    title: "When AI makes legal filings easier but justice harder",
    subtitle:
      "A Florida appellate decision on a pro se brief containing a phantom case and fabricated quotations shows how far a polished filing can sit from a viable legal argument.",
    author,
    status: "published",
    category: "Access to Justice",
    tags: [
      "Access to Justice",
      "Pro se litigation",
      "Generative AI",
      "Hallucinated citations",
      "Sanctions",
      "Florida",
    ],
    jurisdiction: "United States / Florida",
    readingTime: "12 min read",
    summary:
      "In Gouldy v. Chiasson, Florida's Fourth District Court of Appeal affirmed the rejection of a self-represented litigant's appeal after finding a nonexistent case, fabricated quotations, and misrepresentations of the record — and issued an order to show cause on barring further pro se filings. The decision illustrates the distance between producing something that looks like a legal brief and presenting a legally viable argument.",
    abstract:
      "On July 22, 2026, the Florida Fourth District Court of Appeal issued a decision that offers a striking illustration of a growing problem in American courts. The decision is more than another warning about artificial intelligence hallucinations: it illustrates the growing distance between the ability to produce something that looks like a legal brief and the ability to present a legally viable argument.",
    image: "/images/research/gouldy-chiasson-ai-filings.png",
    publishedAt: "2026-07-24",
    relatedSlugs: [
      "generative-ai-access-to-justice-pro-se",
      "ai-summaries-rule-1006-admissibility",
      "ai-legal-ethics-early-questions-lawyers",
    ],
    translations: {
      fr: {
        title: "Quand l'IA rend le dépôt plus facile et la justice plus difficile",
        subtitle:
          "Une décision d'appel floridienne, portant sur un mémoire sans avocat contenant une décision fantôme et des citations fabriquées, montre la distance qui sépare une écriture soignée d'un argument juridiquement viable.",
        readingTime: "12 min de lecture",
        summary:
          "Dans Gouldy v. Chiasson, la cour d'appel du quatrième district de Floride a confirmé le rejet de l'appel d'une justiciable sans avocat après avoir constaté une décision inexistante, des citations fabriquées et des dénaturations du dossier, et a émis une injonction de justifier pourquoi elle ne devrait pas être privée du droit de déposer sans avocat. La décision illustre l'écart entre produire ce qui ressemble à un mémoire et présenter un argument juridiquement viable.",
        abstract:
          "Le 22 juillet 2026, la cour d'appel du quatrième district de Floride a rendu une décision qui illustre de façon frappante un problème croissant devant les juridictions américaines. Elle est bien plus qu'un nouvel avertissement sur les hallucinations de l'intelligence artificielle : elle met en lumière la distance grandissante entre la capacité à produire ce qui ressemble à un mémoire et celle de présenter un argument juridiquement viable.",
        body: [
          {
            heading: "Ce que la décision floridienne illustre",
            paragraphs: [
              "Le 22 juillet 2026, la cour d'appel du quatrième district de Floride a rendu une décision qui illustre de façon frappante un problème croissant devant les juridictions américaines. Dans Gouldy v. Chiasson, la cour a confirmé le rejet de l'appel d'une justiciable sans avocat après avoir constaté que son mémoire contenait une décision inexistante, des citations fabriquées, des dénaturations du dossier et des références qui n'étayaient pas les arguments pour lesquels elles étaient invoquées. Les juges ont également rendu une ordonnance distincte lui enjoignant d'expliquer pourquoi elle ne devrait pas être privée du droit de déposer de nouvelles écritures sans avocat devant cette cour.[1]",
              "La décision est bien plus qu'un nouvel avertissement sur les hallucinations de l'intelligence artificielle. Elle met en lumière la distance grandissante entre la capacité à produire ce qui ressemble à un mémoire et celle de présenter un argument juridiquement viable.",
              "L'IA générative peut aider à créer des documents qui paraissent organisés, professionnels et faisant autorité. Mais savoir produire une prose juridique convaincante n'est pas savoir identifier une prétention valable, préserver un moyen en appel, appliquer la règle de droit pertinente ou fournir une source juridique fiable.",
              "Dans certains cas, la technologie ne se contente pas de ne pas améliorer la position du justiciable. Elle peut rendre l'écriture plus difficile à évaluer pour la juridiction et exposer celui qui l'a déposée à de lourdes sanctions.",
            ],
          },
          {
            heading: "L'affaire devant la cour floridienne",
            paragraphs: [
              "L'appel s'inscrivait dans un litige ancien opposant Rose Lannquist Gouldy à Timothy Chiasson, un avocat qui avait représenté d'autres parties dans une succession connexe.",
              "Gouldy avait assigné Chiasson et d'autres pour fraude à la justice, vol civil, extorsion économique et interférence délictuelle. Le tribunal de première instance a statué en faveur de Chiasson, jugé ses prétentions abusives et mis à sa charge honoraires et dépens.",
              "La cour d'appel avait précédemment confirmé ce jugement et alloué des honoraires d'appel supplémentaires. Sur renvoi, le tribunal a fixé à 54 780 dollars les honoraires d'appel et à 10 882,23 dollars les dépens, soit un total de 65 662,23 dollars. Gouldy a alors interjeté appel de cette décision.",
              "Son mémoire d'appel soulevait quinze moyens, dont plusieurs comportaient des sous-moyens. La cour a conclu que ses arguments étaient soit non préservés, soit insuffisamment exposés, soit entièrement dépourvus de fondement. Plus grave, les juges ont constaté que les sources censées les étayer étaient, à plusieurs reprises, peu fiables ou fabriquées.",
              "Le mémoire citait une décision qui n'existait pas, attribuait des formulations inventées à de véritables décisions, dénaturait des éléments du dossier et s'appuyait sur des arrêts qui n'étayaient pas les propositions avancées.",
              "L'un des exemples les plus nets concernait une prétendue décision Barton v. McGovern, citée comme un arrêt floridien de 2020. Aucune décision de ce type n'existait. Il existait bien une affaire réelle portant ce nom, datant de 1987, mais elle ne contenait pas le passage qui lui était attribué.[2]",
              "Le mémoire utilisait également une fausse citation d'un arrêt réel de la Cour suprême de Floride et comportait d'autres citations fabriquées tirées d'autres décisions floridiennes. Ailleurs, Gouldy affirmait que la condamnation aux honoraires s'élevait à environ 125 000 dollars, alors que le montant réel était de 65 662,23 dollars.[3]",
              "La décision n'établit pas que Gouldy a utilisé une plateforme d'IA générative en particulier pour préparer son mémoire. La cour a néanmoins rattaché cette écriture à une tendance plus large qu'elle dit observer dans les juridictions d'appel floridiennes.",
              "Selon les juges, de nombreux justiciables sans avocat semblent désormais utiliser des plateformes d'intelligence artificielle pour générer mémoires et requêtes d'appel. Ces écritures sont généralement lisibles, mais peuvent contenir des sources fantômes, des descriptions inexactes du dossier et des citations fabriquées.",
              "La cour a confirmé l'appel dans son intégralité. Elle a également rendu une ordonnance distincte enjoignant à Gouldy d'expliquer pourquoi elle ne devrait pas être privée du droit de déposer sans avocat devant cette cour. Les juges ont relevé qu'elle avait déjà été avertie à deux reprises au sujet d'écritures abusives.",
              "La restriction n'est donc pas encore définitivement prononcée. Une injonction de justifier laisse à Gouldy la possibilité de répondre avant que la cour ne décide de limiter ses futurs dépôts. La perspective d'une telle sanction montre néanmoins la gravité avec laquelle les juridictions peuvent traiter le recours répété à des sources fabriquées.",
            ],
          },
          {
            heading: "Un document soigné peut rester juridiquement vide",
            paragraphs: [
              "L'aspect le plus important de la décision n'est pas simplement que le mémoire contenait des erreurs. Les écritures des justiciables sans avocat en ont toujours contenu, sur les faits, la procédure et le droit.",
              "Ce qui change, c'est l'apparence de fiabilité.",
              "L'IA générative peut produire un document qui ressemble à un travail juridique professionnel. La prose peut être fluide. Les moyens peuvent être répartis en sections soigneusement intitulées. Le document peut évoquer la compétence, le procès équitable, la préservation des moyens, les standards de contrôle, l'interprétation des textes et les principes constitutionnels. Les citations peuvent même sembler respecter le bon format.",
              "Cette qualité de surface peut rendre l'écriture bien plus crédible qu'elle ne l'est.",
              "Un argument mal rédigé est souvent assez facile à repérer. Un argument soigné mais faux est plus coûteux. Un juge ou un assistant devra peut-être rechercher la décision citée, vérifier qu'elle existe, localiser le passage cité, examiner la position procédurale et déterminer si l'arrêt étaye réellement la proposition avancée.",
              "Lorsqu'une écriture contient une citation douteuse, cela peut ne prendre qu'un temps limité. Lorsqu'elle contient de nombreuses citations inventées et des sources dénaturées, le processus de vérification peut consommer des ressources judiciaires considérables.",
              "La cour floridienne a expressément relevé ce coût institutionnel. Parce que les juridictions d'appel doivent examiner les moyens soulevés par les parties, enquêter sur des écritures générées par IA consomme un temps qui pourrait être consacré à d'autres affaires.",
              "C'est pourquoi les citations hallucinées ne peuvent être traitées comme d'anodines erreurs techniques. Une fois l'écriture déposée, la fausse source ne reste plus entre l'utilisateur et la machine. Elle devient un problème pour la partie adverse, pour la juridiction et pour l'administration de la justice.",
              "Elle peut aussi masquer l'argument légitime que le justiciable pouvait avoir. La cour a reconnu que l'un des moyens de Gouldy pouvait comporter au moins une once de mérite discutable. Elle a néanmoins conclu que tout moyen potentiellement valable était noyé sous le volume d'arguments abusifs qui l'entouraient.",
              "C'est là l'un des risques centraux d'un usage non encadré de l'IA en contentieux. La technologie peut aider à produire plus d'arguments, plus de citations et plus de pages. Mais davantage de langage juridique ne fait pas nécessairement un dossier plus solide.",
              "Elle peut au contraire enfouir un moyen pertinent sous des arguments jamais préservés, des doctrines inapplicables et des sources qui n'existent pas.",
            ],
          },
          {
            heading: "De l'accès au dépôt à l'accès à la justice",
            paragraphs: [
              "La décision fait également écho à une distinction que j'ai examinée dans un article antérieur, IA générative, auto-représentation, et la distance entre l'accès au juge et l'accès à la justice.[4]",
              "Cet article évoquait des travaux suggérant que la disponibilité généralisée de l'IA générative pourrait être associée à une hausse des contentieux civils fédéraux sans avocat et à une évolution du style des requêtes. Les écritures identifiées comme potentiellement assistées par IA paraissaient plus soignées et comportaient davantage de citations, sans pour autant obtenir de meilleurs résultats.",
              "La question de fond était de savoir si l'IA générative élargit l'accès à la justice ou abaisse simplement la barrière du dépôt. Gouldy v. Chiasson en offre un exemple concret.",
              "La justiciable a pu produire un long mémoire d'appel soulevant quinze moyens distincts. L'écriture employait une terminologie juridique et citait de nombreuses sources. En un sens, l'IA a pu rendre plus accessible une procédure d'appel difficile à mener sans avocat.",
              "Mais participer n'a pas créé un appel viable.",
              "La cour a jugé les arguments non préservés, insuffisamment développés ou dépourvus de fondement. Le supplément de langage juridique n'a pas corrigé les défaillances procédurales et de fond sous-jacentes. Au contraire, les sources fabriquées ont alourdi la charge de la juridiction et ont contribué à la possibilité que la justiciable perde le droit de former de futurs appels sans avocat.",
              "L'affaire met donc en évidence la différence entre plusieurs formes d'accès parfois traitées comme équivalentes.",
              "Une personne peut avoir accès à l'information juridique. Elle peut avoir accès à un outil capable de produire un document juridique. Elle peut aussi avoir un accès formel au tribunal par la faculté de déposer ce document.",
              "Rien de tout cela ne donne nécessairement accès à un remède juridique effectif.",
              "Un système génératif peut aider à organiser des faits, à identifier des notions juridiques possibles ou à transformer un récit informel en structure de requête ou de mémoire. Mais il ne peut pas établir automatiquement la compétence, préserver une objection en première instance, satisfaire les éléments d'une cause d'action, déterminer le standard de contrôle applicable, produire des preuves recevables ni décider si un arrêt cité étaye réellement une proposition.",
              "Ces tâches exigent un jugement juridique, une conscience procédurale, la connaissance du dossier et une vérification indépendante.",
              "Le danger est qu'une personne confonde la capacité à reproduire l'apparence du raisonnement juridique avec la capacité à raisonner juridiquement.",
            ],
          },
          {
            heading: "La responsabilité reste à celui qui signe l'écriture",
            paragraphs: [
              "La cour floridienne a également indiqué clairement que le recours à l'IA générative ne modifie pas le standard applicable aux sources fabriquées.",
              "Citant ses décisions antérieures, la cour a expliqué que le fait de soumettre une jurisprudence fictive ou fabriquée peut être sanctionné, que l'erreur résulte de négligence, de méprise ou du recours à des outils d'intelligence artificielle générative.[5]",
              "Ce principe compte, car les hallucinations d'IA sont parfois présentées comme des erreurs commises par la seule technologie. Or les juridictions ne reçoivent pas d'écritures de la part de logiciels. Elles reçoivent des documents signés et déposés par des justiciables et des avocats.",
              "La personne dont le nom figure sur l'écriture demeure responsable de vérifier que les sources existent, que les citations sont exactes et que les décisions étayent l'argument avancé.",
              "Pour les avocats, cette responsabilité est renforcée par les devoirs professionnels de compétence, de loyauté envers le tribunal, de supervision et de certification des écritures. Un avocat qui produit une jurisprudence inventée s'expose à des sanctions pécuniaires, à des poursuites disciplinaires, à une atteinte à sa réputation et à des conséquences pour son client.",
              "Les justiciables sans avocat ne relèvent pas de la discipline du barreau, mais ils ne sont exemptés ni des règles de procédure ni des sanctions judiciaires. Les juridictions peuvent écarter des écritures, rejeter des prétentions, allouer des honoraires, prononcer des amendes ou restreindre la faculté de déposer de futurs documents sans avocat.",
              "Cette différence explique en partie la préoccupation de la cour. Les avocats inscrits relèvent d'un système disciplinaire professionnel. Les justiciables sans avocat, non. Lorsque des avertissements répétés restent sans effet, une restriction de dépôt peut devenir l'un des rares outils disponibles pour prévenir la poursuite de l'abus.",
            ],
          },
          {
            heading: "De meilleurs outils, pas moins d'utilisateurs",
            paragraphs: [
              "La leçon de Gouldy ne devrait pas être qu'il faut empêcher les justiciables sans avocat d'utiliser l'IA générative.",
              "Pour les personnes qui ne peuvent pas s'offrir un avocat, ces outils peuvent apporter une aide réelle. Ils peuvent aider à comprendre une terminologie inconnue, à organiser une chronologie, à identifier les documents pertinents, à préparer des questions et à exprimer plus clairement sa position.",
              "Le vrai problème est l'écart entre une génération de texte à usage général et une assistance juridique fiable.",
              "Un agent conversationnel grand public est généralement conçu pour produire une réponse, même lorsque l'information juridique pertinente est incertaine, incomplète ou indisponible. Un outil juridique responsable devrait au contraire être capable de reconnaître l'incertitude, de limiter les conclusions non étayées, de relier les propositions à des sources vérifiables, de distinguer les ordres juridiques et d'avertir l'utilisateur lorsqu'une relecture humaine devient nécessaire.",
              "De meilleurs systèmes n'aideraient pas seulement à produire des mémoires plus longs. Ils aideraient à identifier quels faits comptent, quels arguments sont juridiquement disponibles, quels moyens ont été préservés et quelles sources peuvent être vérifiées de façon indépendante.",
              "Les juridictions pourraient aussi avoir besoin de nouvelles formes de triage. Les organismes d'aide juridictionnelle pourraient avoir besoin de dispositifs permettant à des avocats de relire les écritures assistées par IA avant leur dépôt. Les développeurs pourraient devoir concevoir leurs produits autour des réalités de la procédure plutôt qu'autour de l'apparence d'aisance juridique.",
              "L'objectif ne devrait pas être de faire parler chaque justiciable comme un avocat. Il devrait être d'aider les gens à comprendre ce que le système juridique exige, et à quel moment l'assistance automatisée ne suffit plus.",
            ],
          },
          {
            heading: "La distance entre l'apparence et le fond",
            paragraphs: [
              "La décision du 22 juillet 2026 dans Gouldy v. Chiasson montre le danger qu'il y a à confondre l'accès à la rédaction juridique avec l'accès à la justice.",
              "L'IA générative peut faciliter la rédaction d'un mémoire. Elle peut faciliter le fait de soulever quinze arguments plutôt qu'un. Elle peut rendre une écriture plus professionnelle que ce que le justiciable aurait produit seul.",
              "Mais elle ne peut pas rendre préservé un moyen qui ne l'a pas été. Elle ne peut pas rendre déterminante une décision hors sujet. Elle ne peut pas rendre réelle une citation inventée.",
              "Et lorsque la distance entre l'apparence et le fond devient trop grande, la technologie qui semblait ouvrir la porte du tribunal peut finir par contribuer à la refermer.",
            ],
          },
        ],
      },
      es: {
        title: "Cuando la IA facilita presentar escritos y dificulta la justicia",
        subtitle:
          "Una sentencia de apelación de Florida, sobre un escrito sin abogado que contenía un caso fantasma y citas fabricadas, muestra la distancia que separa un escrito pulido de un argumento jurídicamente viable.",
        readingTime: "12 min de lectura",
        summary:
          "En Gouldy v. Chiasson, el tribunal de apelación del cuarto distrito de Florida confirmó el rechazo del recurso de una litigante sin abogado tras constatar un caso inexistente, citas fabricadas y tergiversaciones del expediente, y dictó una orden para que justificara por qué no debería prohibírsele presentar más escritos sin abogado. La resolución ilustra la distancia entre producir algo que parece un escrito jurídico y presentar un argumento jurídicamente viable.",
        abstract:
          "El 22 de julio de 2026, el tribunal de apelación del cuarto distrito de Florida dictó una resolución que ilustra de forma llamativa un problema creciente en los tribunales estadounidenses. Es mucho más que otra advertencia sobre las alucinaciones de la inteligencia artificial: pone de relieve la distancia creciente entre la capacidad de producir algo que parece un escrito jurídico y la de presentar un argumento jurídicamente viable.",
        body: [
          {
            heading: "Lo que ilustra la resolución de Florida",
            paragraphs: [
              "El 22 de julio de 2026, el tribunal de apelación del cuarto distrito de Florida dictó una resolución que ilustra de forma llamativa un problema creciente en los tribunales estadounidenses. En Gouldy v. Chiasson, el tribunal confirmó el rechazo del recurso de una litigante sin abogado tras constatar que su escrito contenía un caso inexistente, citas fabricadas, tergiversaciones del expediente y autoridades que no respaldaban los argumentos para los que se invocaban. Los jueces dictaron además una orden separada exigiéndole explicar por qué no debería prohibírsele presentar más escritos sin abogado ante ese tribunal.[1]",
              "La resolución es mucho más que otra advertencia sobre las alucinaciones de la inteligencia artificial. Pone de relieve la distancia creciente entre la capacidad de producir algo que parece un escrito jurídico y la de presentar un argumento jurídicamente viable.",
              "La IA generativa puede ayudar a crear documentos que parecen organizados, profesionales y con autoridad. Pero saber generar prosa jurídica convincente no es lo mismo que saber identificar una pretensión válida, preservar un motivo para la apelación, aplicar el derecho correcto o aportar una fuente jurídica fiable.",
              "En algunos casos, la tecnología no solo deja de mejorar la posición del litigante. Puede hacer el escrito más difícil de evaluar para el tribunal y exponer a quien lo presentó a sanciones graves.",
            ],
          },
          {
            heading: "El caso ante el tribunal de Florida",
            paragraphs: [
              "El recurso surgía de un litigio prolongado entre Rose Lannquist Gouldy y Timothy Chiasson, un abogado que había representado a otras partes en un procedimiento sucesorio conexo.",
              "Gouldy había demandado a Chiasson y a otros por fraude al tribunal, hurto civil, extorsión económica e interferencia ilícita. El tribunal de instancia falló a favor de Chiasson, consideró temerarias sus pretensiones y le impuso honorarios y costas.",
              "El tribunal de apelación había confirmado antes esa sentencia y concedido honorarios adicionales de apelación. En ejecución, el tribunal fijó 54.780 dólares de honorarios de apelación y 10.882,23 dólares de costas, un total de 65.662,23 dólares. Gouldy recurrió entonces esa resolución.",
              "Su escrito de apelación planteaba quince motivos, varios con submotivos. El tribunal concluyó que sus argumentos estaban sin preservar, insuficientemente expuestos o carecían por completo de fundamento. Más grave aún, los jueces constataron que las autoridades invocadas para sostenerlos eran, en varios casos, poco fiables o fabricadas.",
              "El escrito citaba un caso que no existía, atribuía lenguaje inventado a resoluciones reales, tergiversaba partes del expediente y se apoyaba en casos que no respaldaban las proposiciones para las que se citaban.",
              "Uno de los ejemplos más claros fue una supuesta resolución llamada Barton v. McGovern, citada como caso de Florida de 2020. No existía tal resolución. Sí existía un caso real con ese nombre, de 1987, pero no contenía el pasaje que se le atribuía.[2]",
              "El escrito empleaba además una cita falsa de una resolución real del Tribunal Supremo de Florida e incluía otras citas fabricadas de otros casos floridanos. En otro punto, Gouldy afirmaba que la condena en honorarios rondaba los 125.000 dólares, cuando la cifra real era 65.662,23 dólares.[3]",
              "La resolución no acredita que Gouldy usara una plataforma concreta de IA generativa para preparar su escrito. Aun así, el tribunal vinculó ese escrito a una tendencia más amplia que dice observar en los tribunales de apelación de Florida.",
              "Según los jueces, muchos litigantes sin abogado parecen estar usando ahora plataformas de inteligencia artificial para generar escritos y recursos de apelación. Esos escritos suelen ser legibles, pero pueden contener autoridades fantasma, descripciones inexactas del expediente y citas fabricadas.",
              "El tribunal confirmó el recurso en su totalidad. Dictó además una orden separada exigiendo a Gouldy explicar por qué no debería prohibírsele presentar más escritos sin abogado ante ese tribunal. Los jueces señalaron que ya había sido advertida dos veces por escritos temerarios.",
              "La restricción, por tanto, no se ha impuesto aún de forma definitiva. La orden da a Gouldy la oportunidad de responder antes de que el tribunal decida limitar sus futuros escritos. Aun así, la posibilidad de tal sanción muestra la seriedad con que los tribunales pueden tratar el recurso reiterado a material jurídico fabricado.",
            ],
          },
          {
            heading: "Un documento pulido puede estar jurídicamente vacío",
            paragraphs: [
              "Lo más importante de la resolución no es simplemente que el escrito contuviera errores. Los escritos de litigantes sin abogado siempre han contenido errores fácticos, procesales y jurídicos.",
              "Lo que cambia es la apariencia de fiabilidad.",
              "La IA generativa puede producir un documento que se parece a un trabajo jurídico profesional. La prosa puede ser fluida. Los motivos pueden dividirse en secciones cuidadosamente rotuladas. El documento puede referirse a la competencia, al debido proceso, a la preservación de motivos, a los estándares de revisión, a la interpretación normativa y a principios constitucionales. Las citas pueden incluso parecer seguir el formato correcto.",
              "Esa calidad superficial puede hacer que el escrito parezca mucho más creíble de lo que realmente es.",
              "Un argumento mal redactado suele ser relativamente fácil de detectar. Un argumento pulido pero falso resulta más gravoso. Un juez o un letrado puede tener que buscar la resolución citada, confirmar que existe, localizar el pasaje citado, revisar la posición procesal y determinar si el caso respalda realmente la proposición invocada.",
              "Cuando un escrito contiene una cita dudosa, esto puede llevar poco tiempo. Cuando contiene numerosas citas inventadas y autoridades tergiversadas, la verificación puede consumir recursos judiciales considerables.",
              "El tribunal de Florida identificó expresamente ese coste institucional. Como los tribunales de apelación deben examinar los motivos planteados por las partes, indagar en escritos generados por IA consume tiempo que podría dedicarse a otros asuntos.",
              "Por eso las citas alucinadas no pueden tratarse como errores tecnológicos inocuos. Una vez presentado el escrito, la autoridad falsa deja de quedar entre el usuario y la máquina. Se convierte en un problema para la parte contraria, para el tribunal y para la administración de justicia.",
              "También puede oscurecer cualquier argumento legítimo que el litigante pudiera tener. El tribunal reconoció que uno de los motivos de Gouldy podía contener al menos un atisbo de mérito discutible. Pero concluyó que cualquier motivo potencialmente válido quedaba sepultado por el volumen de argumentos temerarios que lo rodeaban.",
              "Ese es uno de los riesgos centrales del uso no guiado de la IA en litigios. La tecnología puede ayudar a producir más argumentos, más citas y más páginas. Pero más lenguaje jurídico no equivale necesariamente a un caso más sólido.",
              "Puede, en cambio, enterrar un motivo relevante bajo argumentos nunca preservados, doctrinas que no aplican y autoridades que no existen.",
            ],
          },
          {
            heading: "Del acceso a presentar escritos al acceso a la justicia",
            paragraphs: [
              "La resolución resuena además con una distinción que examiné en un artículo anterior, IA generativa, autorrepresentación y la distancia entre el acceso a los tribunales y el acceso a la justicia.[4]",
              "Aquel artículo trataba investigaciones que sugieren que la disponibilidad generalizada de IA generativa puede asociarse a un aumento de los litigios civiles federales sin abogado y a cambios en el estilo de las demandas. Los escritos identificados como potencialmente asistidos por IA tendían a parecer más pulidos y a contener más citas jurídicas, pero no lograban mejores resultados.",
              "La cuestión de fondo era si la IA generativa amplía el acceso a la justicia o simplemente rebaja la barrera para presentar una demanda. Gouldy v. Chiasson ofrece un ejemplo concreto de esa distinción.",
              "La litigante pudo producir un extenso escrito de apelación con quince motivos distintos. El escrito usaba terminología jurídica y citaba numerosas autoridades. En cierto sentido, la IA pudo facilitar la participación en un procedimiento de apelación difícil de recorrer sin abogado.",
              "Pero participar no creó un recurso viable.",
              "El tribunal consideró los argumentos sin preservar, insuficientemente desarrollados o infundados. El lenguaje jurídico adicional no corrigió las deficiencias procesales y sustantivas subyacentes. Al contrario, las autoridades fabricadas aumentaron la carga del tribunal y contribuyeron a la posibilidad de que la litigante pierda la facultad de presentar futuros recursos sin abogado.",
              "El caso agudiza así la diferencia entre varias formas de acceso que a veces se tratan como intercambiables.",
              "Una persona puede tener acceso a información jurídica. Puede tener acceso a una herramienta capaz de producir un documento jurídico. Puede tener también acceso formal al tribunal mediante la facultad de presentar ese documento.",
              "Nada de eso proporciona necesariamente acceso a un remedio jurídico efectivo.",
              "Un sistema generativo puede ayudar a ordenar hechos, identificar posibles conceptos jurídicos o transformar un relato informal en la estructura de una demanda o un escrito. Pero no puede establecer automáticamente la competencia, preservar una objeción en instancia, satisfacer los elementos de una causa de acción, determinar el estándar de revisión aplicable, producir prueba admisible ni decidir si un caso citado respalda realmente una proposición.",
              "Esas tareas exigen juicio jurídico, conciencia procesal, conocimiento del expediente y verificación independiente.",
              "El peligro es que una persona confunda la capacidad de reproducir la apariencia del razonamiento jurídico con la capacidad de razonar jurídicamente.",
            ],
          },
          {
            heading: "La responsabilidad sigue siendo de quien firma el escrito",
            paragraphs: [
              "El tribunal de Florida dejó claro también que recurrir a la IA generativa no altera el estándar aplicable a las autoridades fabricadas.",
              "Citando sus resoluciones anteriores, el tribunal explicó que presentar jurisprudencia ficticia o fabricada puede sancionarse, ya proceda el error de descuido, de un malentendido o del uso de herramientas de inteligencia artificial generativa.[5]",
              "Este principio importa porque las alucinaciones de IA se describen a veces como si fueran errores cometidos únicamente por la tecnología. Pero los tribunales no reciben escritos de programas informáticos. Reciben documentos firmados y presentados por litigantes y abogados.",
              "La persona cuyo nombre figura en el escrito sigue siendo responsable de confirmar que las autoridades existen, que las citas son exactas y que los casos respaldan el argumento planteado.",
              "Para los abogados, esa responsabilidad se refuerza con los deberes profesionales de competencia, lealtad hacia el tribunal, supervisión y certificación de los escritos. Un abogado que presenta jurisprudencia inventada puede enfrentarse a sanciones económicas, expedientes disciplinarios, daño reputacional y consecuencias para su cliente.",
              "Los litigantes sin abogado no están sujetos a la disciplina colegial, pero no quedan exentos de las normas procesales ni de las sanciones judiciales. Los tribunales pueden inadmitir escritos, desestimar pretensiones, imponer honorarios, aplicar multas o restringir la facultad de presentar futuros documentos sin abogado.",
              "Esa diferencia explica en parte la preocupación del tribunal. Los abogados colegiados operan dentro de un sistema disciplinario profesional. Los litigantes sin abogado, no. Cuando las advertencias repetidas resultan ineficaces, una restricción de presentación puede convertirse en una de las pocas herramientas disponibles para impedir que el abuso continúe.",
            ],
          },
          {
            heading: "Mejores herramientas, no menos usuarios",
            paragraphs: [
              "La lección de Gouldy no debería ser que hay que impedir a los litigantes sin abogado usar IA generativa.",
              "Para quienes no pueden pagar un abogado, estas herramientas pueden ofrecer una ayuda real. Pueden ayudar a entender terminología desconocida, ordenar una cronología, identificar documentos relevantes, preparar preguntas y expresar su posición con más claridad.",
              "El problema real es la brecha entre la generación de texto de uso general y una asistencia jurídica fiable.",
              "Un chatbot de uso público está diseñado generalmente para producir una respuesta, incluso cuando la información jurídica pertinente es incierta, incompleta o no está disponible. Una herramienta jurídica responsable debería, en cambio, ser capaz de reconocer la incertidumbre, limitar las conclusiones no respaldadas, vincular las proposiciones a fuentes verificables, distinguir entre ordenamientos y advertir al usuario cuando la revisión humana resulta necesaria.",
              "Mejores sistemas no ayudarían solo a generar escritos más largos. Ayudarían a identificar qué hechos importan, qué argumentos están jurídicamente disponibles, qué motivos se han preservado y qué autoridades pueden verificarse de forma independiente.",
              "Los tribunales podrían necesitar además nuevas formas de triaje. Las organizaciones de asistencia jurídica podrían necesitar sistemas que permitan a abogados revisar los escritos asistidos por IA antes de su presentación. Los desarrolladores podrían tener que diseñar sus productos en torno a las realidades del procedimiento y no a la apariencia de fluidez jurídica.",
              "El objetivo no debería ser que todo litigante suene como un abogado. Debería ser ayudar a las personas a entender qué exige el sistema jurídico y cuándo la asistencia automatizada deja de bastar.",
            ],
          },
          {
            heading: "La distancia entre la apariencia y el fondo",
            paragraphs: [
              "La resolución de 22 de julio de 2026 en Gouldy v. Chiasson muestra el peligro de confundir el acceso a la redacción jurídica con el acceso a la justicia.",
              "La IA generativa puede facilitar la redacción de un escrito. Puede facilitar plantear quince argumentos en lugar de uno. Puede hacer que un escrito parezca más profesional de lo que el litigante habría producido por sí solo.",
              "Pero no puede preservar un motivo que no se preservó. No puede hacer determinante una resolución irrelevante. No puede hacer real una cita inventada.",
              "Y cuando la distancia entre la apariencia y el fondo se vuelve demasiado grande, la tecnología que parecía abrir la puerta del tribunal puede acabar ayudando a cerrarla.",
            ],
          },
        ],
      },
    },
    body: [
      {
        heading: "What the Florida decision illustrates",
        paragraphs: [
          "On July 22, 2026, the Florida Fourth District Court of Appeal issued a decision that offers a striking illustration of a growing problem in American courts. In Gouldy v. Chiasson, the court affirmed the rejection of a self-represented litigant's appeal after finding that her brief contained a nonexistent case, fabricated quotations, misrepresentations of the record, and authorities that did not support the arguments for which they were cited. The judges also issued a separate order requiring her to explain why she should not be barred from making further pro se filings before the court.[1]",
          "The decision is more than another warning about artificial intelligence hallucinations. It illustrates the growing distance between the ability to produce something that looks like a legal brief and the ability to present a legally viable argument.",
          "Generative AI can help people create documents that appear organized, professional, and authoritative. But the ability to generate convincing legal prose is not the same as the ability to identify a valid claim, preserve an issue for appeal, apply the correct law, or provide reliable legal authority.",
          "In some cases, the technology may not simply fail to improve a litigant's position. It may make the filing more difficult for the court to evaluate and expose the person who submitted it to serious sanctions.",
        ],
      },
      {
        heading: "The case before the Florida court",
        paragraphs: [
          "The appeal arose from a long-running dispute involving Rose Lannquist Gouldy and Timothy Chiasson, an attorney who had represented other parties in a related probate matter.",
          "Gouldy had sued Chiasson and others for fraud upon the court, civil theft, economic extortion, and tortious interference. The trial court entered summary judgment in Chiasson's favor, found that her claims were frivolous, and awarded attorney's fees and costs against her.",
          "The Fourth District Court of Appeal previously affirmed that judgment and awarded additional appellate attorney's fees. On remand, the trial court determined that Chiasson was entitled to $54,780 in appellate fees and $10,882.23 in costs, for a total of $65,662.23. Gouldy then appealed that award.",
          "Her appellate brief raised fifteen issues, several of which included additional sub-issues. The court concluded that her arguments were either unpreserved, inadequately presented, or entirely without merit. More troublingly, the judges found that the authorities used to support those arguments were, in several instances, unreliable or fabricated.",
          "The brief cited a case that did not exist, attributed invented language to real judicial decisions, misrepresented parts of the record, and relied on cases that did not support the propositions for which they were cited.",
          "One of the clearest examples involved a supposed decision called Barton v. McGovern, cited as a 2020 Florida case. No such decision existed. There was a real case with that name from 1987, but it did not contain the language attributed to it in Gouldy's brief.[2]",
          "The brief also used a false quotation from an actual Florida Supreme Court decision and included additional fabricated quotations from other Florida cases. At another point, Gouldy stated that the fee award was approximately $125,000, even though the actual amount was $65,662.23.[3]",
          "The opinion does not establish that Gouldy used a particular generative AI platform to prepare her brief. The court nevertheless connected the filing to a wider trend it says it has observed across Florida's appellate courts.",
          "According to the judges, many self-represented litigants now appear to be using artificial intelligence platforms to generate appellate briefs and motions. Those filings are generally readable, but they may contain phantom authorities, inaccurate descriptions of the record, and fabricated quotations.",
          "The court affirmed the appeal in full. It also issued a separate order to show cause, requiring Gouldy to explain why she should not be barred from making further pro se filings in that court. The judges noted that she had already been warned twice about frivolous submissions.",
          "The restriction has therefore not yet been finally imposed. An order to show cause gives Gouldy an opportunity to respond before the court decides whether to limit her future filings. Still, the possibility of such a sanction demonstrates how seriously courts may treat repeated reliance on fabricated legal material.",
        ],
      },
      {
        heading: "A polished document can still be legally empty",
        paragraphs: [
          "The most important aspect of the decision is not simply that the brief contained mistakes. Self-represented legal filings have always contained factual, procedural, and legal errors.",
          "What is different is the appearance of reliability.",
          "Generative AI can produce a document that resembles professional legal work. The prose may be fluent. The issues may be divided into carefully labeled sections. The document may refer to jurisdiction, due process, preservation, standards of review, statutory interpretation, and constitutional principles. The citations may even appear to follow the correct format.",
          "That surface quality can make the filing look far more credible than it really is.",
          "A poorly drafted argument is often relatively easy to identify. A polished but false argument is more burdensome. A judge or law clerk may need to search for the cited decision, confirm whether it exists, locate the quoted language, review the procedural posture, and determine whether the case actually supports the proposition advanced.",
          "Where a filing contains one doubtful citation, this may take only a short amount of time. Where it contains numerous invented quotations and mischaracterized authorities, the verification process can consume significant judicial resources.",
          "The Florida court expressly identified this institutional cost. Because appellate courts must examine the issues presented by the parties, investigating AI-generated filings consumes time that could otherwise be devoted to other cases.",
          "This is why hallucinated citations cannot be treated as harmless technological mistakes. Once a document is filed, the false authority no longer remains between the user and the machine. It becomes a problem for the opposing party, the court, and the administration of justice.",
          "It can also obscure whatever legitimate argument the litigant may have had. The court acknowledged that one of Gouldy's arguments might have contained at least a small degree of arguable merit. But it concluded that any potentially valid issue was overwhelmed by the volume of frivolous arguments surrounding it.",
          "That is one of the central risks of unguided AI use in litigation. The technology may help a person produce more arguments, more citations, and more pages. But more legal language does not necessarily result in a stronger case.",
          "It may instead bury a potentially relevant issue beneath arguments that were never preserved, legal doctrines that do not apply, and authorities that do not exist.",
        ],
      },
      {
        heading: "From access to filing to access to justice",
        paragraphs: [
          "The decision also resonates with a distinction I examined in an earlier article, Generative AI, self-representation, and the distance between access to courts and access to justice.[4]",
          "That article discussed research suggesting that the widespread availability of generative AI may be associated with an increase in self-represented federal civil litigation and with changes in the style of pro se complaints. Filings identified as potentially AI-assisted tended to appear more polished and to contain more legal citations, but they did not achieve better outcomes.",
          "The broader question was whether generative AI is expanding access to justice or merely lowering the barrier to filing a lawsuit. Gouldy v. Chiasson provides a concrete example of that distinction.",
          "The litigant was able to produce a lengthy appellate brief raising fifteen separate issues. The filing used legal terminology and cited numerous authorities. In one sense, AI may have made it easier to participate in an appellate process that would otherwise be difficult to navigate without counsel.",
          "But participation did not create a viable appeal.",
          "The court found that the arguments were unpreserved, inadequately briefed, or meritless. The additional legal language did not correct the underlying procedural and substantive deficiencies. Instead, the fabricated authorities increased the burden on the court and contributed to the possibility that the litigant could lose the ability to file future appeals without counsel.",
          "The case therefore sharpens the difference between several forms of access that are sometimes treated as interchangeable.",
          "A person may have access to legal information. That person may have access to a tool capable of producing a legal document. The person may also have formal access to the courthouse through the ability to file that document.",
          "None of those things necessarily provides access to an effective legal remedy.",
          "A generative system can help organize facts, identify possible legal concepts, or transform an informal narrative into the structure of a complaint or brief. But it cannot automatically establish jurisdiction, preserve an objection in the trial court, satisfy the elements of a cause of action, determine the correct standard of review, produce admissible evidence, or decide whether a cited case truly supports a proposition.",
          "Those tasks require legal judgment, procedural awareness, knowledge of the record, and independent verification.",
          "The danger is that a person may confuse the ability to reproduce the appearance of legal reasoning with the ability to perform legal reasoning.",
        ],
      },
      {
        heading: "Responsibility stays with the person who signs the filing",
        paragraphs: [
          "The Florida court also made clear that reliance on generative AI does not change the standard applied to fabricated authorities.",
          "Quoting its earlier decisions, the court explained that submitting fictitious or fabricated case law may be sanctioned whether the error results from carelessness, misunderstanding, or reliance on generative artificial-intelligence tools.[5]",
          "This principle matters because AI hallucinations are sometimes described as though they were errors committed by the technology alone. But courts do not receive filings from software systems. They receive documents signed and submitted by litigants and attorneys.",
          "The person whose name appears on the filing remains responsible for confirming that the authorities exist, that the quotations are accurate, and that the cases support the argument being made.",
          "For lawyers, this responsibility is reinforced by professional duties concerning competence, candor to the tribunal, supervision, and the certification of court filings. An attorney who submits invented case law may face monetary sanctions, disciplinary proceedings, reputational harm, and consequences for the client.",
          "Self-represented litigants are not subject to bar discipline, but they are not exempt from procedural rules or judicial sanctions. Courts may strike filings, dismiss claims, award fees, impose monetary penalties, or restrict a litigant's ability to submit future documents without counsel.",
          "That difference partly explains the court's concern. Licensed attorneys operate within a professional disciplinary system. Pro se litigants do not. When repeated warnings are ineffective, a filing restriction may become one of the limited tools available to prevent continued abuse.",
        ],
      },
      {
        heading: "Better tools, not fewer users",
        paragraphs: [
          "The lesson from Gouldy should not be that self-represented litigants must be prevented from using generative AI.",
          "For people who cannot afford a lawyer, these tools may offer meaningful assistance. They can help users understand unfamiliar terminology, organize a chronology, identify relevant documents, prepare questions, and express their position more clearly.",
          "The real problem is the gap between general-purpose text generation and reliable legal assistance.",
          "A public chatbot is generally designed to produce an answer, even where the relevant legal information is uncertain, incomplete, or unavailable. A responsible legal tool should instead be capable of recognizing uncertainty, limiting unsupported conclusions, linking propositions to verifiable sources, distinguishing between jurisdictions, and warning users when human review is necessary.",
          "Better systems would not merely help users generate longer briefs. They would help them identify which facts matter, which arguments are legally available, which issues have been preserved, and which authorities can be independently verified.",
          "Courts may also need new forms of triage. Legal-aid organizations may need systems allowing lawyers to review AI-assisted filings before they are submitted. Developers may need to design products around the realities of legal procedure rather than the appearance of legal fluency.",
          "The goal should not be to make every litigant sound like a lawyer. It should be to help people understand what the legal system requires and when automated assistance is no longer sufficient.",
        ],
      },
      {
        heading: "The distance between appearance and substance",
        paragraphs: [
          "The July 22, 2026 decision in Gouldy v. Chiasson demonstrates the danger of confusing access to legal drafting with access to justice.",
          "Generative AI may make it easier to create a brief. It may make it easier to raise fifteen arguments instead of one. It may make a filing appear more professional than the litigant could have produced alone.",
          "But it cannot make an unpreserved argument preserved. It cannot make an irrelevant decision controlling. It cannot make an invented quotation real.",
          "And when the distance between appearance and substance becomes too great, the technology that seemed to open the courthouse door may ultimately help close it.",
        ],
      },
    ],
    references: [
      {
        label:
          "[1] Gouldy v. Chiasson, No. 4D2025-1289 (Fla. 4th DCA July 22, 2026).",
        href: "https://flcourts-media.flcourts.gov/content/download/2492735/opinion/Opinion_2025-1289.pdf",
        note: "Opinion of the Florida Fourth District Court of Appeal.",
      },
      {
        label:
          "[2] Barton v. McGovern, 302 So. 3d 1042 (Fla. 2d DCA 2020) — the nonexistent decision cited in the brief; the actual case is Barton v. McGovern, 504 So. 2d 457 (Fla. 1st DCA 1987).",
      },
      {
        label: "[3] Stockman v. Downs, 573 So. 2d 835 (Fla. 1991).",
        note: "Florida Supreme Court decision from which the brief quoted language that does not appear in it.",
      },
      {
        label:
          "[4] Generative AI, self-representation, and the distance between access to courts and access to justice.",
        href: "/research/generative-ai-access-to-justice-pro-se",
        note: "Earlier note on the federal civil filing data behind this distinction.",
      },
      {
        label:
          "[5] Eclectic Synergy, LLC v. Seredin, No. 4D2026-0781 (Fla. 4th DCA May 27, 2026), quoting Francois v. Vive Fin., LLC, 51 Fla. L. Weekly D500 (Fla. 4th DCA Mar. 18, 2026).",
      },
    ],
  },
  {
    slug: "ai-summaries-rule-1006-admissibility",
    title:
      "How AI-generated summaries could make their way into the courtroom under Federal Rule of Evidence 1006",
    subtitle:
      "AI-generated summaries may soon have a clearer path into evidence — provided the underlying records and the process behind them are properly handled.",
    author,
    status: "published",
    category: "AI Litigation",
    tags: [
      "Federal Rules of Evidence",
      "Rule 1006",
      "AI evidence",
      "Admissibility",
      "Litigation",
    ],
    jurisdiction: "United States / Federal",
    readingTime: "6 min read",
    summary:
      "A recent legal development explores how Federal Rule of Evidence 1006 could support the admissibility of AI-generated summaries, provided the underlying evidence is properly handled. If adopted by courts, it could significantly change how lawyers review and present large volumes of documents.",
    abstract:
      "AI-generated summaries may soon have a clearer path into the courtroom. The December 1, 2024 amendment to Federal Rule of Evidence 1006 clarified that summaries of voluminous records can be admitted as substantive evidence, provided the underlying evidence is properly handled. This note breaks down what this means, why it matters, and the safeguards that will still be required.",
    image: "/images/research/rule-1006-ai-summaries.png",
    publishedAt: "2026-07-20",
    relatedSlugs: [
      "generative-ai-access-to-justice-pro-se",
      "ai-legal-ethics-early-questions-lawyers",
      "white-collar-revolution-law-firms-ai",
    ],
    body: [
      {
        heading: "The problem: too many documents to review",
        paragraphs: [
          "Lawyers regularly deal with thousands of pages of financial records, rent ledgers, invoices, emails, medical records and other documents that cannot realistically be reviewed one by one during a trial.",
        ],
      },
      {
        heading: "What Rule 1006 allows",
        paragraphs: [
          "Federal Rule of Evidence 1006 provides a solution. It allows a party to present a summary, chart or calculation to prove the content of voluminous admissible records that cannot conveniently be examined in court.[1]",
          "Since December 1, 2024, the rule expressly states that these summaries may be admitted as evidence, even when the underlying documents have not themselves been introduced into evidence.[1]",
          "This clarification matters because a Rule 1006 summary is not merely a visual aid. When the proper foundation is established, the summary becomes substantive evidence that the judge or jury may rely on, a principle that federal courts of appeals had already recognized well before the amendment, which codified and clarified this line of case law rather than creating it.[2][3][4] The summary nonetheless remains subject to the Rule 403 balancing test, and may still be excluded where its probative value is substantially outweighed by a danger of unfair prejudice or of misleading the jury.[1]",
        ],
      },
      {
        heading: "Where artificial intelligence fits",
        paragraphs: [
          "This creates an interesting path for the use of artificial intelligence.",
          "An AI system could help extract information from thousands of documents, identify transactions, organize dates, calculate totals and produce a clear summary of the underlying evidence.",
          "But the fact that AI helped create the summary would not automatically make it admissible.",
        ],
      },
      {
        heading: "The safeguards that still apply",
        paragraphs: [
          "The underlying records must still be admissible. They must be made available to the opposing party, and the final summary must fairly and accurately reflect their contents.[1][3]",
          "The party offering the summary would also need to explain how it was created. This may require preserving the documents provided to the AI system, the prompts used, the model version, the generated output and the human verification process.[5]",
          "Most importantly, a lawyer or qualified witness should independently verify every figure and adopt the final summary as accurate. The safest approach is therefore not to present an unexplained AI output as evidence, but to present a human-reviewed Rule 1006 summary created with the assistance of AI.",
        ],
      },
      {
        heading: "A proposed Rule 707: revised and under further study, not adopted",
        paragraphs: [
          "A proposed Federal Rule of Evidence 707 could eventually introduce more specific reliability requirements for machine-generated evidence offered without an expert witness. After a public comment period that ran from August 15, 2025 to February 16, 2026 and drew more than 70 written comments, the Advisory Committee on Evidence Rules decided at its May 7, 2026 meeting not to recommend action on the proposal at that time. As stated in its May 17, 2026 report to the Standing Committee, the Committee instead revised the draft rule and plans to have it vetted by technology and AI-law experts at its Fall 2026 meeting, together with the separate question of “deepfake” evidence under a proposed Rule 901(c).[6][7]",
          "Even if a version of Rule 707 were eventually approved, it would not take effect before December 2028 at the earliest. For the foreseeable future, the existing rules therefore provide the operative framework.",
        ],
      },
      {
        heading: "Existing rules, carefully applied",
        paragraphs: [
          "AI can assist with the preparation of the evidence, but admissibility will continue to depend on the reliability of the process, the admissibility of the underlying records and the ability of a human witness to explain and verify the final result.",
          "The future of AI-generated evidence may therefore arrive not through a completely new evidentiary system, but through the careful application of rules that already exist.",
        ],
      },
    ],
    references: [
      {
        label:
          "[1] Federal Rule of Evidence 1006 and Advisory Committee Note to the 2024 amendment (Cornell LII).",
        href: "https://www.law.cornell.edu/rules/fre/rule_1006",
      },
      {
        label: "[2] United States v. Bray, 139 F.3d 1104 (6th Cir. 1998).",
      },
      {
        label: "[3] United States v. Janati, 374 F.3d 263 (4th Cir. 2004).",
      },
      {
        label: "[4] United States v. White, 737 F.3d 1121 (7th Cir. 2013).",
      },
      {
        label: "[5] Federal Rules of Evidence 803(6), 901(a) and 901(b)(9).",
      },
      {
        label:
          "[6] Advisory Committee on Evidence Rules, Report to the Standing Committee, May 17, 2026 (uscourts.gov).",
      },
      {
        label:
          "[7] Advisory Committee on Evidence Rules, Spring 2026 Agenda Book (uscourts.gov).",
      },
    ],
    translations: {
      fr: {
        title:
          "Comment les synthèses générées par IA pourraient entrer au prétoire sous la règle fédérale de preuve 1006",
        subtitle:
          "Les synthèses produites par IA disposent peut-être d'une voie plus claire vers la preuve, à condition que les pièces sous-jacentes et le processus soient correctement traités.",
        readingTime: "6 min de lecture",
        summary:
          "Une évolution récente explore comment la règle fédérale de preuve 1006 pourrait fonder la recevabilité de synthèses générées par IA, à condition que les pièces sous-jacentes soient correctement traitées. Si les juridictions la retiennent, elle pourrait changer nettement la façon dont les avocats examinent et présentent de gros volumes documentaires.",
        abstract:
          "Les synthèses générées par IA disposent peut-être d'une voie plus claire vers le prétoire. L'amendement du 1er décembre 2024 à la règle fédérale de preuve 1006 a précisé que les synthèses de pièces volumineuses peuvent être admises comme preuve au fond, à condition que les pièces sous-jacentes soient correctement traitées. Cette note explique ce que cela signifie, pourquoi c'est important, et les garanties qui resteront exigées.",
        body: [
          {
            heading: "Le problème : trop de pièces à examiner",
            paragraphs: [
              "Les avocats traitent couramment des milliers de pages de relevés financiers, de quittances de loyer, de factures, de courriels, de dossiers médicaux et d'autres documents qui ne peuvent raisonnablement être examinés un par un à l'audience.",
            ],
          },
          {
            heading: "Ce que permet la règle 1006",
            paragraphs: [
              "La règle fédérale de preuve 1006 apporte une solution. Elle permet à une partie de présenter une synthèse, un tableau ou un calcul pour établir le contenu de pièces recevables volumineuses qui ne peuvent commodément être examinées à l'audience.[1]",
              "Depuis le 1er décembre 2024, la règle prévoit expressément que ces synthèses peuvent être admises comme preuve, même lorsque les documents sous-jacents n'ont pas eux-mêmes été versés aux débats.[1]",
              "Cette clarification compte, car une synthèse fondée sur la règle 1006 n'est pas un simple support visuel. Lorsque le fondement approprié est établi, elle devient une preuve au fond sur laquelle le juge ou le jury peut s'appuyer, principe que les cours d'appel fédérales reconnaissaient déjà bien avant l'amendement, lequel a codifié et clarifié cette jurisprudence plutôt que de la créer.[2][3][4] La synthèse reste néanmoins soumise au test de mise en balance de la règle 403 et peut encore être écartée lorsque sa valeur probante est substantiellement contrebalancée par un risque de préjudice injuste ou d'induire le jury en erreur.[1]",
            ],
          },
          {
            heading: "Où l'intelligence artificielle s'insère",
            paragraphs: [
              "Cela ouvre une voie intéressante à l'usage de l'intelligence artificielle.",
              "Un système d'IA pourrait aider à extraire des informations de milliers de documents, à identifier des opérations, à ordonner des dates, à calculer des totaux et à produire une synthèse claire des pièces sous-jacentes.",
              "Mais le fait que l'IA ait contribué à créer la synthèse ne la rendrait pas automatiquement recevable.",
            ],
          },
          {
            heading: "Les garanties qui demeurent",
            paragraphs: [
              "Les pièces sous-jacentes doivent rester recevables. Elles doivent être mises à disposition de la partie adverse, et la synthèse finale doit refléter leur contenu de manière fidèle et exacte.[1][3]",
              "La partie qui produit la synthèse devra également expliquer comment elle a été élaborée. Cela peut supposer de conserver les documents fournis au système d'IA, les instructions utilisées, la version du modèle, le résultat produit et le processus de vérification humaine.[5]",
              "Surtout, un avocat ou un témoin qualifié devrait vérifier de façon indépendante chaque chiffre et assumer l'exactitude de la synthèse finale. L'approche la plus sûre n'est donc pas de présenter un résultat d'IA inexpliqué comme preuve, mais une synthèse fondée sur la règle 1006, relue par un humain et élaborée avec l'assistance de l'IA.",
            ],
          },
          {
            heading: "Une règle 707 proposée : révisée, à l'étude, non adoptée",
            paragraphs: [
              "Une proposition de règle fédérale de preuve 707 pourrait à terme introduire des exigences de fiabilité plus précises pour les preuves générées par machine produites sans témoin expert. À l'issue d'une période de consultation publique ouverte du 15 août 2025 au 16 février 2026, qui a recueilli plus de 70 observations écrites, le comité consultatif sur les règles de preuve a décidé lors de sa réunion du 7 mai 2026 de ne pas recommander de suite à la proposition à ce stade. Comme l'indique son rapport du 17 mai 2026 au comité permanent, le comité a préféré réviser le projet de règle et prévoit de le faire examiner par des experts en technologie et en droit de l'IA lors de sa réunion d'automne 2026, en même temps que la question distincte des preuves « hypertruquées » au titre d'une proposition de règle 901(c).[6][7]",
              "Même si une version de la règle 707 était finalement approuvée, elle n'entrerait pas en vigueur avant décembre 2028 au plus tôt. Dans un avenir prévisible, ce sont donc les règles existantes qui fournissent le cadre opérationnel.",
            ],
          },
          {
            heading: "Des règles existantes, appliquées avec soin",
            paragraphs: [
              "L'IA peut assister la préparation de la preuve, mais la recevabilité continuera de dépendre de la fiabilité du processus, de la recevabilité des pièces sous-jacentes et de la capacité d'un témoin humain à expliquer et vérifier le résultat final.",
              "L'avenir de la preuve générée par IA pourrait donc advenir non par un système probatoire entièrement nouveau, mais par l'application soigneuse de règles qui existent déjà.",
            ],
          },
        ],
      },
      es: {
        title:
          "Cómo los resúmenes generados por IA podrían llegar a la sala bajo la regla federal de prueba 1006",
        subtitle:
          "Los resúmenes producidos por IA quizá tengan una vía más clara hacia la prueba, siempre que los documentos subyacentes y el proceso se traten correctamente.",
        readingTime: "6 min de lectura",
        summary:
          "Un desarrollo reciente explora cómo la regla federal de prueba 1006 podría sustentar la admisibilidad de resúmenes generados por IA, siempre que los documentos subyacentes se traten correctamente. Si los tribunales la adoptan, podría cambiar de forma notable cómo los abogados revisan y presentan grandes volúmenes documentales.",
        abstract:
          "Los resúmenes generados por IA quizá tengan una vía más clara hacia la sala de audiencias. La reforma de 1 de diciembre de 2024 de la regla federal de prueba 1006 aclaró que los resúmenes de documentación voluminosa pueden admitirse como prueba de fondo, siempre que los documentos subyacentes se traten correctamente. Esta nota explica qué significa, por qué importa y las garantías que seguirán siendo exigibles.",
        body: [
          {
            heading: "El problema: demasiados documentos que revisar",
            paragraphs: [
              "Los abogados manejan habitualmente miles de páginas de registros financieros, libros de rentas, facturas, correos, historiales médicos y otros documentos que no pueden revisarse uno a uno durante un juicio.",
            ],
          },
          {
            heading: "Lo que permite la regla 1006",
            paragraphs: [
              "La regla federal de prueba 1006 ofrece una solución. Permite a una parte presentar un resumen, cuadro o cálculo para acreditar el contenido de documentos admisibles voluminosos que no pueden examinarse cómodamente en el tribunal.[1]",
              "Desde el 1 de diciembre de 2024, la regla establece expresamente que esos resúmenes pueden admitirse como prueba, incluso cuando los documentos subyacentes no se hayan incorporado a los autos.[1]",
              "Esta aclaración importa porque un resumen del artículo 1006 no es un simple apoyo visual. Cuando se establece el fundamento adecuado, se convierte en prueba de fondo en la que el juez o el jurado pueden basarse, un principio que los tribunales federales de apelación ya reconocían mucho antes de la reforma, que codificó y aclaró esa línea jurisprudencial en lugar de crearla.[2][3][4] El resumen sigue sujeto, no obstante, al test de ponderación de la regla 403, y puede excluirse cuando su valor probatorio se vea sustancialmente superado por el riesgo de perjuicio injusto o de inducir a error al jurado.[1]",
            ],
          },
          {
            heading: "Dónde encaja la inteligencia artificial",
            paragraphs: [
              "Esto abre una vía interesante para el uso de la inteligencia artificial.",
              "Un sistema de IA podría ayudar a extraer información de miles de documentos, identificar operaciones, ordenar fechas, calcular totales y producir un resumen claro de la prueba subyacente.",
              "Pero el hecho de que la IA haya contribuido a crear el resumen no lo haría automáticamente admisible.",
            ],
          },
          {
            heading: "Las garantías que siguen aplicándose",
            paragraphs: [
              "Los documentos subyacentes deben seguir siendo admisibles. Deben ponerse a disposición de la parte contraria, y el resumen final debe reflejar su contenido de forma fiel y exacta.[1][3]",
              "La parte que aporta el resumen tendrá además que explicar cómo se elaboró. Esto puede exigir conservar los documentos facilitados al sistema de IA, las instrucciones empleadas, la versión del modelo, el resultado generado y el proceso de verificación humana.[5]",
              "Sobre todo, un abogado o testigo cualificado debería verificar de forma independiente cada cifra y asumir la exactitud del resumen final. El enfoque más seguro no es, por tanto, presentar como prueba un resultado de IA sin explicación, sino un resumen del artículo 1006 revisado por una persona y elaborado con asistencia de IA.",
            ],
          },
          {
            heading: "Una regla 707 propuesta: revisada, en estudio, no adoptada",
            paragraphs: [
              "Una propuesta de regla federal de prueba 707 podría llegar a introducir requisitos de fiabilidad más específicos para la prueba generada por máquina aportada sin testigo perito. Tras un período de consulta pública abierto del 15 de agosto de 2025 al 16 de febrero de 2026, que recibió más de 70 observaciones escritas, el comité asesor sobre reglas de prueba decidió en su reunión de 7 de mayo de 2026 no recomendar actuación alguna sobre la propuesta en ese momento. Como señala su informe de 17 de mayo de 2026 al comité permanente, el comité optó por revisar el borrador de la regla y prevé someterlo al examen de expertos en tecnología y derecho de la IA en su reunión de otoño de 2026, junto con la cuestión separada de la prueba «deepfake» al amparo de una propuesta de regla 901(c).[6][7]",
              "Incluso si una versión de la regla 707 llegara a aprobarse, no entraría en vigor antes de diciembre de 2028 como muy pronto. En el futuro previsible, son por tanto las reglas existentes las que ofrecen el marco operativo.",
            ],
          },
          {
            heading: "Reglas existentes, aplicadas con cuidado",
            paragraphs: [
              "La IA puede asistir en la preparación de la prueba, pero la admisibilidad seguirá dependiendo de la fiabilidad del proceso, de la admisibilidad de los documentos subyacentes y de la capacidad de un testigo humano para explicar y verificar el resultado final.",
              "El futuro de la prueba generada por IA podría llegar, por tanto, no mediante un sistema probatorio enteramente nuevo, sino mediante la aplicación cuidadosa de reglas que ya existen.",
            ],
          },
        ],
      },
    },
  },
  {
    slug: "generative-ai-access-to-justice-pro-se",
    title:
      "Generative AI, self-representation, and the distance between access to courts and access to justice",
    subtitle:
      "A new study on 2.8 million federal civil filings suggests AI is helping more people reach the courthouse — without necessarily helping them prevail once inside.",
    author,
    status: "published",
    category: "Access to Justice",
    tags: [
      "Access to Justice",
      "Pro se litigation",
      "Generative AI",
      "Federal courts",
      "Legal aid",
    ],
    jurisdiction: "United States / Federal",
    readingTime: "5 min read",
    summary:
      "Generative AI may be lowering the barrier to entering the justice system, but a study of federal civil filings shows AI-assisted pro se complaints are more polished and yet more likely to be dismissed — raising the question of whether we are expanding access to justice or merely access to filing.",
    abstract:
      "Generative AI may be improving access to courts. But is it improving access to justice? A new paper analyzing roughly 2.8 million federal civil filings from 2008 to 2025 finds a sharp rise in self-representation and signs of AI-assisted drafting — yet no corresponding improvement in outcomes. Access to legal drafting is not the same as access to a legal remedy.",
    image: "/images/research/pro-se-generative-ai.png",
    publishedAt: "2026-07-19",
    relatedSlugs: [
      "white-collar-revolution-law-firms-ai",
      "ai-regulation-access-to-justice",
      "ai-legal-ethics-early-questions-lawyers",
    ],
    body: [
      {
        heading: "Access to courts is not access to justice",
        paragraphs: [
          "Generative AI may be improving access to courts. But is it improving access to justice?",
          "A new paper, The New Pro Se: Generative AI and the Surge in Federal Civil Self-Representation, analyzed approximately 2.8 million federal civil filings from 2008 to 2025.",
        ],
      },
      {
        heading: "The findings are striking",
        paragraphs: [
          "The data points to a measurable shift in both the volume and the appearance of self-represented litigation after generative AI became widely available.",
        ],
        bullets: [
          "The share of federal civil cases filed by self-represented plaintiffs increased from 11.33% before widespread GenAI access to 16.94% afterward — an increase of almost 50%.",
          "Among post-GenAI non-form complaints, approximately 13.9% showed drafting patterns consistent with AI assistance.",
          "Those complaints were generally more polished and contained more legal citations.",
        ],
      },
      {
        heading: "Better-looking pleadings did not produce better outcomes",
        paragraphs: [
          "AI-flagged complaints had a higher dismissal rate — 61.1% compared with 53.6% — were more likely to end at an early procedural stage, and showed no advantage in win rates.",
          "This highlights a critical distinction: access to legal drafting is not the same as access to a legal remedy.",
        ],
      },
      {
        heading: "What AI can and cannot do",
        paragraphs: [
          "Generative AI can help someone organize their story, identify legal concepts, and produce a document that looks like a formal complaint.",
          "But it cannot automatically create jurisdiction, establish sufficient facts, preserve a claim within the statute of limitations, produce admissible evidence, or transform a genuine grievance into a legally viable cause of action.",
          "The study does not prove that GenAI caused the increase in self-representation. However, it provides significant evidence that the rise of public AI tools is associated with changes in both the volume and appearance of pro se litigation.",
        ],
      },
      {
        heading: "An opportunity and an institutional challenge",
        paragraphs: [
          "For individuals who cannot afford a lawyer, AI may make the courthouse more accessible. For courts, however, increasingly polished but legally deficient filings may require more time to review, understand, and dismiss.",
          "The solution should not be to prevent self-represented litigants from using AI. It should be to develop better guided tools, stronger legal-aid systems, effective court triage, and meaningful opportunities for human legal review.",
        ],
      },
      {
        heading: "Access to filing, or access to justice?",
        paragraphs: [
          "AI may be lowering the barrier to entering the justice system. The next challenge is ensuring that it also helps people navigate that system effectively.",
          "Are we expanding access to justice — or merely access to filing?",
        ],
      },
    ],
    references: [
      {
        label:
          "Or Cohen-Sasson, The New Pro Se: Generative AI and the Surge in Federal Civil Self-Representation (arXiv, 2026)",
        href: "https://arxiv.org/abs/2605.29493",
        note: "Study analyzing ~2.8 million federal civil filings (2008–2025).",
      },
    ],
    translations: {
      fr: {
        title:
          "IA générative, auto-représentation, et la distance entre l'accès au juge et l'accès à la justice",
        subtitle:
          "Une nouvelle étude portant sur 2,8 millions de dossiers civils fédéraux suggère que l'IA aide davantage de personnes à saisir le tribunal, sans nécessairement les aider à obtenir gain de cause.",
        readingTime: "5 min de lecture",
        summary:
          "L'IA générative abaisse peut-être la barrière d'entrée dans le système judiciaire, mais une étude des dossiers civils fédéraux montre que les requêtes sans avocat assistées par IA sont plus soignées et pourtant plus souvent rejetées, ce qui pose la question : élargit-on l'accès à la justice, ou seulement l'accès au dépôt ?",
        abstract:
          "L'IA générative améliore peut-être l'accès au juge. Mais améliore-t-elle l'accès à la justice ? Une étude analysant environ 2,8 millions de dossiers civils fédéraux de 2008 à 2025 constate une forte hausse de l'auto-représentation et des signes de rédaction assistée par IA, sans amélioration correspondante des résultats. L'accès à la rédaction juridique n'est pas l'accès à un remède juridique.",
        body: [
          {
            heading: "L'accès au juge n'est pas l'accès à la justice",
            paragraphs: [
              "L'IA générative améliore peut-être l'accès au juge. Mais améliore-t-elle l'accès à la justice ?",
              "Une nouvelle étude, The New Pro Se: Generative AI and the Surge in Federal Civil Self-Representation, a analysé environ 2,8 millions de dossiers civils fédéraux de 2008 à 2025.",
            ],
          },
          {
            heading: "Des résultats frappants",
            paragraphs: [
              "Les données révèlent une évolution mesurable, à la fois du volume et de l'apparence des contentieux sans avocat, après la diffusion large de l'IA générative.",
            ],
            bullets: [
              "La part des affaires civiles fédérales introduites par des demandeurs sans avocat est passée de 11,33 % avant l'accès généralisé à l'IA générative à 16,94 % ensuite, soit une hausse de près de 50 %.",
              "Parmi les requêtes non standardisées postérieures à l'IA générative, environ 13,9 % présentaient des schémas de rédaction compatibles avec une assistance par IA.",
              "Ces requêtes étaient généralement plus soignées et comportaient davantage de citations juridiques.",
            ],
          },
          {
            heading: "Des écritures plus soignées, mais pas de meilleurs résultats",
            paragraphs: [
              "Les requêtes signalées comme assistées par IA affichaient un taux de rejet plus élevé, 61,1 % contre 53,6 %, se terminaient plus souvent à un stade procédural précoce, et ne présentaient aucun avantage en taux de succès.",
              "Cela met en lumière une distinction essentielle : l'accès à la rédaction juridique n'est pas l'accès à un remède juridique.",
            ],
          },
          {
            heading: "Ce que l'IA peut et ne peut pas faire",
            paragraphs: [
              "L'IA générative peut aider quelqu'un à organiser son récit, à identifier des notions juridiques et à produire un document qui ressemble à une requête formelle.",
              "Mais elle ne peut pas créer automatiquement une compétence juridictionnelle, établir des faits suffisants, préserver une action dans le délai de prescription, produire des preuves recevables, ni transformer un grief réel en cause d'action juridiquement viable.",
              "L'étude ne démontre pas que l'IA générative a causé la hausse de l'auto-représentation. Elle fournit toutefois des indices sérieux que la diffusion des outils d'IA grand public est associée à des changements, tant dans le volume que dans l'apparence des contentieux sans avocat.",
            ],
          },
          {
            heading: "Une opportunité et un défi institutionnel",
            paragraphs: [
              "Pour les personnes qui ne peuvent pas s'offrir un avocat, l'IA peut rendre le tribunal plus accessible. Pour les juridictions, en revanche, des écritures de plus en plus soignées mais juridiquement défaillantes peuvent exiger plus de temps pour être examinées, comprises et rejetées.",
              "La solution ne devrait pas être d'empêcher les justiciables sans avocat d'utiliser l'IA. Elle devrait être de développer de meilleurs outils guidés, des systèmes d'aide juridictionnelle renforcés, un triage judiciaire efficace et de véritables possibilités de relecture juridique humaine.",
            ],
          },
          {
            heading: "Accès au dépôt, ou accès à la justice ?",
            paragraphs: [
              "L'IA abaisse peut-être la barrière d'entrée dans le système judiciaire. Le défi suivant est de faire en sorte qu'elle aide aussi les gens à y naviguer efficacement.",
              "Élargissons-nous l'accès à la justice, ou seulement l'accès au dépôt ?",
            ],
          },
        ],
      },
      es: {
        title:
          "IA generativa, autorrepresentación y la distancia entre el acceso a los tribunales y el acceso a la justicia",
        subtitle:
          "Un nuevo estudio sobre 2,8 millones de expedientes civiles federales sugiere que la IA ayuda a más personas a llegar al tribunal, sin ayudarlas necesariamente a ganar una vez dentro.",
        readingTime: "5 min de lectura",
        summary:
          "La IA generativa quizá esté rebajando la barrera de entrada al sistema judicial, pero un estudio de expedientes civiles federales muestra que las demandas sin abogado asistidas por IA están más pulidas y aun así se desestiman más, lo que plantea la pregunta: ¿ampliamos el acceso a la justicia o solo el acceso a presentar demandas?",
        abstract:
          "La IA generativa quizá esté mejorando el acceso a los tribunales. ¿Pero mejora el acceso a la justicia? Un estudio que analiza unos 2,8 millones de expedientes civiles federales de 2008 a 2025 detecta un fuerte aumento de la autorrepresentación y señales de redacción asistida por IA, sin una mejora correspondiente en los resultados. El acceso a la redacción jurídica no es el acceso a un remedio jurídico.",
        body: [
          {
            heading: "El acceso a los tribunales no es el acceso a la justicia",
            paragraphs: [
              "La IA generativa quizá esté mejorando el acceso a los tribunales. ¿Pero mejora el acceso a la justicia?",
              "Un nuevo estudio, The New Pro Se: Generative AI and the Surge in Federal Civil Self-Representation, analizó unos 2,8 millones de expedientes civiles federales de 2008 a 2025.",
            ],
          },
          {
            heading: "Los resultados son llamativos",
            paragraphs: [
              "Los datos apuntan a un cambio medible, tanto en el volumen como en la apariencia de los litigios sin abogado, tras la disponibilidad generalizada de la IA generativa.",
            ],
            bullets: [
              "La proporción de asuntos civiles federales presentados por demandantes sin abogado pasó del 11,33 % antes del acceso generalizado a la IA generativa al 16,94 % después, un aumento de casi el 50 %.",
              "Entre las demandas no formularias posteriores a la IA generativa, alrededor del 13,9 % mostraban patrones de redacción compatibles con asistencia de IA.",
              "Esas demandas solían estar más pulidas y contenían más citas jurídicas.",
            ],
          },
          {
            heading: "Escritos más pulidos no dieron mejores resultados",
            paragraphs: [
              "Las demandas señaladas como asistidas por IA tuvieron una tasa de desestimación mayor, 61,1 % frente al 53,6 %, terminaron con más frecuencia en una fase procesal temprana y no mostraron ventaja alguna en la tasa de éxito.",
              "Esto pone de relieve una distinción esencial: el acceso a la redacción jurídica no es el acceso a un remedio jurídico.",
            ],
          },
          {
            heading: "Lo que la IA puede y no puede hacer",
            paragraphs: [
              "La IA generativa puede ayudar a alguien a ordenar su relato, identificar conceptos jurídicos y producir un documento que parece una demanda formal.",
              "Pero no puede crear automáticamente competencia judicial, establecer hechos suficientes, preservar una acción dentro del plazo de prescripción, producir pruebas admisibles ni transformar un agravio real en una causa de acción jurídicamente viable.",
              "El estudio no demuestra que la IA generativa haya causado el aumento de la autorrepresentación. Sí aporta, en cambio, indicios sólidos de que la difusión de las herramientas de IA de uso público está asociada a cambios, tanto en el volumen como en la apariencia de los litigios sin abogado.",
            ],
          },
          {
            heading: "Una oportunidad y un desafío institucional",
            paragraphs: [
              "Para quienes no pueden pagar un abogado, la IA puede hacer el tribunal más accesible. Para los tribunales, en cambio, escritos cada vez más pulidos pero jurídicamente deficientes pueden exigir más tiempo para revisarse, entenderse y desestimarse.",
              "La solución no debería ser impedir que los litigantes sin abogado usen IA. Debería ser desarrollar mejores herramientas guiadas, sistemas de asistencia jurídica más sólidos, un triaje judicial eficaz y oportunidades reales de revisión jurídica humana.",
            ],
          },
          {
            heading: "¿Acceso a presentar demandas o acceso a la justicia?",
            paragraphs: [
              "La IA quizá esté rebajando la barrera de entrada al sistema judicial. El siguiente desafío es lograr que también ayude a las personas a navegarlo con eficacia.",
              "¿Estamos ampliando el acceso a la justicia, o solo el acceso a presentar demandas?",
            ],
          },
        ],
      },
    },
  },
  {
    slug: "white-collar-revolution-law-firms-ai",
    title:
      "The white collar revolution: the transformation of law firms in the age of artificial intelligence",
    subtitle:
      "Why the shift from a labor-based model to a system-based model is reshaping the economics, organization, and role of the modern law firm.",
    author,
    status: "published",
    category: "Legal Technology",
    tags: [
      "Law firms",
      "Legal technology",
      "Billable hour",
      "AI automation",
      "Legal industry",
    ],
    jurisdiction: "General / cross-jurisdictional",
    readingTime: "10 min read",
    summary:
      "How large language models are not just accelerating legal work but disrupting the economic foundations of legal practice — and pushing firms from labor-driven services toward system-driven value.",
    abstract:
      "For decades, law firms have operated under a model that appeared both stable and self reinforcing. Artificial intelligence, particularly large language models, is not simply accelerating legal work — it is changing the nature of that work, and with it the economic foundations of legal practice.",
    image: "/images/research/white-collar-revolution.png",
    publishedAt: "2026-07-16",
    relatedSlugs: [
      "emerging-architecture-ai-regulation",
      "legal-intelligence-systems-future-regulatory-monitoring",
      "why-soft-law-matters-ai-compliance",
    ],
    translations: {
      fr: {
        title:
          "La révolution des cols blancs : la transformation des cabinets d'avocats à l'ère de l'intelligence artificielle",
        subtitle:
          "Pourquoi le passage d'un modèle fondé sur le travail à un modèle fondé sur les systèmes redessine l'économie, l'organisation et le rôle du cabinet moderne.",
        readingTime: "10 min de lecture",
        summary:
          "Comment les grands modèles de langage ne se contentent pas d'accélérer le travail juridique, mais bouleversent les fondations économiques de la pratique du droit, poussant les cabinets d'une prestation fondée sur la main-d'œuvre vers une valeur fondée sur les systèmes.",
        abstract:
          "Pendant des décennies, les cabinets d'avocats ont fonctionné selon un modèle qui paraissait à la fois stable et auto-entretenu. L'intelligence artificielle, en particulier les grands modèles de langage, n'accélère pas simplement le travail juridique : elle en change la nature, et avec elle les fondations économiques de la pratique du droit.",
        body: [
          {
            heading: "La fin d'un modèle auto-entretenu",
            paragraphs: [
              "Pendant des décennies, les cabinets d'avocats ont fonctionné selon un modèle qui paraissait à la fois stable et auto-entretenu. Ils attiraient les meilleurs diplômés, les formaient par apprentissage et monétisaient leur expertise en heures facturables. Le prestige, l'expérience et la réputation institutionnelle servaient d'indicateurs de qualité. Cette structure s'est révélée remarquablement résiliente, mais elle est de plus en plus décalée par rapport à la réalité technologique qui émerge aujourd'hui.",
              "L'intelligence artificielle, en particulier les grands modèles de langage, n'accélère pas simplement le travail juridique. Elle en change la nature. Des tâches qui exigeaient autrefois un effort humain considérable, comme la revue documentaire, la recherche juridique, la rédaction de contrats et même certains éléments du raisonnement juridique, peuvent désormais être partiellement ou largement automatisées. Le résultat n'est pas seulement un gain de productivité, mais un bouleversement des fondations économiques de la pratique du droit.",
            ],
          },
          {
            heading: "L'heure facturable sous pression",
            paragraphs: [
              "L'heure facturable, longtemps considérée comme la colonne vertébrale du chiffre d'affaires des cabinets, devient difficile à soutenir dans un contexte où le temps n'est plus la contrainte principale. Lorsqu'une tâche qui demandait dix heures peut être accomplie en quelques minutes, facturer l'effort plutôt que le résultat crée une tension entre efficacité et revenus. Les cabinets font face à une contradiction structurelle : plus ils adoptent l'IA pour gagner en efficacité, plus ils érodent la mesure même par laquelle ils génèrent leurs revenus.",
            ],
          },
          {
            heading: "De la prestation par le travail à la valeur par les systèmes",
            paragraphs: [
              "Cette tension pousse le secteur juridique vers un nouveau modèle. Un nombre croissant de cabinets s'éloignent de services purement fondés sur la main-d'œuvre pour aller vers une création de valeur fondée sur les systèmes. Ces organisations associent avocats, ingénieurs et spécialistes de l'IA, et investissent dans des outils et des flux de travail qui transforment les processus juridiques en systèmes reproductibles et industrialisables. Plutôt que de s'appuyer uniquement sur l'expertise humaine, elles inscrivent cette expertise dans une technologie qui peut être réutilisée, affinée et déployée sur de nombreux dossiers.",
            ],
          },
          {
            heading: "Comment se redéfinit la qualité juridique",
            paragraphs: [
              "Ce basculement modifie aussi la façon dont la qualité juridique est définie et perçue. Historiquement, les clients se fiaient à la réputation, aux titres et à la marque du cabinet comme indicateurs de compétence. Or, à mesure que l'IA permet de mesurer et de comparer les résultats, la qualité devient plus transparente et plus comparable. Un travail juridique autrefois évalué de façon subjective peut de plus en plus l'être selon des critères structurés, des cadres de test et une performance empirique. Avec le temps, cela pourrait conduire les clients à privilégier des résultats démontrables plutôt que le prestige institutionnel.",
            ],
          },
          {
            heading: "Les structures d'associés et le problème des incitations",
            paragraphs: [
              "Les implications pour l'organisation des cabinets sont importantes. Les structures d'association traditionnelles sont conçues pour maximiser la distribution de profits à court terme plutôt que l'investissement de long terme. Les associés sont incités à générer du revenu sur l'exercice en cours, ce qui limite la volonté de consacrer du temps et des ressources à l'expérimentation, à la recherche et à la construction de systèmes. À l'inverse, les cabinets qui adoptent une approche plus corporate, ou dont la structure favorise le réinvestissement, sont mieux placés pour développer des technologies propriétaires et capter les gains de long terme de l'automatisation.",
            ],
          },
          {
            heading: "Le rôle de l'avocat en évolution",
            paragraphs: [
              "Dans le même temps, le rôle de l'avocat évolue. L'intelligence artificielle est particulièrement efficace pour traiter de grands volumes de texte, identifier des schémas et exécuter des tâches structurées. Ces capacités recoupent directement de nombreuses fonctions juridiques centrales. Elles n'éliminent pas pour autant le besoin de jugement humain. La décision stratégique, la négociation, le conseil au client et les considérations déontologiques restent des domaines profondément humains. Le défi des cabinets modernes n'est donc pas de remplacer les avocats, mais de redéfinir leur rôle. Les avocats agissent de plus en plus comme superviseurs de systèmes, concepteurs de flux de travail et interprètes de résultats, plutôt que comme seuls producteurs du travail juridique.",
            ],
          },
          {
            heading: "De nouvelles dynamiques concurrentielles",
            paragraphs: [
              "Cette transformation introduit aussi de nouvelles dynamiques concurrentielles. Les barrières à l'entrée dans certains domaines de la pratique commencent à se déplacer. Des organisations plus petites, portées par la technologie, peuvent délivrer des services de grande qualité sans le même volume de capital humain, en s'appuyant sur des systèmes pour atteindre efficacité et régularité. Cela met sous pression les cabinets établis, en particulier là où le travail peut être standardisé et automatisé. Parallèlement, l'expertise d'élite peut devenir encore plus précieuse lorsqu'elle est combinée à la technologie, un seul avocat très qualifié pouvant être démultiplié par un réseau de processus automatisés.",
            ],
          },
          {
            heading: "Des attentes clients qui montent",
            paragraphs: [
              "Les attentes des clients évoluent en conséquence. À mesure que des solutions plus rapides et plus économiques deviennent disponibles, les clients exigeront davantage de transparence, de prévisibilité et d'efficacité. Ils attendront non seulement un conseil juridique exact, mais aussi une livraison dans les délais, une tarification claire et des résultats mesurables. Dans cet environnement, les cabinets qui continuent de s'appuyer uniquement sur les méthodes traditionnelles risquent d'être perçus comme inefficaces ou dépassés.",
            ],
          },
          {
            heading: "Quand les cabinets deviennent créateurs de technologie",
            paragraphs: [
              "La convergence du logiciel et des services juridiques accélère encore ce mouvement. Les cabinets ne sont plus seulement consommateurs de technologie. Ils en deviennent de plus en plus créateurs. En construisant des outils internes, en développant des systèmes d'IA spécialisés et en les intégrant à leurs flux de travail, ils peuvent se différencier et bâtir des avantages défendables. Avec le temps, la distinction entre un cabinet d'avocats et une société de technologie juridique pourrait devenir de plus en plus floue.",
            ],
          },
          {
            heading: "Une adoption inégale mais inévitable",
            paragraphs: [
              "Malgré ces évolutions, l'adoption reste inégale. La profession juridique est par nature conservatrice, avec un fort accent sur la maîtrise du risque et la fiabilité. Cela peut ralentir l'intégration de nouvelles technologies, en particulier dans les dossiers à fort enjeu. La trajectoire est néanmoins claire. À mesure que les capacités de l'IA progressent et que les premiers adoptants démontrent des bénéfices tangibles, la pression à s'adapter s'intensifiera.",
            ],
          },
          {
            heading: "Une restructuration, pas une disparition",
            paragraphs: [
              "La transformation des cabinets n'est donc pas une question de « si », mais de « à quelle vitesse » et « jusqu'où ». Les cabinets qui reconnaissent la nécessité de passer d'un modèle fondé sur le travail à un modèle fondé sur les systèmes seront mieux placés pour négocier cette transition. Ceux qui investissent dans la construction, la mesure et l'amélioration continue de leurs processus pourront délivrer plus de valeur avec moins de ressources.",
              "Dans ce paysage émergent, l'avantage décisif ne tiendra pas seulement à la qualité des avocats pris individuellement, mais à la qualité des systèmes qui les soutiennent. Les cabinets qui réussiront seront ceux qui sauront inscrire l'expertise dans des processus industrialisables, articuler le jugement humain et la capacité des machines, et aligner leurs incitations économiques sur cette nouvelle réalité. La pratique du droit ne disparaît pas, mais elle est profondément restructurée.",
            ],
          },
        ],
      },
      es: {
        title:
          "La revolución de los cuellos blancos: la transformación de los despachos de abogados en la era de la inteligencia artificial",
        subtitle:
          "Por qué el paso de un modelo basado en el trabajo a un modelo basado en sistemas está rediseñando la economía, la organización y el papel del despacho moderno.",
        readingTime: "10 min de lectura",
        summary:
          "Cómo los grandes modelos de lenguaje no solo aceleran el trabajo jurídico, sino que alteran los cimientos económicos del ejercicio del derecho, empujando a los despachos de un servicio basado en la mano de obra hacia un valor basado en sistemas.",
        abstract:
          "Durante décadas, los despachos de abogados han operado bajo un modelo que parecía estable y autosostenido. La inteligencia artificial, y en particular los grandes modelos de lenguaje, no se limita a acelerar el trabajo jurídico: cambia su naturaleza y, con ella, los cimientos económicos del ejercicio del derecho.",
        body: [
          {
            heading: "El fin de un modelo autosostenido",
            paragraphs: [
              "Durante décadas, los despachos de abogados han operado bajo un modelo que parecía estable y autosostenido. Atraían a los mejores titulados, los formaban mediante aprendizaje y monetizaban su experiencia en horas facturables. El prestigio, la experiencia y la reputación institucional servían como indicadores de calidad. Esa estructura ha demostrado ser notablemente resistente, pero está cada vez más desalineada con la realidad tecnológica que emerge hoy.",
              "La inteligencia artificial, y en particular los grandes modelos de lenguaje, no se limita a acelerar el trabajo jurídico. Cambia su naturaleza. Tareas que antes exigían un esfuerzo humano considerable, como la revisión documental, la investigación jurídica, la redacción de contratos e incluso elementos del razonamiento jurídico, pueden ahora automatizarse parcial o sustancialmente. El resultado no es solo una ganancia de productividad, sino una alteración de los cimientos económicos del ejercicio del derecho.",
            ],
          },
          {
            heading: "La hora facturable bajo presión",
            paragraphs: [
              "La hora facturable, considerada durante mucho tiempo la columna vertebral de los ingresos de los despachos, resulta difícil de sostener en un contexto en el que el tiempo ya no es la principal restricción. Cuando una tarea que antes requería diez horas puede completarse en minutos, facturar por esfuerzo en lugar de por resultado genera tensión entre eficiencia e ingresos. Los despachos afrontan una contradicción estructural: cuanta más IA adoptan para ganar eficiencia, más erosionan la métrica misma con la que generan ingresos.",
            ],
          },
          {
            heading: "Del servicio por trabajo al valor por sistemas",
            paragraphs: [
              "Esa tensión empuja al sector jurídico hacia un nuevo modelo. Un número creciente de despachos se aleja de servicios puramente basados en la mano de obra para avanzar hacia una creación de valor basada en sistemas. Estas organizaciones integran abogados con ingenieros y especialistas en IA, e invierten en herramientas y flujos de trabajo que convierten los procesos jurídicos en sistemas repetibles y escalables. En lugar de depender solo de la experiencia humana, incorporan esa experiencia en tecnología que puede reutilizarse, refinarse y desplegarse en múltiples asuntos.",
            ],
          },
          {
            heading: "Cómo se redefine la calidad jurídica",
            paragraphs: [
              "Este cambio altera también cómo se define y percibe la calidad jurídica. Históricamente, los clientes se apoyaban en la reputación, las credenciales y la marca del despacho como indicadores de competencia. Sin embargo, a medida que la IA permite medir y comparar resultados, la calidad se vuelve más transparente y más comparable. Un trabajo jurídico antes evaluado de forma subjetiva puede valorarse cada vez más mediante criterios estructurados, marcos de prueba y rendimiento empírico. Con el tiempo, esto puede llevar a los clientes a priorizar resultados demostrables sobre el prestigio institucional.",
            ],
          },
          {
            heading: "Las estructuras de socios y el problema de los incentivos",
            paragraphs: [
              "Las implicaciones para la organización de los despachos son significativas. Las estructuras societarias tradicionales están diseñadas para maximizar el reparto de beneficios a corto plazo más que la inversión a largo plazo. Los socios tienen incentivos para generar ingresos dentro del ejercicio en curso, lo que limita la disposición a destinar tiempo y recursos a la experimentación, la investigación y la construcción de sistemas. En cambio, los despachos que adoptan un enfoque más corporativo, o cuya estructura favorece la reinversión, están mejor situados para desarrollar tecnologías propias y capturar las ganancias a largo plazo de la automatización.",
            ],
          },
          {
            heading: "El papel cambiante del abogado",
            paragraphs: [
              "Al mismo tiempo, el papel del abogado evoluciona. La inteligencia artificial es especialmente eficaz para manejar grandes volúmenes de texto, identificar patrones y ejecutar tareas estructuradas. Esas capacidades se solapan directamente con muchas funciones jurídicas centrales. No eliminan, sin embargo, la necesidad de juicio humano. La decisión estratégica, la negociación, el asesoramiento al cliente y las consideraciones deontológicas siguen siendo ámbitos profundamente humanos. El reto de los despachos modernos no es, por tanto, sustituir a los abogados, sino redefinir su papel. Los abogados actúan cada vez más como supervisores de sistemas, diseñadores de flujos de trabajo e intérpretes de resultados, más que como únicos productores del trabajo jurídico.",
            ],
          },
          {
            heading: "Nuevas dinámicas competitivas",
            paragraphs: [
              "Esta transformación introduce también nuevas dinámicas competitivas. Las barreras de entrada en ciertas áreas del ejercicio empiezan a desplazarse. Organizaciones más pequeñas e impulsadas por la tecnología pueden prestar servicios de alta calidad sin la misma escala de capital humano, apoyándose en sistemas para lograr eficiencia y consistencia. Esto presiona a los despachos establecidos, sobre todo donde el trabajo puede estandarizarse y automatizarse. Al mismo tiempo, la experiencia de élite puede volverse aún más valiosa combinada con tecnología, ya que un solo abogado altamente cualificado puede amplificarse mediante una red de procesos automatizados.",
            ],
          },
          {
            heading: "Expectativas crecientes de los clientes",
            paragraphs: [
              "Las expectativas de los clientes evolucionan en consecuencia. A medida que aparezcan soluciones más rápidas y económicas, los clientes exigirán mayor transparencia, previsibilidad y eficiencia. Esperarán no solo un asesoramiento jurídico exacto, sino también entrega puntual, precios claros y resultados medibles. En ese entorno, los despachos que sigan apoyándose únicamente en métodos tradicionales corren el riesgo de ser percibidos como ineficientes o desfasados.",
            ],
          },
          {
            heading: "Cuando los despachos se vuelven creadores de tecnología",
            paragraphs: [
              "La convergencia entre software y servicios jurídicos acelera aún más este cambio. Los despachos ya no son solo consumidores de tecnología. Cada vez más, se convierten en creadores. Construyendo herramientas internas, desarrollando sistemas de IA especializados e integrándolos en sus flujos de trabajo, pueden diferenciarse y crear ventajas defendibles. Con el tiempo, la distinción entre un despacho de abogados y una empresa de tecnología jurídica podría difuminarse cada vez más.",
            ],
          },
          {
            heading: "Una adopción desigual pero inevitable",
            paragraphs: [
              "Pese a estos cambios, la adopción sigue siendo desigual. La profesión jurídica es intrínsecamente conservadora, con un fuerte énfasis en la mitigación del riesgo y la fiabilidad. Esto puede frenar la integración de nuevas tecnologías, sobre todo en contextos de alto riesgo. La trayectoria, sin embargo, es clara. A medida que las capacidades de la IA mejoren y los primeros adoptantes demuestren beneficios tangibles, la presión para adaptarse se intensificará.",
            ],
          },
          {
            heading: "Una reestructuración, no una desaparición",
            paragraphs: [
              "La transformación de los despachos no es, por tanto, una cuestión de «si», sino de «con qué rapidez» y «hasta qué punto». Los despachos que reconozcan la necesidad de pasar de un modelo basado en el trabajo a uno basado en sistemas estarán mejor situados para afrontar esa transición. Los que inviertan en construir, medir y mejorar continuamente sus procesos podrán ofrecer más valor con menos recursos.",
              "En este panorama emergente, la ventaja decisiva no residirá solo en la calidad de los abogados individuales, sino en la calidad de los sistemas que los sostienen. Los despachos que triunfen serán los que sepan codificar la experiencia en procesos escalables, integrar el juicio humano con la capacidad de las máquinas y alinear sus incentivos económicos con esta nueva realidad. El ejercicio del derecho no desaparece, pero está siendo reestructurado de raíz.",
            ],
          },
        ],
      },
    },
    body: [
      {
        heading: "The end of a self-reinforcing model",
        paragraphs: [
          "For decades, law firms have operated under a model that appeared both stable and self reinforcing. They attracted top graduates, trained them through apprenticeship, and monetized their expertise through billable hours. Prestige, experience, and institutional reputation served as proxies for quality. This structure has proven remarkably resilient, but it is increasingly misaligned with the technological reality emerging today.",
          "Artificial intelligence, particularly large language models, is not simply accelerating legal work. It is changing the nature of that work. Tasks that once required extensive human effort such as document review, legal research, contract drafting, and even elements of legal reasoning can now be partially or substantially automated. The result is not just a gain in productivity, but a disruption of the economic foundations of legal practice.",
        ],
      },
      {
        heading: "The billable hour under pressure",
        paragraphs: [
          "The billable hour, long considered the backbone of law firm revenue, becomes difficult to sustain in a context where time is no longer the primary constraint. When a task that previously required ten hours can be completed in minutes, billing based on effort rather than outcome creates tension between efficiency and revenue. Firms are faced with a structural contradiction. The more they adopt AI to improve efficiency, the more they undermine the very metric through which they generate income.",
        ],
      },
      {
        heading: "From labor-driven services to system-driven value",
        paragraphs: [
          "This tension is pushing the legal industry toward a new model. A growing number of firms are beginning to move away from purely labor driven services toward system driven value creation. These organizations integrate lawyers with engineers and AI specialists, investing in tools and workflows that transform legal processes into repeatable, scalable systems. Instead of relying solely on human expertise, they embed that expertise into technology that can be reused, refined, and deployed across multiple matters.",
        ],
      },
      {
        heading: "How legal quality gets redefined",
        paragraphs: [
          "This shift also alters how legal quality is defined and perceived. Historically, clients have relied on reputation, credentials, and firm brand as indicators of competence. However, as AI enables the measurement and benchmarking of outputs, quality becomes more transparent and more comparable. Legal work that was once evaluated subjectively can increasingly be assessed through structured criteria, testing frameworks, and empirical performance. Over time, this may lead clients to prioritize demonstrable outcomes over institutional prestige.",
        ],
      },
      {
        heading: "Partnership structures and the incentive problem",
        paragraphs: [
          "The implications for law firm organization are significant. Traditional partnership structures are designed to maximize short term profit distribution rather than long term investment. Partners are incentivized to generate revenue within the current fiscal year, which limits the willingness to allocate time and resources to experimentation, research, and system building. By contrast, firms that adopt a more corporate approach, or that are structured to support reinvestment, are better positioned to develop proprietary technologies and capture long term gains from automation.",
        ],
      },
      {
        heading: "The evolving role of the lawyer",
        paragraphs: [
          "At the same time, the role of the lawyer is evolving. Artificial intelligence is particularly effective at handling large volumes of text, identifying patterns, and executing structured tasks. These capabilities overlap directly with many core legal functions. However, they do not eliminate the need for human judgment. Strategic decision making, negotiation, client counseling, and ethical considerations remain deeply human domains. The challenge for modern law firms is therefore not to replace lawyers, but to redefine their role. Lawyers increasingly act as supervisors of systems, designers of workflows, and interpreters of outputs rather than sole producers of legal work.",
        ],
      },
      {
        heading: "New competitive dynamics",
        paragraphs: [
          "This transformation also introduces new competitive dynamics. The barriers to entry in certain areas of legal practice are beginning to shift. Smaller, technology driven organizations can deliver high quality services without the same scale of human capital, leveraging systems to achieve efficiency and consistency. This creates pressure on established firms, particularly in areas where work can be standardized and automated. At the same time, elite expertise may become even more valuable when combined with technology, as a single highly skilled lawyer can be amplified by a network of automated processes.",
        ],
      },
      {
        heading: "Rising client expectations",
        paragraphs: [
          "Client expectations are evolving accordingly. As faster and more cost effective solutions become available, clients will demand greater transparency, predictability, and efficiency. They will expect not only accurate legal advice but also timely delivery, clear pricing, and measurable outcomes. In this environment, firms that continue to rely solely on traditional methods risk being perceived as inefficient or outdated.",
        ],
      },
      {
        heading: "When law firms become technology creators",
        paragraphs: [
          "The convergence of software and legal services further accelerates this shift. Law firms are no longer just consumers of technology. Increasingly, they are becoming creators of it. By building internal tools, developing specialized AI systems, and integrating these systems into their workflows, firms can differentiate themselves and create defensible advantages. Over time, the distinction between a law firm and a legal technology company may become increasingly blurred.",
        ],
      },
      {
        heading: "Uneven but inevitable adoption",
        paragraphs: [
          "Despite these changes, adoption remains uneven. The legal profession is inherently conservative, with a strong emphasis on risk mitigation and reliability. This can slow the integration of new technologies, particularly in high stakes contexts. However, the trajectory is clear. As AI capabilities continue to improve and as early adopters demonstrate tangible benefits, the pressure to adapt will intensify.",
        ],
      },
      {
        heading: "A restructuring, not a disappearance",
        paragraphs: [
          "The transformation of law firms is therefore not a question of if, but of how quickly and to what extent. Firms that recognize the need to move from a labor based model to a system based model will be better positioned to navigate this transition. Those that invest in building, measuring, and continuously improving their processes will be able to deliver greater value with fewer resources.",
          "In this emerging landscape, the defining advantage will not lie solely in the quality of individual lawyers, but in the quality of the systems that support them. The firms that succeed will be those that understand how to encode expertise into scalable processes, how to integrate human judgment with machine capability, and how to align their economic incentives with this new reality. The practice of law is not disappearing, but it is being fundamentally restructured.",
        ],
      },
    ],
  },
  {
    slug: "emerging-architecture-ai-regulation",
    title: "The emerging architecture of AI regulation",
    subtitle:
      "Why AI compliance now depends on reading statutes, supervisory guidance, and governance frameworks together rather than in isolation.",
    author,
    // Demo/seed note — kept in the registry but unpublished so only authored
    // notes appear publicly.
    status: "draft",
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
    title: "Why soft law matters in AI compliance",
    subtitle:
      "Non-binding frameworks frequently become the operational language of AI governance long before formal law answers every question.",
    author,
    // Demo/seed note — kept in the registry but unpublished so only authored
    // notes appear publicly.
    status: "draft",
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
      "Early questions on AI, legal ethics, and professional responsibility",
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
    title: "EU and U.S. approaches to AI governance",
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
    title: "Legal intelligence systems and regulatory monitoring",
    subtitle:
      "Why legal monitoring becomes more useful when sources, authority levels, and verification workflows are structured rather than merely aggregated.",
    author,
    status: "forthcoming",
    category: "Legal Intelligence Systems",
    tags: [
      "Legal intelligence",
      "Regulatory monitoring",
      "Source verification",
      "Structured analysis",
    ],
    readingTime: "Note in development",
    summary:
      "A note in development on how source-verified legal intelligence systems can organize AI law developments more meaningfully than a generic feed.",
    abstract:
      "This piece will argue that monitoring only becomes durable legal intelligence when it includes source discipline, authority classification, source verification, and structured comparison across jurisdictions.",
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
    title: "AI regulation and access to justice",
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
    title: "From monitoring to meaning",
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

/** The language an entry was written in. */
export function getOriginalLanguage(entry: ResearchEntry): ArticleLanguage {
  return entry.originalLanguage ?? "en";
}

/**
 * Languages this entry can actually be read in — the original first, then any
 * rendition that exists. Nothing is offered that would render empty.
 */
export function getAvailableLanguages(entry: ResearchEntry): ArticleLanguage[] {
  const original = getOriginalLanguage(entry);
  const translated = ARTICLE_LANGUAGES.filter(
    (language) => language !== original && Boolean(entry.translations?.[language]),
  );
  return [original, ...translated];
}

/**
 * The rendition to display. Falls back to the original whenever the requested
 * language is missing, so a bad URL or a stale link never blanks the page.
 */
export function getResearchRendition(
  entry: ResearchEntry,
  language: ArticleLanguage,
): ResearchTranslation & { language: ArticleLanguage; isOriginal: boolean } {
  const original = getOriginalLanguage(entry);
  const translation = language === original ? undefined : entry.translations?.[language];

  if (!translation) {
    return {
      language: original,
      isOriginal: true,
      title: entry.title,
      subtitle: entry.subtitle,
      readingTime: entry.readingTime,
      summary: entry.summary,
      abstract: entry.abstract,
      body: entry.body,
      references: entry.references,
    };
  }

  return {
    ...translation,
    // Sources are largely language-neutral — official titles, publications and
    // URLs. A translation that omits them keeps the original's list rather
    // than dropping the citations entirely.
    references: translation.references ?? entry.references,
    language,
    isOriginal: false,
  };
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
