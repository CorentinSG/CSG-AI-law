import type { ReactNode } from "react";

import { CursorBot } from "@/components/site/cursor-bot";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { cn } from "@/lib/utils";

export function SiteShell({
  children,
  className,
  variant = "public",
  showFooter = true,
}: {
  children: ReactNode;
  className?: string;
  variant?: "public" | "admin";
  showFooter?: boolean;
}) {
  const isAdmin = variant === "admin";

  return (
    <div
      className={cn(
        "min-h-screen",
        isAdmin
          ? "bg-[radial-gradient(circle_at_top,_rgba(183,194,225,0.12),_transparent_20%),linear-gradient(180deg,_#090a0f_0%,_#07080c_42%,_#09090b_100%)] text-zinc-100"
          : "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(238,239,235,0)_26%),linear-gradient(180deg,_#f6f6f3_0%,_#efefeb_48%,_#ecece8_100%)] text-zinc-950",
      )}
    >
      {!isAdmin ? <CursorBot /> : null}
      <SiteHeader variant={variant} />
      <main
        className={cn(
          "mx-auto w-full max-w-7xl px-6 py-10 md:py-16",
          !isAdmin && "lg:pl-36 xl:pl-44",
          className,
        )}
      >
        {children}
      </main>
      {showFooter ? <SiteFooter /> : null}
    </div>
  );
}
