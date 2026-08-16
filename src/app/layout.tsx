import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AppThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "FiscLens Togo — L'Excellence Comptable & Fiscale SYSCOHADA",
    template: "%s | FiscLens Togo",
  },
  description: "Plateforme intelligente de gestion comptable SYSCOHADA et conformité fiscale OTR pour entreprises et cabinets au Togo.",
  keywords: ["SYSCOHADA", "Fiscalité Togo", "OTR", "TVA 18%", "IRPP", "Comptabilité Togo", "FiscLens"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <AppThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              toastOptions={{
                duration: 4000,
              }}
            />
          </AuthProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
