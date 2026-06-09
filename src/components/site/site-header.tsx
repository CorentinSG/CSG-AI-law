'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/ai-regulation", label: "AI Law Hub" },
  { href: "/ai-regulation/europe", label: "Europe" },
  { href: "/ai-regulation/united-states", label: "United States" },
  { href: "/research", label: "Notes" },
  { href: "/standards", label: "Standards" },
  { href: "/contact", label: "Contact" },
];

const adminNavItems = [
  { href: "/", label: "Public site" },
  { href: "/ai-regulation", label: "Public AI law hub" },
  { href: "/admin/ai-regulation", label: "Admin review" },
  { href: "/admin/ai-regulation/news", label: "News review" },
];

export function SiteHeader({
  variant = "public",
}: {
  variant?: "public" | "admin";
}) {
  const pathname = usePathname();
  const navItems = variant === "admin" ? adminNavItems : publicNavItems;
  const isAdmin = variant === "admin";
  const shouldAutoCollapse = useMemo(() => {
    if (!pathname) return false;

    return (
      /^\/research\/[^/]+/.test(pathname) ||
      /^\/news\/[^/]+/.test(pathname) ||
      /^\/ai-regulation\/[^/]+$/.test(pathname) ||
      /^\/ai-regulation\/europe\/[^/]+/.test(pathname) ||
      /^\/ai-regulation\/united-states\/[^/]+/.test(pathname)
    );
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 backdrop-blur-2xl",
          isAdmin
            ? "border-b border-white/10 bg-[rgba(6,7,11,0.86)]"
            : "border-b border-white/8 bg-[rgba(255,255,255,0.04)]",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="space-y-1">
            <Link
              href="/"
              className={cn(
                "font-display text-[1.15rem] font-medium uppercase tracking-[-0.05em]",
                isAdmin ? "text-white" : "text-zinc-950",
              )}
            >
              C. Saint-Girons, Esq
            </Link>
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em]",
                isAdmin ? "text-zinc-500" : "text-zinc-500/90",
              )}
            >
              <span>AI Law &amp; Legal Intelligence</span>
              {variant === "admin" ? (
                <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-1 tracking-[0.22em] text-amber-100">
                  Private admin
                </span>
              ) : null}
            </div>
          </div>

          <nav
          className={cn(
            "glass-panel-soft flex-wrap items-center gap-3 rounded-full px-4 py-2 text-sm",
            isAdmin ? "hidden sm:flex" : "flex lg:hidden",
            isAdmin ? "text-zinc-300" : "text-zinc-700",
          )}
        >
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  scroll={false}
                  className={cn(
                    "rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
                    active
                      ? isAdmin
                        ? "bg-white/10 text-white"
                        : "bg-black/6 text-zinc-950"
                      : isAdmin
                        ? "text-zinc-400 hover:text-white"
                        : "text-zinc-500 hover:text-zinc-950",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {!isAdmin ? (
        <aside className="pointer-events-none fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
          <DesktopPublicNav
            key={pathname ?? "public-nav"}
            pathname={pathname}
            navItems={navItems}
            defaultCollapsed={shouldAutoCollapse}
          />
        </aside>
      ) : null}
    </>
  );
}

function DesktopPublicNav({
  pathname,
  navItems,
  defaultCollapsed,
}: {
  pathname: string | null;
  navItems: { href: string; label: string }[];
  defaultCollapsed: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.nav
      className={cn(
        "glass-rail noise-overlay pointer-events-auto relative flex flex-col gap-2 overflow-hidden rounded-[2rem] px-3 py-3",
      )}
      initial={false}
      animate={{
        width: isCollapsed ? 84 : 208,
        boxShadow: isCollapsed
          ? "0 18px 48px rgba(15,15,15,0.08)"
          : "0 26px 60px rgba(15,15,15,0.12)",
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-3 h-16 rounded-full bg-[radial-gradient(circle_at_center,rgba(129,212,250,0.2),transparent_72%)]"
        initial={false}
        animate={
          prefersReducedMotion
            ? { opacity: 0.35 }
            : {
                opacity: isCollapsed ? 0.18 : 0.42,
                scale: isCollapsed ? 0.92 : 1.06,
              }
        }
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <AnimatePresence initial={false}>
          {!isCollapsed ? (
            <motion.div
              key="nav-label"
              initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Navigation
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                Toujours accessible pendant le scroll
              </p>
            </motion.div>
          ) : (
            <div key="nav-spacer" className="h-4" />
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/55 text-zinc-900 transition hover:bg-white/80"
          aria-label={isCollapsed ? "Expand navigation menu" : "Collapse navigation menu"}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {!isCollapsed ? (
          <motion.div
            key="collapse-note"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="px-1 pb-1"
          >
            <div className="rounded-2xl border border-white/10 bg-white/35 px-3 py-2 text-[11px] text-zinc-500 backdrop-blur-sm">
              {defaultCollapsed
                ? "Mode compact active sur les pages denses."
                : "Repli manuel disponible pour une lecture plus minimaliste."}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === item.href
            : pathname?.startsWith(item.href);
        const compactLabel = item.label
          .split(/[\s/&-]+/)
          .filter(Boolean)
          .map((chunk) => chunk[0])
          .join("")
          .slice(0, 3);

        return (
          <motion.div
            key={item.href}
            initial={false}
            animate={
              prefersReducedMotion
                ? {}
                : { opacity: 1, x: 0, scale: active ? 1.01 : 1 }
            }
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={item.href}
              scroll={false}
              className={cn(
                "rounded-2xl font-mono text-[11px] uppercase tracking-[0.18em] transition-all",
                isCollapsed
                  ? "flex h-12 items-center justify-center px-2 py-2"
                  : "px-4 py-3",
                active
                  ? "bg-white/58 text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
                  : "text-zinc-500 hover:bg-white/32 hover:text-zinc-950",
              )}
              aria-label={item.label}
              title={item.label}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCollapsed ? (
                  <motion.span
                    key="compact"
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.18 }}
                  >
                    {compactLabel}
                  </motion.span>
                ) : (
                  <motion.span
                    key="full"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? {} : { opacity: 0, y: 4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </motion.div>
        );
      })}
    </motion.nav>
  );
}
