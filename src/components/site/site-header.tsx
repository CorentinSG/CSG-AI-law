'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  FileText,
  Globe,
  Home,
  Landmark,
  Mail,
  Menu,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";

import { SiteSearch } from "@/components/site/site-search";
import { cn } from "@/lib/utils";

type NavLeaf = { href: string; label: string; icon: LucideIcon; hint?: string };
type NavGroup = { label: string; icon: LucideIcon; match: string; children: NavLeaf[] };
type NavNode = NavLeaf | NavGroup;

const isGroup = (node: NavNode): node is NavGroup => "children" in node;

const publicNav: NavNode[] = [
  { href: "/", label: "Home", icon: Home },
  {
    label: "AI Law",
    icon: Scale,
    match: "/ai-regulation",
    children: [
      { href: "/ai-regulation", label: "Hub overview", icon: Scale },
      { href: "/ai-regulation/europe", label: "Europe", icon: Globe },
      { href: "/ai-regulation/united-states", label: "United States", icon: Landmark },
    ],
  },
  { href: "/research", label: "Notes", icon: FileText },
  { href: "/standards", label: "Standards", icon: ShieldCheck },
  { href: "/contact", label: "Contact", icon: Mail },
];

const adminNav: NavNode[] = [
  { href: "/", label: "Site", icon: Home },
  { href: "/ai-regulation", label: "Hub", icon: Scale },
  { href: "/admin/ai-regulation", label: "Review", icon: ShieldCheck },
  { href: "/admin/ai-regulation/news", label: "News", icon: Sparkles },
];

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function openSearch() {
  window.dispatchEvent(new Event("site-search:open"));
}

export function SiteHeader({
  variant = "public",
}: {
  variant?: "public" | "admin";
}) {
  const pathname = usePathname();
  const nav = variant === "admin" ? adminNav : publicNav;
  const isAdmin = variant === "admin";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nodeActive = (node: NavNode) =>
    isGroup(node)
      ? pathname === node.match || pathname?.startsWith(`${node.match}`)
      : node.href === "/"
        ? pathname === "/"
        : pathname === node.href || pathname?.startsWith(`${node.href}/`);

  const linkTone = (active: boolean) =>
    active
      ? isAdmin
        ? "text-white"
        : "text-zinc-950"
      : isAdmin
        ? "text-zinc-400 hover:text-white"
        : "text-zinc-500 hover:text-zinc-950";

  const activePill = (
    <motion.span
      layoutId={`nav-pill-${variant}`}
      className={cn(
        "absolute inset-0 -z-10 rounded-full",
        isAdmin ? "bg-white/12" : "bg-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
      )}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    />
  );

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
      <SiteSearch />
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
          {nav.map((node) => {
            const active = Boolean(nodeActive(node));
            if (!isGroup(node)) {
              return (
                <Link
                  key={node.href}
                  href={node.href}
                  scroll={false}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] tracking-[0.02em] transition-colors",
                    linkTone(active),
                  )}
                >
                  {active ? activePill : null}
                  <node.icon className="h-4 w-4" />
                  {node.label}
                </Link>
              );
            }
            const open = groupOpen === node.label;
            return (
              <div key={node.label} className="relative">
                <button
                  type="button"
                  onClick={() => setGroupOpen(open ? null : node.label)}
                  aria-expanded={open}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] tracking-[0.02em] transition-colors",
                    linkTone(active || open),
                  )}
                >
                  {active ? activePill : null}
                  <node.icon className="h-4 w-4" />
                  {node.label}
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                  />
                </button>
                <AnimatePresence>
                  {open ? (
                    <>
                      <button
                        type="button"
                        aria-hidden
                        tabIndex={-1}
                        onClick={() => setGroupOpen(null)}
                        className="fixed inset-0 z-[54] cursor-default"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.22, ease }}
                        className={cn(
                          "absolute left-0 top-[calc(100%+0.5rem)] z-[55] w-64 origin-top-left overflow-hidden rounded-2xl border p-1.5 shadow-[0_24px_60px_rgba(15,15,15,0.14)]",
                          isAdmin
                            ? "border-white/10 bg-[rgba(10,12,18,0.96)] backdrop-blur-2xl"
                            : "border-black/8 bg-[rgba(247,246,241,0.97)] backdrop-blur-2xl",
                        )}
                      >
                        {node.children.map((child) => {
                          const childActive =
                            pathname === child.href ||
                            (child.href !== "/ai-regulation" &&
                              pathname?.startsWith(`${child.href}/`));
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              scroll={false}
                              onClick={() => setGroupOpen(null)}
                              className={cn(
                                "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                                childActive
                                  ? "bg-accent-soft"
                                  : isAdmin
                                    ? "hover:bg-white/5"
                                    : "hover:bg-black/[0.04]",
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                                  childActive
                                    ? "bg-accent text-white"
                                    : isAdmin
                                      ? "bg-white/10 text-zinc-300"
                                      : "bg-black/[0.05] text-zinc-600",
                                )}
                              >
                                <child.icon className="h-4 w-4" />
                              </span>
                              <span>
                                <span
                                  className={cn(
                                    "block text-sm font-medium",
                                    isAdmin ? "text-zinc-100" : "text-zinc-900",
                                  )}
                                >
                                  {child.label}
                                </span>
                                {child.hint ? (
                                  <span className="block text-[12px] text-zinc-500">
                                    {child.hint}
                                  </span>
                                ) : null}
                              </span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    </>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Right cluster: search + mobile toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            className={cn(
              "hidden items-center gap-2 rounded-full border px-3 py-2 text-[12px] transition lg:flex",
              isAdmin
                ? "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                : "border-black/8 bg-white/50 text-zinc-500 backdrop-blur-md hover:text-zinc-900",
            )}
            aria-label="Search the site"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <span className="rounded border border-black/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              ⌘K
            </span>
          </button>

          {/* Mobile: search + hamburger */}
          <button
            type="button"
            onClick={openSearch}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border lg:hidden",
              isAdmin
                ? "border-white/15 bg-white/5 text-white"
                : "border-black/8 bg-white/60 text-zinc-900 backdrop-blur-md",
            )}
            aria-label="Search the site"
          >
            <Search className="h-5 w-5" />
          </button>
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
      </div>

      {/* Scroll progress bar */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className={cn(
          "h-px origin-left",
          isAdmin
            ? "bg-gradient-to-r from-amber-300/60 via-amber-200/40 to-transparent"
            : "bg-gradient-to-r from-accent/70 via-accent/30 to-transparent",
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
              {nav.map((node, i) => {
                if (!isGroup(node)) {
                  const active = Boolean(nodeActive(node));
                  return (
                    <motion.div
                      key={node.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.32, ease, delay: 0.04 * i }}
                    >
                      <Link
                        href={node.href}
                        scroll={false}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] transition-colors",
                          active
                            ? isAdmin
                              ? "bg-white/10 text-white"
                              : "bg-black/[0.06] text-zinc-950"
                            : linkTone(false),
                        )}
                      >
                        <node.icon className="h-[18px] w-[18px]" />
                        {node.label}
                      </Link>
                    </motion.div>
                  );
                }
                return (
                  <motion.div
                    key={node.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.32, ease, delay: 0.04 * i }}
                    className="mt-1"
                  >
                    <p className="flex items-center gap-2 px-4 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">
                      <node.icon className="h-3.5 w-3.5" />
                      {node.label}
                    </p>
                    {node.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        scroll={false}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "ml-3 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[14px] transition-colors",
                          pathname?.startsWith(child.href) && child.href !== "/ai-regulation"
                            ? "bg-black/[0.06] text-zinc-950"
                            : pathname === child.href
                              ? "bg-black/[0.06] text-zinc-950"
                              : linkTone(false),
                        )}
                      >
                        <child.icon className="h-[18px] w-[18px]" />
                        {child.label}
                      </Link>
                    ))}
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
