"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AiRegulationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[AiRegulationError]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-400">
        AI Legal Intelligence Hub
      </p>
      <h2 className="mt-4 font-serif text-2xl text-zinc-900">
        Unable to load this page
      </h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-zinc-500">
        The intelligence hub encountered an error while loading. No published
        legal data was affected. You can try again or return to the hub.
      </p>
      <div className="mt-6 flex gap-4">
        <button
          onClick={reset}
          className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-400"
        >
          Try again
        </button>
        <Link
          href="/ai-regulation"
          className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-400"
        >
          Back to AI Law Hub
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-5 font-mono text-[10px] text-zinc-400">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
