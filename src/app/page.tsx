import type { Metadata } from "next";
import Link from "next/link";
import { LogoAnimated } from "@/components/ui/logo-animated";
import { DynamicBackground } from "@/components/landing/dynamic-background";
import { ThemeWallpaperModal } from "@/components/landing/theme-wallpaper-modal";
import { TerminalPreview } from "@/components/landing/terminal-preview";
import { FiscalSimulator } from "@/components/landing/fiscal-simulator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Receipt,
  AlertTriangle,
  Layers,
  Lock,
  WifiOff,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Clock,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "FiscLens Togo — Logiciel Comptable SYSCOHADA & Fiscalité OTR",
  description:
    "La suite tout-en-un pour la comptabilité générale SYSCOHADA révisé et la conformité fiscale togolaise (TVA, IRPP, IS, IMF, Patente).",
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Fond d'écran dynamique personnalisable (Aurora, Cyber Grid, Particules, Minimal) */}
      <DynamicBackground />

      {/* ========================================================================= */}
      {/* 1. NAVBAR FLOTTANTE GLASSMORPHIC                                          */}
      {/* ========================================================================= */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto w-[92%] sm:w-full">
        <nav className="glass-card rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shadow-black/5 border border-white/20 dark:border-white/10">
          {/* Logo animé */}
          <Link href="/" className="focus:outline-none">
            <LogoAnimated size="md" />
          </Link>

          {/* Liens de navigation centraux */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#syscohada" className="hover:text-foreground transition-colors">
              SYSCOHADA
            </a>
            <a href="#fiscalite" className="hover:text-foreground transition-colors">
              Fiscalité OTR
            </a>
            <a href="#simulateur" className="hover:text-foreground transition-colors">
              Simulateur
            </a>
            <a href="#securite" className="hover:text-foreground transition-colors">
              Sécurité 2FA
            </a>
          </div>

          {/* Actions à droite : Thème + Login + Inscription */}
          <div className="flex items-center gap-2.5">
            {/* Modal de changement de thème & fond d'écran */}
            <ThemeWallpaperModal />

            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-xl">
                Connexion
              </Button>
            </Link>

            <Link href="/register">
              <Button
                size="sm"
                className="text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/25 transition-all hover:scale-105"
              >
                Créer un compte <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="pt-16 pb-20 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col items-center text-center relative">
        {/* Badge d'introduction */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-semibold text-foreground mb-6 shadow-sm border border-brand-500/30 animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent font-bold">
            Conforme Loi de Finances Togo & SYSCOHADA Révisé 2025
          </span>
          <span className="text-muted-foreground hidden sm:inline">|</span>
          <span className="text-muted-foreground hidden sm:inline">OTR Prêt</span>
        </div>

        {/* Titre Principal Hero */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-6">
          La Puissance Comptable & Fiscale{" "}
          <span className="bg-gradient-to-r from-brand-500 via-emerald-400 to-amber-400 bg-clip-text text-transparent text-glow">
            Réinventée pour le Togo.
          </span>
        </h1>

        {/* Sous-titre */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
          Gérez vos journaux, balances, états financiers SYSCOHADA et générez automatiquement vos déclarations de{" "}
          <strong className="text-foreground font-semibold">TVA (18%)</strong>,{" "}
          <strong className="text-foreground font-semibold">IRPP / Paie</strong> et{" "}
          <strong className="text-foreground font-semibold">IS / IMF</strong> en quelques clics.
        </p>

        {/* Call To Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mb-14">
          <Link href="/register">
            <Button
              size="lg"
              className="h-12 px-7 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 hover:scale-105 transition-all"
            >
              Démarrer Gratuitement <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-7 rounded-2xl glass-card font-semibold text-sm hover:border-brand-500/50 hover:bg-muted/50 transition-all"
            >
              Accéder à l&apos;Espace Client
            </Button>
          </Link>
        </div>

        {/* Preview Interactive Terminal */}
        <div className="w-full relative max-w-4xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/30 via-amber-500/20 to-emerald-500/30 rounded-3xl blur-2xl opacity-50" />
          <TerminalPreview />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CHIFFRES & POINTS FORTS                                               */}
      {/* ========================================================================= */}
      <section className="py-12 border-y border-border/50 bg-muted/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">100%</div>
            <p className="text-xs text-muted-foreground font-medium">Conforme SYSCOHADA Révisé</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-500 font-mono">18% TVA</div>
            <p className="text-xs text-muted-foreground font-medium">Calcul automatique OTR</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">2FA TOTP</div>
            <p className="text-xs text-muted-foreground font-medium">Sécurité bancaire & codes secours</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-500 font-mono">Offline-First</div>
            <p className="text-xs text-muted-foreground font-medium">Saisie active sans internet</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LES 4 PILIERS DE FISCLENS TOGO                                        */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="success" className="text-xs uppercase tracking-wider font-bold">
            Conçu pour le Togo
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground">
            Une Suite Complète pour Entreprises & Cabinets
          </h2>
          <p className="text-sm text-muted-foreground">
            Fini les calculs manuels sur tableurs et les risques d&apos;erreurs déclaratives auprès de l&apos;OTR.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pilier 1 : SYSCOHADA */}
          <div id="syscohada" className="glass-card rounded-2xl p-7 space-y-4 border border-border/80 hover:border-brand-500/50 transition-all hover:shadow-xl group">
            <div className="p-3 rounded-xl bg-brand-500/15 text-brand-500 w-fit group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Comptabilité Générale SYSCOHADA</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Plan de comptes officiel révisé (Classes 1 à 8), journaux auxiliaires (Achats, Ventes, Banque, Caisse, OD, Paie), Balance 6 colonnes et Grand Livre en temps réel.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-500" /> Équilibre strict Débit = Crédit avec contrôle bloquant
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-500" /> Clôture d&apos;exercice sécurisée et génération des états financiers
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-500" /> Rapprochement bancaire et lettrage automatique des comptes
              </li>
            </ul>
          </div>

          {/* Pilier 2 : Fiscalité OTR */}
          <div id="fiscalite" className="glass-card rounded-2xl p-7 space-y-4 border border-border/80 hover:border-amber-500/50 transition-all hover:shadow-xl group">
            <div className="p-3 rounded-xl bg-amber-500/15 text-amber-500 w-fit group-hover:scale-110 transition-transform">
              <Receipt className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Moteur Fiscal & Déclarations OTR</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Calcul automatique de vos obligations fiscales selon le Code Général des Impôts (CGI) du Togo et export prêt pour télé-déclaration.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500" /> TVA 18% (Collectée, Déductible, Crédit de TVA, Déclaration mensuelle)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500" /> Impôt sur les Sociétés (IS 27% vs IMF 1% de plancher OTR)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-500" /> IRPP / Retenues sur salaires et cotisations CNSS Togo
              </li>
            </ul>
          </div>

          {/* Pilier 3 : Audit & Contrôle d'Anomalies */}
          <div className="glass-card rounded-2xl p-7 space-y-4 border border-border/80 hover:border-cyan-500/50 transition-all hover:shadow-xl group">
            <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-500 w-fit group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Contrôle & Détection d&apos;Anomalies</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Algorithmes de détection proactive des incohérences comptables avant tout contrôle fiscal ou audit de commissariat aux comptes.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-500" /> Analyse des soldes anormaux (comptes de caisse négatifs, etc.)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-500" /> Journal d&apos;audit légal immuable avec traçabilité par utilisateur
              </li>
            </ul>
          </div>

          {/* Pilier 4 : Mode Cabinet & Hors-Ligne */}
          <div id="securite" className="glass-card rounded-2xl p-7 space-y-4 border border-border/80 hover:border-emerald-500/50 transition-all hover:shadow-xl group">
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-500 w-fit group-hover:scale-110 transition-transform">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Multi-Dossiers Cabinet & Mode Hors-Ligne</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Passez d&apos;un dossier client à l&apos;autre instantanément. Continuez à saisir vos écritures même lors des coupures de connexion internet.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> File d&apos;attente locale synchronisée dès le retour du réseau
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sécurité renforcée avec Authentification 2FA TOTP & Codes de secours
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SIMULATEUR INTERACTIF EN DIRECT                                       */}
      {/* ========================================================================= */}
      <section id="simulateur" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="warning" className="text-xs uppercase tracking-wider font-bold">
            Simulateur en Ligne
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Estimez Vos Impôts et Cotisations au Togo
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Testez la précision du moteur de calcul FiscLens Togo directement ci-dessous.
          </p>
        </div>

        <FiscalSimulator />
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION FINAL                                                  */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="rounded-3xl glass-card border border-brand-500/40 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl space-y-6">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <LogoAnimated size="lg" className="mx-auto" />

          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground max-w-2xl mx-auto">
            Prêt à simplifier votre comptabilité et votre fiscalité togolaise ?
          </h2>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Rejoignez les entreprises et cabinets qui automatisent leur conformité SYSCOHADA et OTR avec FiscLens Togo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-8 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 hover:scale-105 transition-all"
              >
                Créer un Compte Gratuit <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-2xl font-semibold text-sm"
              >
                Se Connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER ÉLÉGANT                                                        */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-border/50 py-10 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <LogoAnimated size="sm" />

          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} FiscLens Togo. Conforme aux normes SYSCOHADA révisé & République Togolaise (OTR / CNSS).
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Espace Client
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
