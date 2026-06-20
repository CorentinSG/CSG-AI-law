import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

// Branded 404 for the public site. Mirrors the standalone full-screen styling of
// error.tsx (no SiteShell) so an unknown route still feels on-brand.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(180deg,_#f6f6f3_0%,_#efefeb_48%,_#ecece8_100%)] px-6 text-center">
      {/* Large editorial 404 number */}
      <p
        className="select-none font-display text-[clamp(7rem,20vw,14rem)] font-medium leading-none tracking-[-0.06em] text-zinc-200"
        aria-hidden
      >
        404
      </p>

      {/* Brand line */}
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-400">
        C. Saint-Girons, Esq · AI Law &amp; Legal Intelligence
      </p>

      {/* Accent rule */}
      <div className="accent-rule mx-auto mt-6 w-24" aria-hidden />

      {/* Heading */}
      <h1 className="mt-6 font-serif text-2xl text-zinc-900 md:text-3xl">
        Page not found
      </h1>

      {/* Body */}
      <p className="mt-4 max-w-sm text-sm leading-7 text-zinc-500">
        The page you are looking for does not exist or has moved. No legal data
        was affected.
      </p>

      {/* CTAs */}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.98]"
        >
          <ArrowLeft className="size-3.5" />
          Back to homepage
        </Link>
        <Link
          href="/ai-regulation"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm text-zinc-700 shadow-sm transition hover:border-black/20 hover:bg-zinc-50 active:scale-[0.98]"
        >
          Open AI Law Hub
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
