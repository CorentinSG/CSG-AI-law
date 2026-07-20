import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactExperience } from "@/components/site/contact-experience";
import { SiteShell } from "@/components/site/shell";
import { isLocale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Professional contact for research collaborations, writing, speaking, and inquiries related to AI law and legal intelligence.",
};

// Single place to change the published contact address.
const CONTACT_EMAIL = "corentinsaintgirons18@gmail.com";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <SiteShell>
      <ContactExperience lang={lang} email={CONTACT_EMAIL} />
    </SiteShell>
  );
}
