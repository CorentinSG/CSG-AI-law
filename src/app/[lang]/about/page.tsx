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
// and marked noindex below. This is a structure only: no biography, career,
// admission, degree, publication, or talk is written here, because none of it
// can be verified from the repository and AGENTS.md forbids inventing any of
// it. Every `{{OWNER: ...}}` token must be replaced with owner-supplied,
// verifiable text before this page is linked.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const fr = lang === "fr";
  return {
    title: fr ? "À propos" : "About",
    description: fr
      ? "Profil professionnel : parcours, inscription au barreau, formation et domaines d'intervention."
      : "Professional profile: career, bar admission, education, and focus areas.",
    // Unlinked draft: keep it out of search results until the owner facts land.
    robots: { index: false, follow: false },
  };
}

export const revalidate = 3600;

type Block = { heading: string; lines: string[] };

const COPY = {
  en: {
    eyebrow: "Profile",
    title: "About",
    description:
      "The professional background behind this site. This page is a structure awaiting owner-supplied content — nothing is claimed here until it can be stated accurately.",
    draftLabel: "Awaiting content",
    draftBody:
      "Every field marked {{OWNER: …}} is a fact only the site owner can supply. Nothing has been drafted on their behalf: no biography, no career history, no admission, no degree, no publication, and no speaking engagement. Unverifiable claims are never published on this site.",
    practiceAreasLink: "Practice areas →",
    contactLink: "Contact →",
    disclaimer:
      "This page describes a professional background for information purposes. It is not legal advice and does not create an attorney–client relationship.",
    sections: [
      {
        heading: "Professional profile",
        lines: [
          "{{OWNER: two to four sentences describing your professional profile in your own words — who you are, what you do, and what this site is for}}",
        ],
      },
      {
        heading: "Admission and professional title",
        lines: [
          "Bar admission: {{OWNER: bar (barreau) of admission, registration number, and the date and jurisdiction of each admission held}}",
          "Professional title: {{OWNER: professional title(s) held and the authority or jurisdiction that granted each one}}",
          "Scope of practice: {{OWNER: any jurisdiction in which you are not admitted to practise and which should be stated explicitly here}}",
        ],
      },
      {
        heading: "Career",
        lines: [
          "{{OWNER: professional positions held — employer, role, and dates for each; list only what can be verified}}",
        ],
      },
      {
        heading: "Education",
        lines: [
          "{{OWNER: degrees held, with awarding institution and year for each}}",
          "{{OWNER: additional certifications or professional training to list, if any}}",
        ],
      },
      {
        heading: "Focus areas",
        lines: [
          "{{OWNER: the legal areas you actually practise or research in, described in your own words}}",
          "The domains this platform monitors are listed separately, with their coverage status.",
        ],
      },
      {
        heading: "Languages",
        lines: [
          "{{OWNER: working languages and the level of professional practice in each}}",
        ],
      },
      {
        heading: "Publications, speaking, and teaching",
        lines: [
          "{{OWNER: publications, talks, and teaching, each with title, publisher or venue, and date — leave this section empty if there is nothing verifiable to list}}",
          "Nothing appears in this section until verifiable references are supplied. This site does not publish claimed credentials.",
        ],
      },
    ] as Block[],
  },
  fr: {
    eyebrow: "Profil",
    title: "À propos",
    description:
      "Le parcours professionnel derrière ce site. Cette page est une structure en attente de contenu fourni par le titulaire — rien n'y est affirmé tant que cela ne peut pas être énoncé avec exactitude.",
    draftLabel: "En attente de contenu",
    draftBody:
      "Chaque champ marqué {{OWNER: …}} est une information que seul le titulaire du site peut fournir. Rien n'a été rédigé à sa place : ni biographie, ni parcours, ni inscription au barreau, ni diplôme, ni publication, ni intervention. Aucune affirmation invérifiable n'est publiée sur ce site.",
    practiceAreasLink: "Domaines de pratique →",
    contactLink: "Contact →",
    disclaimer:
      "Cette page décrit un parcours professionnel à titre informatif. Elle ne constitue pas un conseil juridique et ne crée aucune relation avocat–client.",
    sections: [
      {
        heading: "Profil professionnel",
        lines: [
          "{{OWNER: two to four sentences describing your professional profile in your own words — who you are, what you do, and what this site is for}}",
        ],
      },
      {
        heading: "Inscription et titre professionnel",
        lines: [
          "Inscription au barreau : {{OWNER: bar (barreau) of admission, registration number, and the date and jurisdiction of each admission held}}",
          "Titre professionnel : {{OWNER: professional title(s) held and the authority or jurisdiction that granted each one}}",
          "Périmètre d'exercice : {{OWNER: any jurisdiction in which you are not admitted to practise and which should be stated explicitly here}}",
        ],
      },
      {
        heading: "Parcours",
        lines: [
          "{{OWNER: professional positions held — employer, role, and dates for each; list only what can be verified}}",
        ],
      },
      {
        heading: "Formation",
        lines: [
          "{{OWNER: degrees held, with awarding institution and year for each}}",
          "{{OWNER: additional certifications or professional training to list, if any}}",
        ],
      },
      {
        heading: "Domaines d'intervention",
        lines: [
          "{{OWNER: the legal areas you actually practise or research in, described in your own words}}",
          "Les domaines suivis par cette plateforme sont présentés séparément, avec leur état de couverture.",
        ],
      },
      {
        heading: "Langues",
        lines: [
          "{{OWNER: working languages and the level of professional practice in each}}",
        ],
      },
      {
        heading: "Publications, interventions et enseignement",
        lines: [
          "{{OWNER: publications, talks, and teaching, each with title, publisher or venue, and date — leave this section empty if there is nothing verifiable to list}}",
          "Rien n'apparaît dans cette section tant que des références vérifiables n'ont pas été fournies. Ce site ne publie pas de titres allégués.",
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

export default async function AboutPage({
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
        <div className="flex flex-wrap items-center gap-5 border-t border-white/8 pt-6">
          <Link
            href={localeHref(lang, "/practice-areas")}
            className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/45 underline decoration-white/15 underline-offset-4 hover:text-white/80"
          >
            {t.practiceAreasLink}
          </Link>
          <Link
            href={localeHref(lang, "/contact")}
            className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-white/45 underline decoration-white/15 underline-offset-4 hover:text-white/80"
          >
            {t.contactLink}
          </Link>
        </div>
      </MotionReveal>

      <MotionReveal>
        <p className="max-w-3xl text-xs leading-6 text-white/45">{t.disclaimer}</p>
      </MotionReveal>
    </SiteShell>
  );
}
