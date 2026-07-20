"use client";

import { useEffect } from "react";

/**
 * Stamps the active locale onto <html lang>. The root layout renders the
 * <html> element outside the [lang] segment, so it cannot know the locale;
 * until the layout is restructured this keeps screen readers and crawlers
 * from reading French pages with lang="en" (WCAG 3.1.1).
 */
export function LangAttribute({ lang }: { lang: string }) {
  useEffect(() => {
    if (lang) document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
