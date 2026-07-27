import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

// DRAFT — deliberately NOT linked from the site navigation, footer, or sitemap,
// and marked noindex below. Every `{{OWNER: ...}}` token is a fact only the site
// owner can supply (controller identity, retention periods, hosting regions).
// Factual statements about processors, cookies, and analytics were verified
// against the codebase: Vercel deployment config, the @supabase/supabase-js
// dependency, the 8-hour `csg_admin_session` cookie in src/lib/admin-auth.ts,
// and the absence of any analytics package. Re-verify them before publishing,
// and re-verify them again if a contact form, newsletter, or analytics is added.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const fr = lang === "fr";
  return {
    title: fr ? "Politique de confidentialité" : "Privacy Notice",
    description: fr
      ? "Traitement des données personnelles liées à ce site : responsable, finalités, bases légales, durées de conservation, sous-traitants, cookies et droits des personnes concernées."
      : "How personal data connected with this site is processed: controller, purposes, legal bases, retention, processors, cookies, and data subject rights.",
    // Unlinked draft: keep it out of search results until the owner facts land.
    robots: { index: false, follow: false },
  };
}

export const revalidate = 3600;

type Block = { heading: string; lines: string[] };

const COPY = {
  en: {
    eyebrow: "Data protection",
    title: "Privacy notice",
    description:
      "What personal data this site processes, why, on what legal basis, for how long, and what you can require of the controller under the GDPR.",
    draftLabel: "Incomplete draft",
    draftBody:
      "This notice is not final. Every field marked {{OWNER: …}} is awaiting a verified detail from the site owner — chiefly the controller's identity and the retention periods actually applied.",
    legalNoticeLink: "Read the legal notice →",
    sections: [
      {
        heading: "Data controller",
        lines: [
          "Controller: {{OWNER: identity of the data controller — full legal name and, if applicable, legal form and registration number}}",
          "Postal address: {{OWNER: postal address of the controller}}",
          "Contact for data-protection matters: {{OWNER: email address to be used for data-protection requests}}",
          "Data protection officer: {{OWNER: name and contact details of the DPO if one has been appointed; otherwise a statement that no DPO is required}}",
        ],
      },
      {
        heading: "What this site collects",
        lines: [
          "This site has no public contact form, no user accounts, and no newsletter sign-up. Nothing is collected from you while you browse beyond what is described below.",
          "Email correspondence — the contact page opens your own mail client. If you write, the controller receives your email address, the name you choose to give, and the content of your message.",
          "Technical connection data — the hosting provider records standard server logs (IP address, timestamp, requested URL, user agent) for delivery, security, and abuse prevention.",
          "Administration session — a strictly necessary session cookie (csg_admin_session, HttpOnly, SameSite=Lax, 8-hour lifetime) is set only when an authorised administrator signs in to the private back office. Public visitors never receive it.",
        ],
      },
      {
        heading: "Purposes and legal basis",
        lines: [
          "Replying to your message — legitimate interest under Article 6(1)(f) GDPR in answering a professional enquiry addressed to the controller, or steps taken at your request prior to entering into a contract under Article 6(1)(b).",
          "Delivering and securing the site — legitimate interest under Article 6(1)(f) in operating a functioning, secure website.",
          "Controlling access to the administration area — legitimate interest under Article 6(1)(f) in restricting the editorial back office to authorised users.",
          "Meeting the professional and legal obligations that apply to the controller — legal obligation under Article 6(1)(c).",
          "Correspondence with a lawyer may additionally be covered by professional secrecy: {{OWNER: the professional secrecy regime applicable to the practice, which should be referenced here}}",
        ],
      },
      {
        heading: "Retention",
        lines: [
          "Email correspondence: {{OWNER: how long email correspondence is kept, distinguishing enquiries that lead to no engagement from matter files that must be retained under professional rules}}",
          "Server logs: {{OWNER: the log retention period applied by the hosting provider, to be confirmed against its documentation}}",
          "Administration session cookie: it expires eight hours after sign-in, or immediately on sign-out.",
        ],
      },
      {
        heading: "Recipients and processors",
        lines: [
          "Vercel — application hosting and delivery. The site is deployed on Vercel, which processes connection data and server logs on the controller's behalf.",
          "Supabase — managed PostgreSQL database. It stores the regulatory-monitoring content published on this site (sources, legal developments, scan and review logs). It is not used to store visitor profiles or contact data.",
          "Email provider: {{OWNER: the provider hosting the controller's professional mailbox, which processes any message you send}}",
          "Hosting regions and international transfers: {{OWNER: the region(s) configured for the Vercel and Supabase projects, and the transfer safeguard relied on for any processing outside the EEA (for example standard contractual clauses)}}",
          "Personal data is never sold, rented, or shared for advertising purposes.",
        ],
      },
      {
        heading: "Cookies and analytics",
        lines: [
          "This site runs no analytics, no advertising trackers, and no third-party measurement scripts. There is no audience-measurement package in the application.",
          "The only cookie is the strictly necessary administration session cookie described above, which public visitors never receive. On that basis no consent banner is required.",
          "{{OWNER: if analytics, a consent banner, embedded third-party media, or a contact form is ever added, this section and the two above must be updated before the change goes live}}",
        ],
      },
      {
        heading: "Your rights",
        lines: [
          "Subject to the conditions set by the GDPR, you may request access to your personal data, its rectification, its erasure, the restriction of its processing, and its portability; you may object to processing based on legitimate interest; and where processing rests on consent, you may withdraw that consent at any time.",
          "To exercise these rights, write to the data-protection contact above. {{OWNER: confirm the address to use and any identity-verification step you want applied to requests}}",
          "You may lodge a complaint with a supervisory authority. In France this is the Commission nationale de l'informatique et des libertés (CNIL, www.cnil.fr); you may also apply to the authority of your country of residence or place of work.",
          "Some rights may be limited where the data is covered by professional secrecy or by a retention obligation applicable to the controller's practice.",
        ],
      },
      {
        heading: "Security",
        lines: [
          "The administration area is authenticated and access-restricted; its session cookie is HttpOnly and short-lived. The public site publishes editorial and regulatory material, not personal data about visitors.",
          "{{OWNER: any additional organisational security measures you want stated here — device encryption, access control, backup and breach-response policy}}",
        ],
      },
      {
        heading: "Changes to this notice",
        lines: [
          "This notice is updated whenever the processing it describes changes.",
          "Last reviewed: {{OWNER: date on which this notice was last reviewed}}",
        ],
      },
    ] as Block[],
  },
  fr: {
    eyebrow: "Protection des données",
    title: "Politique de confidentialité",
    description:
      "Quelles données personnelles ce site traite, pourquoi, sur quelle base légale, pendant combien de temps, et ce que vous pouvez exiger du responsable de traitement au titre du RGPD.",
    draftLabel: "Brouillon incomplet",
    draftBody:
      "Cette politique n'est pas définitive. Chaque champ marqué {{OWNER: …}} attend une information vérifiée du titulaire du site — principalement l'identité du responsable de traitement et les durées de conservation réellement appliquées.",
    legalNoticeLink: "Lire les mentions légales →",
    sections: [
      {
        heading: "Responsable du traitement",
        lines: [
          "Responsable du traitement : {{OWNER: identity of the data controller — full legal name and, if applicable, legal form and registration number}}",
          "Adresse postale : {{OWNER: postal address of the controller}}",
          "Contact pour les questions de protection des données : {{OWNER: email address to be used for data-protection requests}}",
          "Délégué à la protection des données : {{OWNER: name and contact details of the DPO if one has been appointed; otherwise a statement that no DPO is required}}",
        ],
      },
      {
        heading: "Ce que ce site collecte",
        lines: [
          "Ce site ne comporte aucun formulaire de contact public, aucun compte utilisateur et aucune inscription à une lettre d'information. Rien n'est collecté pendant votre navigation au-delà de ce qui est décrit ci-dessous.",
          "Correspondance par courriel — la page de contact ouvre votre propre logiciel de messagerie. Si vous écrivez, le responsable de traitement reçoit votre adresse électronique, le nom que vous choisissez d'indiquer et le contenu de votre message.",
          "Données techniques de connexion — l'hébergeur enregistre des journaux serveur standards (adresse IP, horodatage, URL demandée, agent utilisateur) à des fins de distribution, de sécurité et de prévention des abus.",
          "Session d'administration — un cookie de session strictement nécessaire (csg_admin_session, HttpOnly, SameSite=Lax, durée de 8 heures) n'est déposé que lorsqu'un administrateur autorisé se connecte à l'espace privé. Les visiteurs du site public ne le reçoivent jamais.",
        ],
      },
      {
        heading: "Finalités et bases légales",
        lines: [
          "Répondre à votre message — intérêt légitime au sens de l'article 6, § 1, f) du RGPD à répondre à une demande professionnelle adressée au responsable de traitement, ou mesures précontractuelles prises à votre demande au sens de l'article 6, § 1, b).",
          "Fournir et sécuriser le site — intérêt légitime au sens de l'article 6, § 1, f) à exploiter un site fonctionnel et sécurisé.",
          "Contrôler l'accès à l'espace d'administration — intérêt légitime au sens de l'article 6, § 1, f) à réserver l'arrière-guichet éditorial aux utilisateurs autorisés.",
          "Respecter les obligations professionnelles et légales applicables au responsable de traitement — obligation légale au sens de l'article 6, § 1, c).",
          "La correspondance avec un avocat peut en outre être couverte par le secret professionnel : {{OWNER: the professional secrecy regime applicable to the practice, which should be referenced here}}",
        ],
      },
      {
        heading: "Durées de conservation",
        lines: [
          "Correspondance par courriel : {{OWNER: how long email correspondence is kept, distinguishing enquiries that lead to no engagement from matter files that must be retained under professional rules}}",
          "Journaux serveur : {{OWNER: the log retention period applied by the hosting provider, to be confirmed against its documentation}}",
          "Cookie de session d'administration : il expire huit heures après la connexion, ou immédiatement à la déconnexion.",
        ],
      },
      {
        heading: "Destinataires et sous-traitants",
        lines: [
          "Vercel — hébergement et distribution de l'application. Le site est déployé sur Vercel, qui traite les données de connexion et les journaux serveur pour le compte du responsable de traitement.",
          "Supabase — base de données PostgreSQL infogérée. Elle stocke le contenu de veille réglementaire publié sur ce site (sources, développements juridiques, journaux de scan et de revue). Elle n'est pas utilisée pour stocker des profils de visiteurs ou des données de contact.",
          "Fournisseur de messagerie : {{OWNER: the provider hosting the controller's professional mailbox, which processes any message you send}}",
          "Régions d'hébergement et transferts internationaux : {{OWNER: the region(s) configured for the Vercel and Supabase projects, and the transfer safeguard relied on for any processing outside the EEA (for example standard contractual clauses)}}",
          "Les données personnelles ne sont jamais vendues, louées ni partagées à des fins publicitaires.",
        ],
      },
      {
        heading: "Cookies et mesure d'audience",
        lines: [
          "Ce site n'utilise aucune mesure d'audience, aucun traceur publicitaire et aucun script de mesure tiers. L'application ne contient aucun outil d'analytics.",
          "Le seul cookie est le cookie de session d'administration strictement nécessaire décrit ci-dessus, que les visiteurs du site public ne reçoivent jamais. À ce titre, aucun bandeau de consentement n'est requis.",
          "{{OWNER: if analytics, a consent banner, embedded third-party media, or a contact form is ever added, this section and the two above must be updated before the change goes live}}",
        ],
      },
      {
        heading: "Vos droits",
        lines: [
          "Dans les conditions prévues par le RGPD, vous pouvez demander l'accès à vos données personnelles, leur rectification, leur effacement, la limitation de leur traitement et leur portabilité ; vous pouvez vous opposer à un traitement fondé sur l'intérêt légitime ; et lorsque le traitement repose sur le consentement, vous pouvez le retirer à tout moment.",
          "Pour exercer ces droits, écrivez au contact protection des données indiqué ci-dessus. {{OWNER: confirm the address to use and any identity-verification step you want applied to requests}}",
          "Vous pouvez introduire une réclamation auprès d'une autorité de contrôle. En France, il s'agit de la Commission nationale de l'informatique et des libertés (CNIL, www.cnil.fr) ; vous pouvez aussi saisir l'autorité de votre pays de résidence ou de votre lieu de travail.",
          "Certains droits peuvent être limités lorsque les données sont couvertes par le secret professionnel ou par une obligation de conservation applicable à l'activité du responsable de traitement.",
        ],
      },
      {
        heading: "Sécurité",
        lines: [
          "L'espace d'administration est authentifié et à accès restreint ; son cookie de session est HttpOnly et de courte durée. Le site public publie des contenus éditoriaux et réglementaires, non des données personnelles de visiteurs.",
          "{{OWNER: any additional organisational security measures you want stated here — device encryption, access control, backup and breach-response policy}}",
        ],
      },
      {
        heading: "Modifications de cette politique",
        lines: [
          "Cette politique est mise à jour chaque fois que les traitements qu'elle décrit évoluent.",
          "Dernière revue : {{OWNER: date on which this notice was last reviewed}}",
        ],
      },
    ] as Block[],
  },
} as const;

function Blocks({ blocks }: { blocks: readonly Block[] }) {
  return (
    <MotionStagger className="space-y-10">
      {blocks.map((block) => (
        <MotionStaggerItem key={block.heading}>
          <section className="space-y-3">
            <h2 className="font-display text-xl font-medium tracking-[-0.03em] text-white/90">
              {block.heading}
            </h2>
            <div className="space-y-2">
              {block.lines.map((line) => (
                <p key={line} className="max-w-3xl text-sm leading-7 text-white/60">
                  {line}
                </p>
              ))}
            </div>
          </section>
        </MotionStaggerItem>
      ))}
    </MotionStagger>
  );
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = COPY[lang];

  return (
    <SiteShell className="space-y-12">
      <MotionReveal>
        <SectionHeading
          as="h1"
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
        />
      </MotionReveal>

      <MotionReveal delay={0.05}>
        <div className="rounded-[1.4rem] border border-amber-400/25 bg-amber-400/[0.06] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/90">
            {t.draftLabel}
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">{t.draftBody}</p>
        </div>
      </MotionReveal>

      <Blocks blocks={t.sections} />

      <MotionReveal>
        <Link
          href={localeHref(lang, "/legal-notice")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/45 underline decoration-white/15 underline-offset-4 hover:text-white/80"
        >
          {t.legalNoticeLink}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
