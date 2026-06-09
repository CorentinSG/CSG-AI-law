import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Hierarchical breadcrumb navigation.
 * All items except the last are rendered as links; the last is the current page.
 */
export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
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
                href={item.href}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-700"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
