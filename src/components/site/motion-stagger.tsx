'use client';

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function MotionStagger({
  children,
  className,
  delay = 0,
  stagger = 0.1,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      // Animate on mount, not on scroll-into-view — see MotionReveal: the
      // page-transition transform breaks in-view detection for on-screen content.
      initial={reduced ? false : "hidden"}
      animate={reduced ? undefined : "visible"}
      transition={{ staggerChildren: reduced ? 0 : stagger, delayChildren: delay }}
      variants={{ hidden: {}, visible: {} }}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.75, ease },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
