'use client';

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function MotionReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      // Animate on mount rather than on scroll-into-view: the page-transition
      // wrapper transforms the whole page, which prevents the in-view observer
      // from firing for content already on screen (it would stay hidden until a
      // manual scroll).
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
