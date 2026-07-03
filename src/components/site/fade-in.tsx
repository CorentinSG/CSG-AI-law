"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = 1000, className }: FadeInProps) {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [reduced, delay]);

  const shown = visible || reduced;

  return (
    <div
      className={cn("transition-opacity", className)}
      style={{
        opacity: shown ? 1 : 0,
        transitionDuration: reduced ? "0ms" : `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
