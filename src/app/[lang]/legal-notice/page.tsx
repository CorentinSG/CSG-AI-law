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
// owner can supply; none of them may be guessed. A legal notice that states a
// wrong bar, address, or registration number is worse than no notice at all.
// Link this page only once every placeholder has been replaced.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const fr = lang === "fr";
  return {
    title: fr ? "Mentions légales" : "Legal Notice",
    description: fr
      ? "Mentions légales du site : éditeur, directeur de la publication, hébergeur, réglementation professionnelle, propriété intellectuelle et droit applicable."
      : "Legal notice for this site: publisher, publication director, host, professional regulation, intellectual property, and applicable law.",
    // Unlinked draft: keep it out of search results until the owner facts land.
    robots: { index: false, follow: false },
  };
}

export const revalidate = 3600;

type Block = { heading: string; lines: string[] };

const COPY = {
  en: {
    eyebrow: "Legal information",
    title: "Legal notice",
    description:
      "Publication and professional-regulation information for this site, presented in the structure required by Article 6 III of the French LCEN and by the advertising rules applicable to attorneys.",
    draftLabel: "Incomplete draft",
    draftBody:
      "This notice is not final. Every field marked {{OWNER: …}} is awaiting a verified detail from the site owner. Nothing on this page should be relied upon until those fields are filled in.",
    advertisingLabel: "Attorney Advertising",
    advertisingLines: [
      "This website may constitute attorney advertising in some jurisdictions, including the State of New York.",
      "Prior results do not guarantee a similar outcome.",
      "The information published here is general in nature, is not legal advice, and is no substitute for advice on the facts of a specific matter. Reading this site, or writing to the address published on it, does not create an attorney–client relationship.",
      "Attorney responsible for the content of this website: {{OWNER: name and principal office address of the attorney or firm responsible for this website's content, as required by the advertising rules of every jurisdiction where the publisher is admitted}}",
      "Jurisdictions of admission: {{OWNER: list every jurisdiction in which the publisher is admitted to practise, and state expressly any jurisdiction in which the publisher is not admitted}}",
    ],
    privacyLink: "Read the privacy notice →",
    sections: [
      {
        heading: "Publisher of the site",
        lines: [
          "Publisher: {{OWNER: full legal name of the site publisher, exactly as it should be published}}",
          "Professional status and legal form: {{OWNER: professional status and legal form (individual practitioner, SELARL, SELAS, PLLC, partnership, etc.), plus share capital if the form requires it}}",
          "Business registration: {{OWNER: SIREN/SIRET number and RCS registry city, or the equivalent company or professional registration number}}",
          "VAT: {{OWNER: intra-Community VAT number, or a statement that the publisher is not VAT-registered}}",
          "Professional address: {{OWNER: full professional address to publish on this notice}}",
          "Telephone: {{OWNER: professional telephone number}}",
          "Email: {{OWNER: contact email address to publish on this notice — the contact page currently publishes corentin.stgirons@gmail.com}}",
        ],
      },
      {
        heading: "Publication director",
        lines: [
          "Director of publication: {{OWNER: full name and title of the publication director (directeur de la publication)}}",
        ],
      },
      {
        heading: "Hosting",
        lines: [
          "This site is deployed on the Vercel platform, as confirmed by the project's deployment configuration.",
          "Host identity as required by law: {{OWNER: exact legal name, registered address, and telephone number of the hosting provider, in the form required by Article 6 III of the French LCEN}}",
        ],
      },
      {
        heading: "Professional regulation",
        lines: [
          "Professional title: {{OWNER: professional title(s) held (e.g. avocat, attorney-at-law) and the State or country that granted each one}}",
          "Bar admission: {{OWNER: bar (barreau) of admission and registration number, for each admission held}}",
          "Supervisory authority: {{OWNER: the bar council or supervisory authority responsible for each admission}}",
          "Applicable rules of professional conduct: {{OWNER: the rules of professional conduct applicable to each admission, and where they can be consulted}}",
          "Professional liability insurance: {{OWNER: name and address of the professional liability insurer, and the geographic scope of cover}}",
          "Financial guarantee: {{OWNER: financial guarantee (garantie financière) details, where the applicable professional rules require them}}",
          "Consumer mediation: {{OWNER: designated consumer mediator (médiateur de la consommation) and contact details, if the practice is required to designate one}}",
        ],
      },
      {
        heading: "Intellectual property",
        lines: [
          "Unless stated otherwise, the structure, wording, editorial analysis, and graphic design of this site are protected by intellectual property law. Reproduction, adaptation, extraction, or redistribution — in whole or in part, by any means — requires prior written authorisation.",
          "Legal and regulatory materials referenced here (statutes, case law, official publications, and third-party documents) remain the property of their respective issuers and are cited with their source.",
          "Quotation for research, teaching, or press purposes is permitted where the source and the author are clearly identified.",
        ],
      },
      {
        heading: "Personal data",
        lines: [
          "The processing of personal data connected with this site is described in a separate notice, which forms part of these legal terms.",
        ],
      },
      {
        heading: "Content and liability",
        lines: [
          "Content on this site is published for information and research purposes only. It is not legal advice and does not create an attorney–client relationship.",
          "Regulatory-monitoring entries reflect the state of the tracked sources on the date shown with each item. Law changes: verify against the official source before relying on anything published here.",
          "External links are provided for convenience. The publisher does not control third-party sites and is not responsible for their content.",
        ],
      },
      {
        heading: "Applicable law and jurisdiction",
        lines: [
          "Governing law and competent courts: {{OWNER: the law governing this notice and the competent courts, to be designated consistently with the publisher's place of establishment and bar admission(s)}}",
        ],
      },
      {
        heading: "Updates",
        lines: [
          "Last reviewed: {{OWNER: date on which this notice was last reviewed}}",
        ],
      },
    ] as Block[],
  },
  fr: {
    eyebrow: "Informations légales",
    title: "Mentions légales",
    description:
      "Informations relatives à l'édition du site et à la réglementation professionnelle, présentées selon la structure exigée par l'article 6 III de la LCEN et par les règles de publicité applicables aux avocats.",
    draftLabel: "Brouillon incomplet",
    draftBody:
      "Ces mentions ne sont pas définitives. Chaque champ marqué {{OWNER: …}} attend une information vérifiée du titulaire du site. Rien sur cette page ne doit être considéré comme fiable tant que ces champs ne sont pas renseignés.",
    advertisingLabel: "Publicité pour un avocat (Attorney Advertising)",
    advertisingLines: [
      "Ce site est susceptible de constituer une publicité pour un avocat (« attorney advertising ») dans certaines juridictions, notamment dans l'État de New York.",
      "Les résultats obtenus antérieurement ne garantissent pas un résultat similaire.",
      "Les informations publiées ici sont de portée générale, ne constituent pas un conseil juridique et ne remplacent pas un avis rendu au vu des faits d'un dossier particulier. Consulter ce site, ou écrire à l'adresse qui y est publiée, ne crée aucune relation avocat–client.",
      "Avocat responsable du contenu de ce site : {{OWNER: name and principal office address of the attorney or firm responsible for this website's content, as required by the advertising rules of every jurisdiction where the publisher is admitted}}",
      "Juridictions d'inscription : {{OWNER: list every jurisdiction in which the publisher is admitted to practise, and state expressly any jurisdiction in which the publisher is not admitted}}",
    ],
    privacyLink: "Lire la politique de confidentialité →",
    sections: [
      {
        heading: "Éditeur du site",
        lines: [
          "Éditeur : {{OWNER: full legal name of the site publisher, exactly as it should be published}}",
          "Statut professionnel et forme juridique : {{OWNER: professional status and legal form (individual practitioner, SELARL, SELAS, PLLC, partnership, etc.), plus share capital if the form requires it}}",
          "Immatriculation : {{OWNER: SIREN/SIRET number and RCS registry city, or the equivalent company or professional registration number}}",
          "TVA : {{OWNER: intra-Community VAT number, or a statement that the publisher is not VAT-registered}}",
          "Adresse professionnelle : {{OWNER: full professional address to publish on this notice}}",
          "Téléphone : {{OWNER: professional telephone number}}",
          "Courriel : {{OWNER: contact email address to publish on this notice — the contact page currently publishes corentin.stgirons@gmail.com}}",
        ],
      },
      {
        heading: "Directeur de la publication",
        lines: [
          "Directeur de la publication : {{OWNER: full name and title of the publication director (directeur de la publication)}}",
        ],
      },
      {
        heading: "Hébergement",
        lines: [
          "Ce site est déployé sur la plateforme Vercel, ce que confirme la configuration de déploiement du projet.",
          "Identité de l'hébergeur exigée par la loi : {{OWNER: exact legal name, registered address, and telephone number of the hosting provider, in the form required by Article 6 III of the French LCEN}}",
        ],
      },
      {
        heading: "Réglementation professionnelle",
        lines: [
          "Titre professionnel : {{OWNER: professional title(s) held (e.g. avocat, attorney-at-law) and the State or country that granted each one}}",
          "Inscription au barreau : {{OWNER: bar (barreau) of admission and registration number, for each admission held}}",
          "Autorité de contrôle : {{OWNER: the bar council or supervisory authority responsible for each admission}}",
          "Règles professionnelles applicables : {{OWNER: the rules of professional conduct applicable to each admission, and where they can be consulted}}",
          "Assurance de responsabilité civile professionnelle : {{OWNER: name and address of the professional liability insurer, and the geographic scope of cover}}",
          "Garantie financière : {{OWNER: financial guarantee (garantie financière) details, where the applicable professional rules require them}}",
          "Médiation de la consommation : {{OWNER: designated consumer mediator (médiateur de la consommation) and contact details, if the practice is required to designate one}}",
        ],
      },
      {
        heading: "Propriété intellectuelle",
        lines: [
          "Sauf mention contraire, la structure, les textes, les analyses éditoriales et la charte graphique de ce site sont protégés par le droit de la propriété intellectuelle. Toute reproduction, adaptation, extraction ou rediffusion, totale ou partielle et par quelque moyen que ce soit, requiert une autorisation écrite préalable.",
          "Les sources juridiques et réglementaires citées (textes, jurisprudence, publications officielles et documents de tiers) demeurent la propriété de leurs émetteurs respectifs et sont citées avec leur source.",
          "La citation à des fins de recherche, d'enseignement ou de presse est admise dès lors que la source et l'auteur sont clairement identifiés.",
        ],
      },
      {
        heading: "Données personnelles",
        lines: [
          "Le traitement des données personnelles liées à ce site est décrit dans une politique distincte, qui fait partie intégrante des présentes mentions.",
        ],
      },
      {
        heading: "Contenu et responsabilité",
        lines: [
          "Le contenu de ce site est publié à des fins d'information et de recherche uniquement. Il ne constitue pas un conseil juridique et ne crée aucune relation avocat–client.",
          "Les entrées de veille réglementaire reflètent l'état des sources suivies à la date indiquée avec chaque élément. Le droit évolue : vérifiez la source officielle avant de vous fier à un élément publié ici.",
          "Les liens externes sont fournis pour commodité. L'éditeur ne contrôle pas les sites tiers et n'est pas responsable de leur contenu.",
        ],
      },
      {
        heading: "Droit applicable et juridiction compétente",
        lines: [
          "Droit applicable et juridictions compétentes : {{OWNER: the law governing this notice and the competent courts, to be designated consistently with the publisher's place of establishment and bar admission(s)}}",
        ],
      },
      {
        heading: "Mise à jour",
        lines: [
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

export default async function LegalNoticePage({
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

      {/* Attorney-advertising notice: several U.S. states — New York in
          particular, a jurisdiction this site covers in depth — require it on
          lawyer marketing material. */}
      <MotionReveal delay={0.1}>
        <aside
          aria-label={t.advertisingLabel}
          className="rounded-[1.4rem] border border-white/12 bg-white/[0.04] p-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--color-accent-strong,#c4882a)]">
            {t.advertisingLabel}
          </p>
          <div className="mt-3 space-y-2">
            {t.advertisingLines.map((line) => (
              <p key={line} className="max-w-3xl text-sm leading-7 text-white/70">
                {line}
              </p>
            ))}
          </div>
        </aside>
      </MotionReveal>

      <Blocks blocks={t.sections} />

      <MotionReveal>
        <Link
          href={localeHref(lang, "/privacy")}
          className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/45 underline decoration-white/15 underline-offset-4 hover:text-white/80"
        >
          {t.privacyLink}
        </Link>
      </MotionReveal>
    </SiteShell>
  );
}
