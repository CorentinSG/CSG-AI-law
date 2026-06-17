'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Globe,
  Home,
  Landmark,
  Mail,
  Menu,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";

import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const publicNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/ai-regulation", label: "Hub", icon: Scale },
  { href: "/ai-regulation/europe", label: "Europe", icon: Globe },
  { href: "/ai-regulation/united-states", label: "US", icon: Landmark },
  { href: "/research", label: "Notes", icon: FileText },
  { href: "/standards", label: "Standards", icon: ShieldCheck },
  { href: "/contact", label: "Contact", icon: Mail },
];

const adminNavItems: NavItem[] = [
  { href: "/", label: "Site", icon: Home },
  { href: "/ai-regulation", label: "Hub", icon: Scale },
  { href: "/admin/ai-regulation", label: "Review", icon: ShieldCheck },
  { href: "/admin/ai-regulation/news", label: "News", icon: Sparkles },
];

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function SiteHeader({
  variant = "public",
}: {
  variant?: "public" | "admin";
}) {
  const pathname = usePathname();
  const navItems = variant === "admin" ? adminNavItems : publicNavItems;
  const isAdmin = variant === "admin";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll-progress bar
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Only the most specific matching item is active (longest matching href),
  // so a parent like "/ai-regulation" doesn't also light up on "/ai-regulation/europe".
  const activeHref = navItems.reduce<string | null>((best, item) => {
    const matches =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname?.startsWith(`${item.href}/`);
    if (!matches) return best;
    if (!best || item.href.length > best.length) return item.href;
    return best;
  }, null);

  const isActive = (href: string) => href === activeHref;

  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease }}
      className={cn(
        "sticky top-0 z-50 transition-[background,border,box-shadow] duration-500",
        scrolled
          ? isAdmin
            ? "border-b border-white/10 bg-[rgba(6,7,11,0.82)] shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
            : "border-b border-black/5 bg-[rgba(247,246,241,0.72)] shadow-[0_10px_40px_rgba(15,15,15,0.06)] backdrop-blur-2xl"
          : "border-b border-transparent bg-transparent backdrop-blur-0",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 transition-[padding] duration-500",
          scrolled ? "py-3" : "py-5 md:py-6",
        )}
      >
        {/* Brand */}
        <Link href="/" className="group flex flex-col">
          <span
            className={cn(
              "font-display font-medium uppercase tracking-[-0.05em] transition-[font-size] duration-500",
              scrolled ? "text-[1rem]" : "text-[1.15rem]",
              isAdmin ? "text-white" : "text-zinc-950",
            )}
          >
            C. Saint-Girons, Esq
          </span>
          <AnimatePresence initial={false}>
            {!scrolled ? (
              <motion.span
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease }}
                className={cn(
                  "overflow-hidden text-[11px] uppercase tracking-[0.28em]",
                  isAdmin ? "text-zinc-500" : "text-zinc-500/90",
                )}
              >
                AI Law &amp; Legal Intelligence
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Link>

        {/* Desktop nav */}
        <nav
          className={cn(
            "hidden items-center gap-1 rounded-full px-1.5 py-1.5 lg:flex",
            scrolled
              ? "border border-transparent bg-transparent"
              : isAdmin
                ? "border border-white/10 bg-white/5"
                : "border border-black/5 bg-white/40 backdrop-blur-md",
          )}
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                scroll={false}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] tracking-[0.02em] transition-colors",
                  active
                    ? isAdmin
                      ? "text-white"
                      : "text-zinc-950"
                    : isAdmin
                      ? "text-zinc-400 hover:text-white"
                      : "text-zinc-500 hover:text-zinc-950",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId={`nav-pill-${variant}`}
                    className={cn(
                      "absolute inset-0 -z-10 rounded-full",
                      isAdmin
                        ? "bg-white/12"
                        : "bg-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full border lg:hidden",
            isAdmin
              ? "border-white/15 bg-white/5 text-white"
              : "border-black/8 bg-white/60 text-zinc-900 backdrop-blur-md",
          )}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <motion.span
            animate={{ rotate: menuOpen ? 90 : 0, opacity: menuOpen ? 0 : 1 }}
            transition={{ duration: 0.3, ease }}
            className="absolute"
          >
            <Menu className="h-5 w-5" />
          </motion.span>
          <motion.span
            animate={{ rotate: menuOpen ? 0 : -90, opacity: menuOpen ? 1 : 0 }}
            transition={{ duration: 0.3, ease }}
            className="absolute"
          >
            <X className="h-5 w-5" />
          </motion.span>
        </button>
      </div>

      {/* Scroll progress bar */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className={cn(
          "h-px origin-left",
          isAdmin
            ? "bg-gradient-to-r from-amber-300/60 via-amber-200/40 to-transparent"
            : "bg-gradient-to-r from-zinc-900/40 via-zinc-900/20 to-transparent",
        )}
      />

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease }}
            className={cn(
              "absolute inset-x-0 top-full origin-top border-b px-6 py-4 lg:hidden",
              isAdmin
                ? "border-white/10 bg-[rgba(6,7,11,0.96)] backdrop-blur-2xl"
                : "border-black/5 bg-[rgba(247,246,241,0.96)] backdrop-blur-2xl",
            )}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {navItems.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.32, ease, delay: 0.04 * i }}
                  >
                    <Link
                      href={item.href}
                      scroll={false}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] transition-colors",
                        active
                          ? isAdmin
                            ? "bg-white/10 text-white"
                            : "bg-black/[0.06] text-zinc-950"
                          : isAdmin
                            ? "text-zinc-400 hover:text-white"
                            : "text-zinc-500 hover:text-zinc-950",
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
