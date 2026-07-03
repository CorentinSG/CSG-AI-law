import type en from "@/app/[lang]/dictionaries/en.json";

// English is the source of truth for the dictionary shape. This module is
// client-safe (type-only, no `server-only`), so client components can type
// their `dict` prop without importing the server dictionary loader.
export type Dictionary = typeof en;
