import Link from "next/link";
import { cn } from "@/lib/utils";
import { type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

interface BreadcrumbItem {
  label: string;
  /** Unprefixed app path, e.g. `/ai-regulation`. The locale segment is added
   * here — never pre-prefix it at the call site or it double-prefixes. */
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Required on purpose. This used to default to `en`, so any call site that
   * forgot it silently rendered every crumb as `/en/…` and bounced French
   * readers back to English. A required prop makes that a build error. */
  lang: Locale;
}

/**
 * Hierarchical breadcrumb navigation.
 * All items except the last are rendered as links; the last is the current page.
 */
export function BreadcrumbNav({ items, className, lang }: BreadcrumbNavProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={lang === "fr" ? "Fil d'Ariane" : "Breadcrumb"} className={cn("mb-3 flex flex-wrap items-center gap-2.5", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-2.5">
            {index > 0 ? (
              <span className="font-mono text-[9px] text-zinc-200" aria-hidden>
                /
              </span>
            ) : null}
            {isLast ? (
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                {item.label}
              </span>
            ) : (
              <Link
                href={localeHref(lang, item.href)}
                className="group relative font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400 transition-colors duration-200 hover:text-zinc-700"
              >
                {item.label}
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-zinc-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                />
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
