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
  /**
   * False when the author has not personally checked this rendition. The
   * article page then says so — machine-translated legal analysis must not be
   * presented as the author's own words, and Article 50(4) of the AI Act is
   * itself about disclosing AI-generated public-interest text.
   */
  humanReviewed?: boolean;
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
        humanReviewed: false,
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
        humanReviewed: false,
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
      "AI-generated summaries may soon have a clearer path into the courtroom. A recent legal development explores how Federal Rule of Evidence 1006 could support the admissibility of AI-generated summaries, provided the underlying evidence is properly handled. This note breaks down what this means, why it matters, and the safeguards that will still be required.",
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
          "This clarification matters because a Rule 1006 summary is not merely a visual aid. When the proper foundation is established, the summary can become substantive evidence that the judge or jury may rely on.[2][3][4]",
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
        heading: "A proposed Rule 707 — not yet adopted",
        paragraphs: [
          "A proposed Federal Rule of Evidence 707 could eventually introduce more specific reliability requirements for evidence produced by artificial intelligence. However, the Advisory Committee on Evidence Rules stated in its May 17, 2026 report that it was not recommending adoption of the proposal at that time.[6]",
          "For now, the existing rules already provide a possible framework.",
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
          "[1] Federal Rule of Evidence 1006 and Advisory Committee Note to the 2024 amendment.",
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
          "[6] Advisory Committee on Evidence Rules, May 17, 2026 report concerning proposed Federal Rule of Evidence 707.",
      },
    ],
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
      humanReviewed: true,
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
