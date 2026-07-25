import type { Metadata } from "next";

import { ContactExperience } from "@/components/site/contact-experience";
import { SiteShell } from "@/components/site/shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const fr = lang === "fr";
  return {
    title: "Contact",
    description: fr
      ? "Contact professionnel pour collaborations de recherche, écriture, interventions et demandes liées au droit de l'IA et à l'intelligence juridique."
      : "Professional contact for research collaborations, writing, speaking, and inquiries related to AI law and legal intelligence.",
  };
}

// Single place to change the published contact address.
const CONTACT_EMAIL = "corentin.stgirons@gmail.com";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <SiteShell>
      <ContactExperience email={CONTACT_EMAIL} lang={lang === "fr" ? "fr" : "en"} />
    </SiteShell>
  );
}
