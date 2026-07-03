"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  initialDelay?: number;
  charDelay?: number;
  duration?: number;
}

export function AnimatedHeading({
  text,
  className,
  style,
  initialDelay = 200,
  charDelay = 30,
  duration = 500,
}: AnimatedHeadingProps) {
  const [started, setStarted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setStarted(true), initialDelay);
    return () => clearTimeout(t);
  }, [reduced, initialDelay]);

  const shown = started || reduced;

  const lines = text.split("\n");
  let globalIndex = 0;

  return (
    <h1 className={cn("leading-none", className)} style={style}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className="block text-balance">
          {/* Split on words so a word never breaks mid-character on small
              screens; each word is a nowrap unit, characters animate inside. */}
          {line.split(/(\s+)/).flatMap((word, wordIdx) => {
            if (word === "") return [];
            if (/^\s+$/.test(word)) {
              return [<span key={`sp-${lineIdx}-${wordIdx}`}>&nbsp;</span>];
            }
            return [
              <span
                key={`w-${lineIdx}-${wordIdx}`}
                style={{ display: "inline-block", whiteSpace: "nowrap" }}
              >
                {word.split("").map((char) => {
                  const delay = globalIndex * charDelay;
                  globalIndex++;
                  return (
                    <span
                      key={`${lineIdx}-${globalIndex}`}
                      style={{
                        display: "inline-block",
                        opacity: shown ? 1 : 0,
                        transform: shown ? "translateX(0)" : "translateX(-18px)",
                        transition: reduced
                          ? "none"
                          : `opacity ${duration}ms ease ${delay}ms, transform ${duration}ms ease ${delay}ms`,
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </span>,
            ];
          })}
        </span>
      ))}
    </h1>
  );
}
