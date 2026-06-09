'use client';

import type { ElementType, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type ScrollTextRevealMode = "letters" | "words" | "paragraph";

type ScrollTextRevealProps<T extends ElementType = "p"> = {
  text: string;
  mode?: ScrollTextRevealMode;
  stagger?: number;
  duration?: number;
  className?: string;
  blur?: boolean;
  as?: T;
};

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function splitText(text: string, mode: ScrollTextRevealMode) {
  if (mode === "paragraph") return [text];
  if (mode === "words") return text.split(/(\s+)/);
  return Array.from(text);
}

export function ScrollTextReveal<T extends ElementType = "p">({
  text,
  mode = "words",
  stagger = 0.045,
  duration = 0.8,
  className,
  blur = true,
  as,
}: ScrollTextRevealProps<T>) {
  const Tag = (as ?? "p") as ElementType;
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  const parts = splitText(text, mode);

  if (mode === "paragraph") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, filter: blur ? "blur(8px)" : "blur(0px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration, ease }}
      >
        <Tag className={className}>{text}</Tag>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.45 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
    >
      <Tag className={cn("flex flex-wrap", className)}>
        {parts.map((part, index) => {
          const isWhitespace = /^\s+$/.test(part);
          const content: ReactNode = isWhitespace ? "\u00A0" : part;

          return (
            <motion.span
              key={`${part}-${index}`}
              className="inline-block"
              variants={{
                hidden: {
                  opacity: 0,
                  y: 20,
                  filter: blur ? "blur(8px)" : "blur(0px)",
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration, ease },
                },
              }}
            >
              {content}
            </motion.span>
          );
        })}
      </Tag>
    </motion.div>
  );
}
