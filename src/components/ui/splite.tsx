'use client';

import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-zinc-400">
          <span className="loader" />
          <p className="text-xs uppercase tracking-[0.24em]">
            Loading visual layer
          </p>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
