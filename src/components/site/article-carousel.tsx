"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface ArticleCarouselItem {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Local (`/…`) or data: image. Remote URLs are blocked by the CSP, so when
   *  no local image is available the card renders an on-brand gradient. */
  image?: string;
  category?: string;
  meta?: string;
}

export function ArticleCarousel({ items }: { items: ArticleCarouselItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true, align: "start" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const updateState = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // Defer the initial sync so we don't call setState synchronously inside the
    // effect (avoids cascading-render lint and is behaviourally identical).
    queueMicrotask(updateState);
    emblaApi.on("select", updateState);
    emblaApi.on("reInit", updateState);
    return () => {
      emblaApi.off("select", updateState);
      emblaApi.off("reInit", updateState);
    };
  }, [emblaApi, updateState]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
          {items.length} note{items.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            aria-label="Article précédent"
            className="flex size-9 items-center justify-center rounded-full border border-black/8 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-25"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            aria-label="Article suivant"
            className="flex size-9 items-center justify-center rounded-full border border-black/8 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-25"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-5 flex">
          {items.map((item) => (
            <div key={item.id} className="min-w-[300px] shrink-0 pl-5 lg:min-w-[380px]">
              <Link
                href={item.href}
                className="group block overflow-hidden rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
              >
                <div className="relative h-[30rem] overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#1c1c1c_0%,#0d0d0d_60%,#0a0a0a_100%)] lg:h-[34rem]">
                  {item.image &&
                  (item.image.startsWith("/") ||
                    item.image.startsWith("data:")) ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(154,107,31,0.16),transparent_55%)] transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    {item.category && (
                      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">
                        {item.category}
                      </p>
                    )}
                    <h3 className="mb-3 font-display text-xl font-medium uppercase leading-snug tracking-[-0.03em] text-white lg:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mb-5 line-clamp-2 text-sm leading-6 text-white/65">
                      {item.description}
                    </p>
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/70 transition-all group-hover:gap-3 group-hover:text-white/90">
                      Read note
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-1">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Aller à la note ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? "w-5 bg-zinc-900" : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
