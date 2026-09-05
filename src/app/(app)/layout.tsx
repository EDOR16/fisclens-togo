import type { Metadata } from "next";
import { Sidebar, Topbar, SidebarProvider } from "@/components/layout/sidebar";
import { OfflineBadge } from "@/components/offline-badge";

export const metadata: Metadata = { title: "Application" };

/**
 * Layout principal de l'application (App Router groupe (app)).
 * Toutes les pages protégées héritent de ce layout :
 * - Sidebar responsive : tiroir rétractable sur mobile avec bouton croix / fixe sur desktop
 * - Topbar avec bouton hamburger (3 lignes) sur mobile
 * - Zone principale avec padding adapté mobile et desktop
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar responsive (tiroir sur mobile, fixe sur desktop) */}
        <Sidebar />

        {/* Zone principale */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />

          {/* Badge offline — flottant en haut à droite de la zone content */}
          <div className="absolute top-16 right-4 z-30 pointer-events-none sm:pointer-events-auto">
            <OfflineBadge />
          </div>

          {/* Contenu scrollable */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

