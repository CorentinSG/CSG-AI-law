'use client';

import { Bot } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function CursorBot() {
  const [visible, setVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const x = useSpring(mouseX, { stiffness: 90, damping: 22, mass: 0.6 });
  const y = useSpring(mouseY, { stiffness: 90, damping: 22, mass: 0.6 });

  const haloX = useTransform(x, (value) => value - 22);
  const haloY = useTransform(y, (value) => value - 22);
  const botX = useTransform(x, (value) => value - 12);
  const botY = useTransform(y, (value) => value - 12);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    if (!media.matches) return;

    const handleMove = (event: MouseEvent) => {
      mouseX.set(event.clientX + 22);
      mouseY.set(event.clientY - 26);
      setVisible(true);
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseout", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseout", handleLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 hidden lg:block" aria-hidden="true">
      <motion.div
        className="absolute size-11 rounded-full bg-[radial-gradient(circle,_rgba(186,176,154,0.26),_rgba(255,255,255,0))] blur-xl"
        style={{ x: haloX, y: haloY }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="glass-panel-soft absolute flex size-6 items-center justify-center rounded-full border border-white/60 text-zinc-800 shadow-[0_14px_32px_rgba(15,15,15,0.08)]"
        style={{ x: botX, y: botY }}
        animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.88 }}
        transition={{ duration: 0.22 }}
      >
        <Bot className="size-3.5" strokeWidth={1.8} />
      </motion.div>
    </div>
  );
}
