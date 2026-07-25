import type { Metadata } from "next";

import { ContactExperience } from "@/components/site/contact-experience";
import { SiteShell } from "@/components/site/shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Professional contact for research collaborations, writing, speaking, and inquiries related to AI law and legal intelligence.",
};

// Single place to change the published contact address.
const CONTACT_EMAIL = "corentin.stgirons@gmail.com";

export default function ContactPage() {
  return (
    <SiteShell>
      <ContactExperience email={CONTACT_EMAIL} />
    </SiteShell>
  );
}
