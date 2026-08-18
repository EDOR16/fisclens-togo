import type { Metadata } from "next";
import { UIProvider } from "@/lib/ui-providers";

export const metadata: Metadata = { title: "FiscLens Togo — Accès" };

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      {children}
    </UIProvider>
  );
}
