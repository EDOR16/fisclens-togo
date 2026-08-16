import type { Metadata } from "next";

export const metadata: Metadata = { title: "Connexion" };

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-2xl font-bold text-brand-900">FiscLens</span>
            <span className="text-sm font-medium text-brand-600 mt-1">Togo</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestion comptable & fiscale SYSCOHADA
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
