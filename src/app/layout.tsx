import type { Metadata } from "next";
import { Inter, Caveat, IBM_Plex_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AppThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-hand" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "FiscLens Togo — Le Grand Livre Comptable & Fiscal",
    template: "%s | FiscLens Togo",
  },
  description:
    "Comptabilité SYSCOHADA Révisé, TVA 18%, IRPP, IS vs IMF et liasses OTR. Chaque chiffre a sa loi. Fait à Lomé.",
  keywords: [
    "SYSCOHADA",
    "Fiscalité Togo",
    "OTR",
    "TVA 18%",
    "IRPP art 74",
    "Comptabilité Togo",
    "FiscLens Togo",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${caveat.variable} ${plexMono.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
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
