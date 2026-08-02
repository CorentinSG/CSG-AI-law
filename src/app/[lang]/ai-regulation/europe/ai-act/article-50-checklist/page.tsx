import { notFound, redirect } from "next/navigation";

import { isLocale } from "@/lib/i18n/config";

// The checklist moved out of this route subtree: statically-rendered pages
// under /ai-regulation currently ship without client hydration in production
// (see AI_TASKS.md T-A50-HYDRATION), which froze every interactive control.
// Server-side redirects are unaffected by that bug, so the old URL keeps
// working.
export default async function LegacyArticle50ChecklistRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  redirect(`/${lang}/eu-ai-act/article-50-checklist`);
}
