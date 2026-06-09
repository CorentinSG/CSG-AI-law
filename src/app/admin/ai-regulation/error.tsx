"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminAiRegulationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Always log admin errors — these are internal surfaces.
    console.error("[AdminAiRegulationError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">
        Private admin review · AI Regulation Monitoring Agent
      </p>
      <h2 className="mt-4 font-serif text-2xl text-white">
        Admin page failed to load
      </h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-zinc-400">
        An error occurred while loading the admin review desk. No data was
        mutated. You can try reloading or return to the main admin queue.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm text-zinc-200 transition hover:bg-white/15"
        >
          Try again
        </button>
        <Link
          href="/admin/ai-regulation"
          className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm text-zinc-200 transition hover:bg-white/15"
        >
          Back to review desk
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-5 font-mono text-[10px] text-zinc-500">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
