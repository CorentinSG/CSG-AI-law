import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "AI Law News",
  description:
    "AI law developments now live inside the unified AI Legal Intelligence Hub.",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = ((await searchParams) ?? {}) as Record<string, string>;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      nextParams.set(key, value);
    }
  }

  nextParams.set("view", "news");

  redirect(`/ai-regulation?${nextParams.toString()}`);
}
