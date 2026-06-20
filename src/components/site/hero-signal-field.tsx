'use client';

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gold: boolean;
  /** phase offset so gold nodes pulse out of sync */
  phase: number;
};

const INK = "17, 17, 17";
const GOLD = "154, 107, 31";

/**
 * "Signal field" — a quiet, instrument-grade hero backdrop.
 * Faint drifting ink nodes connect when near; a few gold "signal" nodes
 * pulse and brighten toward the cursor. Restrained on purpose: this reads as
 * intelligence, not decoration. Static single frame under reduced-motion.
 */
export function HeroSignalField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let raf = 0;
    let running = true;

    // Pointer in CSS pixels; -1 means "absent" so the field rests on its own.
    const pointer = { x: -1, y: -1 };

    const LINK_DIST = 132; // px: nodes closer than this get a connecting line
    const POINTER_DIST = 180;

    function seed() {
      // Density scales with area but stays bounded for performance.
      const count = Math.min(64, Math.round((width * height) / 17000));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        gold: i % 22 === 0, // ~2-3 gold signal nodes; the "One Signal" rule
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, width, height);

      for (const n of nodes) {
        if (!reduceMotion) {
          n.x += n.vx;
          n.y += n.vy;
          // gentle wrap so the field never empties an edge
          if (n.x < -20) n.x = width + 20;
          else if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20;
          else if (n.y > height + 20) n.y = -20;

          // subtle pull toward the cursor
          if (pointer.x >= 0) {
            const dx = pointer.x - n.x;
            const dy = pointer.y - n.y;
            const d = Math.hypot(dx, dy);
            if (d < POINTER_DIST && d > 0.01) {
              const f = (1 - d / POINTER_DIST) * 0.04;
              n.x += dx * f * 0.04;
              n.y += dy * f * 0.04;
            }
          }
        }
      }

      // connections
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d > LINK_DIST) continue;
          const fade = 1 - d / LINK_DIST;
          const gold = a.gold || b.gold;
          ctx!.strokeStyle = `rgba(${gold ? GOLD : INK}, ${
            fade * (gold ? 0.3 : 0.16)
          })`;
          ctx!.lineWidth = gold ? 0.9 : 0.7;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // pointer links — the field "notices" the cursor
      if (pointer.x >= 0) {
        for (const n of nodes) {
          const d = Math.hypot(pointer.x - n.x, pointer.y - n.y);
          if (d > POINTER_DIST) continue;
          const fade = 1 - d / POINTER_DIST;
          ctx!.strokeStyle = `rgba(${n.gold ? GOLD : INK}, ${fade * 0.22})`;
          ctx!.lineWidth = 0.7;
          ctx!.beginPath();
          ctx!.moveTo(pointer.x, pointer.y);
          ctx!.lineTo(n.x, n.y);
          ctx!.stroke();
        }
      }

      // nodes
      for (const n of nodes) {
        if (n.gold) {
          const pulse = reduceMotion
            ? 0.7
            : 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.0016 + n.phase));
          // soft glow
          const r = 8;
          const grad = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
          grad.addColorStop(0, `rgba(${GOLD}, ${0.5 * pulse})`);
          grad.addColorStop(1, `rgba(${GOLD}, 0)`);
          ctx!.fillStyle = grad;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx!.fill();
          // core
          ctx!.fillStyle = `rgba(${GOLD}, ${0.85 * pulse})`;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, 1.7, 0, Math.PI * 2);
          ctx!.fill();
        } else {
          ctx!.fillStyle = `rgba(${INK}, 0.42)`;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, 1.1, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    function loop(t: number) {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }
    function onPointerLeave() {
      pointer.x = -1;
      pointer.y = -1;
    }
    function onVisibility() {
      running = !document.hidden;
      if (running && !reduceMotion) raf = requestAnimationFrame(loop);
      else cancelAnimationFrame(raf);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduceMotion) {
      draw(0); // single static frame
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none h-full w-full", className)}
      // Fade the field out toward the left so headline text stays crisp;
      // it lives mostly around the portrait on the right.
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 42%, black 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 42%, black 100%)",
      }}
    />
  );
}
