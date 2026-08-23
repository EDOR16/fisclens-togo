import type { Metadata } from "next";
import { Sidebar, Topbar } from "@/components/layout/sidebar";
import { OfflineBadge } from "@/components/offline-badge";

export const metadata: Metadata = { title: "Application" };

/**
 * Layout principal de l'application (App Router groupe (app)).
 * Toutes les pages protégées héritent de ce layout :
 * sidebar RBAC | contenu principal | badge offline
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar fixe */}
      <Sidebar />

      {/* Zone principale */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />

        {/* Badge offline — flottant en haut à droite de la zone content */}
        <div className="absolute top-16 right-4 z-50">
          <OfflineBadge />
        </div>

        {/* Contenu scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
