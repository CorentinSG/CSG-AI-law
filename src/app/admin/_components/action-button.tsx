"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Submit button for admin server-action forms. Shows a spinner and disables
 * itself while the action runs so one-click operations read as "in progress".
 */
export function PendingButton({
  children,
  pendingLabel = "Working…",
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-60",
        className,
      )}
    >
      {pending ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
        />
      ) : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
