'use client';

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -14, filter: "blur(10px)" }}
        transition={{ duration: 0.85, ease }}
        className="relative"
      >
        <motion.div
          className="pointer-events-none fixed inset-0 z-[60] bg-[linear-gradient(180deg,rgba(244,244,240,0.82),rgba(244,244,240,0.24),transparent)]"
          initial={{ opacity: 0.92, scaleY: 1, transformOrigin: "top" }}
          animate={{ opacity: 0, scaleY: 0.86 }}
          transition={{ duration: 0.9, ease }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
