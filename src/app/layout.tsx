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

// Reproduit exactement applyThemeToDoc() de theme-provider.tsx.
// Exécuté en synchrone dans le <head>, avant hydratation React,
// pour éviter le flash de thème par défaut (FOUC) constaté en production.
// Si l'utilisateur n'a jamais choisi de thème, on respecte sa préférence
// système (prefers-color-scheme) au lieu d'imposer le sombre.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem('fl_theme_mode');
    var t = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    var root = document.documentElement;
    root.classList.remove('dark', 'light', 'theme-midnight', 'theme-emerald');
    if (t === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add(t);
      if (t !== 'dark') {
        root.classList.add('dark');
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${caveat.variable} ${plexMono.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
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