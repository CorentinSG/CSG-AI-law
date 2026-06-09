"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalError]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(180deg,_#f6f6f3_0%,_#efefeb_48%,_#ecece8_100%)] px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-400">
        C. Saint-Girons, Esq · AI Law &amp; Legal Intelligence
      </p>
      <h1 className="mt-6 font-serif text-3xl text-zinc-900">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-zinc-500">
        An unexpected error occurred. No legal data was altered. Please try
        again or return to the homepage.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          Back to homepage
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-6 font-mono text-[10px] text-zinc-400">
          Error reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
