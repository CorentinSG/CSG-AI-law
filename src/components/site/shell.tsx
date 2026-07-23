import type { ReactNode } from "react";

import { CursorBot } from "@/components/site/cursor-bot";
import { PageTransition } from "@/components/site/page-transition";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteNotice } from "@/components/site/site-notice";
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
          : "dark-site bg-[radial-gradient(circle_at_top,_rgba(154,107,31,0.06),_transparent_22%),linear-gradient(180deg,_#080808_0%,_#0a0a0a_100%)] text-zinc-100",
      )}
    >
      {!isAdmin ? <CursorBot /> : null}
      {!isAdmin ? <SiteNotice /> : null}
      <SiteHeader variant={variant} />
      <PageTransition>
        <main
          className={cn(
            "mx-auto w-full max-w-7xl px-6 py-10 md:py-16",
            className,
          )}
        >
          {children}
        </main>
      </PageTransition>
      {showFooter ? <SiteFooter /> : null}
    </div>
  );
}
