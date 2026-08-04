# Prompt — session locale : construction des bases de données par scraping

> Copie tout ce qui suit dans une session Claude Code locale, à la racine du repo.

---

## Mission

Tu es le propriétaire unique du projet `CSG-AI-law` (site professionnel « C. Saint-Girons, Esq — AI Law & Legal Intelligence »). Lis `AGENTS.md` et `CLAUDE.md` avant de coder — ils te gouvernent.

Le propriétaire a fait ce constat, qui est le problème à résoudre : **la base de données américaine n'est pas remplie, les bases pays sont très insuffisantes, et le monitoring n'affiche ni les dernières décisions de justice ni les dernières nouvelles juridiques.** Ta mission est de remplir ces bases avec des données réelles, vérifiées à la source officielle.

Développe sur la branche `claude/github-monitoring-recovery-lz4dos`. Commit + push à la fin. **Ne crée pas de PR sans qu'on te le demande.**

## Outils à utiliser (c'est le cœur de la demande)

Utilise **tous** les outils de scraping/recherche disponibles, en cascade, du plus fiable au moins fiable :

1. **Legal Data Hunter MCP** — corpus primaire officiel (38M+ documents, 230+ juridictions). `search(namespace="legislation"|"case_law", source=["US/MT-Legislation"])`, `get_document`, `discover_sources`. ⚠️ La fraîcheur du snapshot **varie par État** : TN = 2021, TX = 2026-04, KY = 2026-07. Vérifie toujours la date avant de conclure « pas de loi ».
2. **Firecrawl** (`FIRECRAWL_API_KEY`) — scraping structuré des sites officiels, `/scrape` et `/crawl`. C'est l'outil principal pour les sites `.gov` récalcitrants.
3. **Tavily MCP** — `tavily_search` avec `include_domains` restreint aux domaines officiels, puis `tavily_extract` avec `extract_depth: "advanced"`. Fonctionne bien sur `ilga.gov`, `nysenate.gov`, `legmt.gov`.
4. **Exa MCP** — `web_search_exa` en recherche sémantique (« page officielle du bill X »), `web_fetch_exa` pour lire.
5. **CourtListener MCP** — jurisprudence fédérale et d'État. `search(type="o")` pour les opinions, `type="d"` pour les dockets. Limite : 10 req/min.
6. **Apify / ScraperAPI** — pour les sites qui bloquent tout le reste (JS lourd, anti-bot).
7. **WebSearch / WebFetch** — découverte et corroboration.

## Règles de vérité — non négociables

- **N'invente jamais** une loi, une date, un numéro de chapitre, une décision ou une citation. Si tu ne peux pas le vérifier à une source officielle, tu ne l'écris pas.
- Une donnée n'entre en base que si elle est adossée à une **source officielle** (législature de l'État, code de l'État, gouverneur, agence, tribunal) ou corroborée par plusieurs sources sérieuses.
- Distingue rigoureusement : droit contraignant / proposition de loi / réglementation / guidance / enforcement / soft law / standards.
- Politique de publication : les sources officielles et réputées peuvent auto-publier ; les sources faibles, informelles ou de simple découverte restent **admin-only**. Ne réintroduis pas de mention générale de « revue humaine avant publication ».
- Ne touche pas aux plafonds de coût IA (`AI_MONTHLY_BUDGET_USD=5`, `AI_MAX_ITEMS_PER_SCAN=10`, `AI_MAX_INPUT_TOKENS_PER_ITEM=12000`). Le traitement IA reste désactivé par défaut.
- Aucun secret dans le repo, les commits ou les logs.

## Cible 1 — Base des États américains (priorité absolue)

Fichier : `src/content/ai-regulation/us-state-ai-law-baseline.ts`

Deux structures à enrichir :

- `prioritySources: Record<string, UsStateOfficialSource[]>` — les URLs officielles par État.
- `populatedStateBaselines: Record<string, PopulatedStateBaseline>` — le fond juridique :

```ts
interface PopulatedStateBaseline {
  status: UsStateAiLawStatus;   // enacted_comprehensive_ai_law | enacted_sector_specific_ai_law
                                // | pending_ai_legislation | agency_guidance_or_enforcement
                                // | ai_related_privacy_or_automated_decision_rules
                                // | no_specific_ai_law_verified | needs_review
  confidence: UsStateConfidence; // high | medium | low | needs_review
  enactedAIStatutes: string[];   // citation exacte + ce que la loi fait
  pendingAIBills?: string[];
  stateGovernmentUseRules?: string[];
  privateSectorRules?: string[];
  publicSummary: string;         // 2-3 phrases, ton professionnel, pas de superlatif
}
```

Actuellement peuplés : **CO, CA, TX, UT, CT** uniquement. Objectif : couvrir tous les États ayant une activité IA vérifiable (~30-38 selon la NCSL, qui recense ~100 mesures adoptées par 38 États en 2025).

### Déjà vérifié à la source officielle — reprends tel quel, ne refais pas le travail

| État | Source officielle | Fait vérifié |
|---|---|---|
| **IL** | `ilga.gov/ftp/legislation/103/BillStatus/HTML/10300HB3773.html` | HB 3773 → **Public Act 103-0804**, « Governor Approved 8/9/2024 », « Effective Date January 1, 2026 ». Amende l'Employment Article de l'Illinois Human Rights Act : violation des droits civiques (1) d'utiliser une IA ayant pour effet de discriminer sur la base d'une classe protégée en matière de recrutement, embauche, promotion, renouvellement, sélection pour formation, licenciement, discipline, ancienneté ou conditions d'emploi, ou d'utiliser les **codes postaux comme proxy** d'une classe protégée ; (2) de ne pas notifier l'employé de l'usage d'une IA. Définit « artificial intelligence » et « generative artificial intelligence ». |
| **NY** | `nysenate.gov/legislation/bills/2025/S822` | LOADinG Act = S7543-B / A9430-B → **Chapter 674 of the Laws of 2024**. Amendement de chapitre (S822) : abroge les obligations d'impact assessment et de meaningful human review ; impose la publication des outils de décision automatisée sur les sites des agences et un **inventaire IA** tenu par l'Office of Information Technology ; codifie les protections du service civil. |
| **TN** | `publications.tnsosfiles.com/acts/113/pub/pc0588.pdf` | **Public Chapter 588** (HB 2091). TCA § 47-25-1101 : « Personal Rights Protection Act of 1984 » remplacé par « **Ensuring Likeness, Voice, and Image Security Act of 2024** ». Ajoute la définition de « Voice » = son identifiable et attribuable à un individu, **que le son contienne la voix réelle ou une simulation**. § 47-25-1107(c) : « had knowledge **or reasonably should have known** of the unauthorized use ». **Effet 1er juillet 2024.** |
| **MT** | `archive.legmt.gov/content/Sessions/69th/Contractor_index/CH0150.pdf` (enrolled bill) | **SB 212 « Right to Compute Act »** (69e législature, 2025) : droit fondamental de posséder et utiliser des ressources computationnelles ; toute restriction gouvernementale doit être « narrowly tailored to fulfill a compelling government interest » ; **exige une politique de gestion des risques pour les infrastructures critiques contrôlées par un système d'IA** ; effet immédiat. Définit « artificial intelligence system ». |
| **MT** | `mca.legmt.gov/.../0020-0210-0010-0030.html` | **MCA § 2-21-103** — obligation pour les entités gouvernementales de divulguer les contenus produits par IA non revus par un humain et l'usage d'IA dans les interfaces publiques ; exemption pour enquêtes des forces de l'ordre. Historique : « En. Sec. 3, Ch. 427, L. 2025 ». |
| **KY** | corpus LDH `US/KY-Legislation` (snapshot 2026-07) | **KRS § 42.731** — comité de gouvernance IA au sein du Commonwealth Office of Technology ; standards adhérant à **ISO/IEC 42001** ; standards pour l'IA générative et à haut risque ; transparence ; registre centralisé ; processus d'approbation. Définitions en § 42.722. |
| **TX** | corpus LDH (snapshot 2026-04) | Gov Code §§ 2054.701 (division IA), 2054.707 (divulgation aux interfaces publiques), 2054.711 (notice standardisée pour décisions conséquentielles). § 552.003 : « Added by Acts 2025, 89th Leg., R.S., Ch. 1174 (H.B. 149), Sec. 4, **eff. January 1, 2026** » → date d'effet TRAIGA confirmée à la source. |
| **WA** | — | Aucune loi IA transversale promulguée vérifiée ; propositions 2025-26 : SB 6120 (IA à haut risque), SB 6284/6284-S, HB 2157/2157-S, HB 2667. → `pending_ai_legislation`. |

### À faire

1. Ajoute les entrées `populatedStateBaselines` pour **IL, NY, TN, MT, KY** (données ci-dessus) et **WA** en `pending_ai_legislation`.
2. Enrichis **TX** avec la date d'effet confirmée du 1er janvier 2026.
3. Étends ensuite la couverture : pars de la synthèse NCSL « Artificial Intelligence 2025 Legislation » pour dresser la **carte** de ce qui a été adopté, puis **vérifie chaque élément à la source officielle de l'État** avant de l'écrire. Cibles à fort rendement : AR, CA (SB 942, AB 2013, AB 1008, SB 1120), CO (SB25B-004, date d'application révisée), MD, NM, NJ, ND (IA + harcèlement/stalking), OR, VA, UT (amendements post-SB 149).
4. **Mets à jour les pins de test** dans `src/content/ai-regulation/us-legal-baseline.test.ts` :
   - ligne ~133 : `expect(enacted.map((s) => s.code).sort()).toEqual(["CA","CO","CT","TX","UT"])` → doit inclure les nouveaux États promulgués (IL, NY, TN, MT, KY…). Trie par ordre alphabétique.
   - Ajoute un commentaire de provenance à côté de chaque pin modifié.

## Cible 2 — Jurisprudence

Fichier : `src/content/ai-regulation/us-ai-case-law.ts` (9 entrées publiées aujourd'hui).

Via **CourtListener MCP**, enrichis avec des décisions vérifiables sur : droit d'auteur et entraînement de modèles, responsabilité produit des chatbots, hallucinations et sanctions Rule 11, deepfakes et droit à l'image, discrimination algorithmique à l'embauche. Pour chaque entrée : nom exact, tribunal, numéro de docket, date de dépôt, `absolute_url` CourtListener. **Pas de résumé inventé** — appuie-toi sur le texte de la décision.

Fais de même pour l'Europe dans `europe-ai-case-law.ts`.

## Cible 3 — Bases pays

Les profils pays vivent dans `src/content/ai-regulation/*-national-depth.ts` et `*-ai-intelligence.ts`. Beaucoup sont squelettiques. Via **Legal Data Hunter** (`country=["FR","DE","IT","ES","NL","BE","AT","IE","SE","DK","PL"...]`, `namespace="legislation"`), remplis les mesures nationales de transposition de l'AI Act, les autorités désignées, et les sanctions. Une donnée = une source officielle citée.

## Cible 4 — Sources de monitoring

Fichier : `src/db/seed/ai-regulation-seed.ts` (~5 500 lignes, `prioritySources` par juridiction).

Ajoute des sources officielles **vérifiées accessibles au runtime** (teste chaque flux avant de l'ajouter : RSS valide, HTTP 200, sélecteur qui matche). Manques identifiés : Montana, Kentucky, Washington, et les tribunaux d'État. Documente en commentaire la provenance de chaque promotion.

## Vérification — obligatoire avant de conclure

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Le build exige des variables d'env ; en CI le bloc utilisé est :
`APP_DATA_MODE=memory ALLOW_MEMORY_MODE_IN_PRODUCTION=true ADMIN_AUTH_SECRET=… ADMIN_USERNAME=… ADMIN_PASSWORD=… CRON_SECRET=…`

Contrainte connue : une chaîne littérale passée à `select()` de Supabase déclenche TS2589 (profondeur de type excessive) → construis-la avec `[...].join(",")`.

## Handoff

Termine par une entrée en tête du log `## Current status` de `AI_TASKS.md`, au format imposé (Intent / Files / Graph anchors / Verification / Branch-commit / Next), et mets à jour ta ligne du Status board. Pas de log de progression verbeux.

## Critères de succès

- La carte des États-Unis affiche un statut vérifié pour tous les États où une activité IA existe, chacun adossé à une source officielle.
- Chaque `enactedAIStatutes` contient une citation exacte et vérifiable (numéro de bill, chapitre public, section de code, date d'effet).
- Aucune affirmation non sourcée.
- `npm test && npm run lint && npm run typecheck && npm run build` passent.
