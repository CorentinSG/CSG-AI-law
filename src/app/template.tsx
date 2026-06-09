import type { ReactNode } from "react";

import { PageTransition } from "@/components/site/page-transition";

export default function AppTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
