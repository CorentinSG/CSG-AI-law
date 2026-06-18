import Link from "next/link";

// Branded 404 for the public site. Mirrors the standalone full-screen styling of
// error.tsx (no SiteShell) so an unknown route still feels on-brand.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(180deg,_#f6f6f3_0%,_#efefeb_48%,_#ecece8_100%)] px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-400">
        C. Saint-Girons, Esq · AI Law &amp; Legal Intelligence
      </p>
      <p className="mt-6 font-mono text-sm uppercase tracking-[0.3em] text-zinc-400">
        404
      </p>
      <h1 className="mt-3 font-serif text-3xl text-zinc-900">Page not found</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-zinc-500">
        The page you are looking for does not exist or has moved. No legal data
        was affected. Use the links below to get back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Back to homepage
        </Link>
        <Link
          href="/ai-regulation"
          className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Open AI Law Hub
        </Link>
      </div>
    </div>
  );
}
