import Link from "next/link";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
  lang?: Locale;
}

/**
 * Hierarchical breadcrumb navigation.
 * All items except the last are rendered as links; the last is the current page.
 */
export function BreadcrumbNav({ items, className, lang = DEFAULT_LOCALE }: BreadcrumbNavProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span className="font-mono text-[9px] text-zinc-300" aria-hidden>
                /
              </span>
            ) : null}
            {isLast ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
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
