"use client";

import { useState } from "react";

import { bulkUpdateReviewStatus } from "@/app/admin/ai-regulation/actions";

export interface BulkReviewItem {
  id: string;
  title: string;
  meta: string;
  authorityLabel: string;
  importance: string;
}

/**
 * Batch review surface: select many needs_review items and apply one
 * transition (approve / reject / archive) in a single submit. Uses the
 * `bulkUpdateReviewStatus` server action; selection state is client-side only.
 */
export function BulkReviewForm({ items }: { items: BulkReviewItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  };

  return (
    <form action={bulkUpdateReviewStatus} className="space-y-4">
      {/* Sticky action bar */}
      <div className="sticky top-[60px] z-20 flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-zinc-900/80 px-4 py-3 backdrop-blur">
        <label className="flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 accent-emerald-400"
          />
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            name="status"
            value="approved"
            disabled={selected.size === 0}
            className="rounded-xl bg-emerald-300 px-3 py-2 text-sm font-medium text-emerald-950 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve selected
          </button>
          <button
            type="submit"
            name="status"
            value="rejected"
            disabled={selected.size === 0}
            className="rounded-xl border border-red-400/40 px-3 py-2 text-sm text-red-200 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reject selected
          </button>
          <button
            type="submit"
            name="status"
            value="archived"
            disabled={selected.size === 0}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-zinc-300 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Archive
          </button>
        </div>
      </div>

      <ul className="divide-y divide-white/5 rounded-[1.4rem] border border-white/10 bg-white/5">
        {items.map((item) => {
          const isChecked = selected.has(item.id);
          return (
            <li key={item.id} className="flex items-start gap-3 p-4">
              <input
                type="checkbox"
                name="updateId"
                value={item.id}
                checked={isChecked}
                onChange={() => toggle(item.id)}
                className="mt-1 h-4 w-4 accent-emerald-400"
              />
              <div className="min-w-0 flex-1">
                <a
                  href={`/admin/ai-regulation/${item.id}`}
                  className="text-sm text-zinc-100 hover:underline"
                >
                  {item.title}
                </a>
                <p className="mt-0.5 text-xs text-zinc-500">{item.meta}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-zinc-300">
                  {item.authorityLabel}
                </span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  {item.importance}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </form>
  );
}
