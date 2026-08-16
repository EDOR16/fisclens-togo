"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { LogoAnimated } from "@/components/ui/logo-animated";
import { DynamicBackground } from "@/components/landing/dynamic-background";
import { ThemeWallpaperModal } from "@/components/landing/theme-wallpaper-modal";
import { useAppTheme } from "@/components/theme/theme-provider";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  TrendingUp,
  Receipt,
  FileCheck2,
  Lock,
  Calculator,
  Layers,
  Building,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Scale,
  Clock,
  Laptop,
  Check,
  ChevronRight,
  Play,
  FileSpreadsheet,
  Globe2,
  Award,
  Users2,
  Sliders,
} from "lucide-react";
import { formatFcfa } from "@/lib/utils";

export default function UniqueLandingPage() {
  const { theme, toggleTheme } = useAppTheme();

  // Simulateur Fiscal Interactif Togo en direct
  const [simulatorCa, setSimulatorCa] = useState(15_000_000);
  const [simulatorCharges, setSimulatorCharges] = useState(9_000_000);
  const [activeTab, setActiveTab] = useState<"compta" | "fiscal" | "cabinet" | "rh">("compta");

  // Calculs fiscaux Togo en direct
  const fiscalCalculations = useMemo(() => {
    const tvaCollectee = Math.round(simulatorCa * 0.18);
    const tvaDeductible = Math.round(simulatorCharges * 0.18 * 0.7); // Hypothèse 70% charges avec TVA
    const tvaNette = Math.max(0, tvaCollectee - tvaDeductible);

    const resultatComptable = Math.max(0, simulatorCa - simulatorCharges);
    const isTheorique = Math.round(resultatComptable * 0.27);
    const imf = Math.max(200_000, Math.round(simulatorCa * 0.01)); // IMF 1% plancher 200 000 FCFA
    const impotDu = Math.max(isTheorique, imf);

    const cnssPatronale = Math.round(simulatorCharges * 0.25 * 0.175); // Estimation 25% masse salariale
    const amuPatronale = Math.round(simulatorCharges * 0.25 * 0.025);

    const resultatNet = Math.max(0, resultatComptable - impotDu);

    return {
      tvaCollectee,
      tvaDeductible,
      tvaNette,
      resultatComptable,
      isTheorique,
      imf,
      impotDu,
      cnssPatronale,
      amuPatronale,
      resultatNet,
    };
  }, [simulatorCa, simulatorCharges]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      {/* Fond Dynamique Optionnel */}
      <DynamicBackground />

      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT TICKER                                                */}
      {/* ========================================================================= */}
      <div className="relative z-40 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white text-xs py-2 px-4 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-emerald-300">Loi de Finances Togo 2025/2026 :</span>
            <span className="text-slate-300 hidden sm:inline">
              Télé-déclaration OTR, Moteur TVA 18%, et génération automatique de liasse SYSCOHADA.
            </span>
          </div>
          <Link
            href="/register"
            className="shrink-0 text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 text-[11px] underline"
          >
            Créer un espace réel <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION BAR UNIQUE & ÉPURÉE                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="focus:outline-none flex items-center gap-2">
              <LogoAnimated size="md" />
            </Link>

            <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wide text-muted-foreground">
              <a href="#plateforme" className="hover:text-foreground transition-colors">
                Plateforme
              </a>
              <a href="#simulateur" className="hover:text-foreground transition-colors flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Calculator className="h-3.5 w-3.5" /> Simulateur Fiscal
              </a>
              <a href="#modules" className="hover:text-foreground transition-colors">
                SYSCOHADA & OTR
              </a>
              <a href="#cabinets" className="hover:text-foreground transition-colors">
                Cabinets & Experts
              </a>
              <a href="#securite" className="hover:text-foreground transition-colors">
                Sécurité & Conformité
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Thème */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            {/* Modal personnalisation */}
            <ThemeWallpaperModal />

            {/* Bouton Connexion */}
            <Link href="/login">
              <button className="px-4 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors">
                Connexion
              </button>
            </Link>

            {/* Bouton CTA Primaire avec lueur dorée/émeraude */}
            <Link href="/register">
              <button className="relative group px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95">
                <span className="flex items-center gap-1.5">
                  Démarrer Gratuitement <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION : IDENTITÉ AUDACIEUSE FINTECH TOGO                        */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge de certification */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide">
            <ShieldCheck className="h-4 w-4" /> Conforme CGI Togo & Plan SYSCOHADA Révisé 2.0
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-foreground">
            La comptabilité togolaise{" "}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 bg-clip-text text-transparent">
              réinventée.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            FiscLens Togo automatise les écritures en partie double, sécurise vos déclarations <strong>TVA (18%)</strong>, et génère vos bilans et liasses fiscales OTR en temps réel avec une rigueur mathématique absolue.
          </p>

          {/* Boutons d'action */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all flex items-center gap-2">
                Ouvrir un Espace Entreprise <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href="#simulateur">
              <button className="px-6 py-4 rounded-2xl border border-border bg-card/80 hover:bg-card text-foreground font-bold text-sm transition-colors flex items-center gap-2 shadow-sm">
                <Calculator className="h-4 w-4 text-emerald-500" /> Tester le Simulateur Fiscal
              </button>
            </a>
          </div>

          {/* Garanties */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> Zéro saisie simulée en PROD
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> Équilibre strict Débit = Crédit (422)
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" /> Conforme Loi n°2018-26 Togo
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO TERMINAL / FINANCIAL HUD COCKPIT                                     */}
        {/* ========================================================================= */}
        <div id="plateforme" className="mt-14 relative rounded-3xl border border-border/80 bg-card/90 shadow-2xl p-4 sm:p-6 backdrop-blur-2xl overflow-hidden">
          {/* Barre supérieure style macOS / terminal */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-muted-foreground ml-2">
                fisclens-cockpit.tg · SYSCOHADA Live Engine
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Exercice Ouvert · NIF 100123456789
            </div>
          </div>

          {/* Grille de métriques réelles du terminal */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Chiffre d&apos;Affaires (701 + 706)
              </span>
              <p className="text-2xl font-extrabold text-foreground font-mono">15 000 000 FCFA</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> +18.4% vs N-1
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Trésorerie Disponible (521 + 571)
              </span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">8 240 500 FCFA</p>
              <p className="text-[10px] text-muted-foreground">Ecobank Lomé & Caisse</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                TVA Nette OTR à Reverser (18%)
              </span>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">1 530 000 FCFA</p>
              <p className="text-[10px] text-muted-foreground">Échéance : 15 du mois prochain</p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Contrôle d&apos;Équilibre
              </span>
              <p className="text-2xl font-extrabold text-emerald-500 font-mono">0.00 FCFA</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Balance 6 colonnes équilibrée
              </p>
            </div>
          </div>

          {/* Extrait d'écriture en partie double animée */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <span>JOURNAL DES VENTES — PIÈCE FAC-2025-001 (Facture Normalisée OTR)</span>
              <span className="text-emerald-400 font-bold">STATUS: VALIDE</span>
            </div>
            <div className="grid grid-cols-12 gap-2 text-slate-300 py-1 font-semibold text-[11px]">
              <span className="col-span-2 text-emerald-400">411100</span>
              <span className="col-span-6 truncate">Client TOGO DISTRIBUTION (TTC)</span>
              <span className="col-span-2 text-right text-emerald-300">11 800 000</span>
              <span className="col-span-2 text-right text-slate-500">0</span>
            </div>
            <div className="grid grid-cols-12 gap-2 text-slate-300 py-1 font-semibold text-[11px]">
              <span className="col-span-2 text-sky-400">701100</span>
              <span className="col-span-6 truncate">Ventes de marchandises au Togo (HT)</span>
              <span className="col-span-2 text-right text-slate-500">0</span>
              <span className="col-span-2 text-right text-sky-300">10 000 000</span>
            </div>
            <div className="grid grid-cols-12 gap-2 text-slate-300 py-1 font-semibold text-[11px]">
              <span className="col-span-2 text-amber-400">443100</span>
              <span className="col-span-6 truncate">État, TVA facturée sur ventes (18%)</span>
              <span className="col-span-2 text-right text-slate-500">0</span>
              <span className="col-span-2 text-right text-amber-300">1 800 000</span>
            </div>
            <div className="flex justify-between pt-2 mt-2 border-t border-slate-800 text-[11px] font-bold">
              <span className="text-emerald-400">TOTAL CONTRÔLÉ :</span>
              <span className="text-slate-100 font-mono">DÉBIT : 11 800 000 FCFA | CRÉDIT : 11 800 000 FCFA (ÉCART = 0 FCFA)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SIMULATEUR FISCAL INTERACTIF TOGO (FONCTIONNALITÉ UNIQUE)             */}
      {/* ========================================================================= */}
      <section id="simulateur" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-card p-6 sm:p-12 shadow-2xl space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Calculator className="h-64 w-64 text-emerald-500" />
          </div>

          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wide">
              <Sliders className="h-3.5 w-3.5" /> Simulateur Temps Réel
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Estimez vos impôts et charges sociales au Togo en direct
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Glissez les curseurs ci-dessous pour voir comment FiscLens calcule instantanément votre TVA (18%), l&apos;Impôt sur les Sociétés (27%), le Minimum Forfaitaire (IMF 1%) et les cotisations CNSS & AMU.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Colonne gauche : Curseurs */}
            <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border border-border">
              {/* Slider CA */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-foreground">Chiffre d&apos;Affaires Mensuel (HT)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatFcfa(simulatorCa)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1_000_000}
                  max={100_000_000}
                  step={500_000}
                  value={simulatorCa}
                  onChange={(e) => setSimulatorCa(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>1 000 000 FCFA</span>
                  <span>50 000 000 FCFA</span>
                  <span>100 000 000 FCFA</span>
                </div>
              </div>

              {/* Slider Charges */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-foreground">Charges d&apos;Exploitation Mensuelles</span>
                  <span className="text-sky-600 dark:text-sky-400 font-mono text-sm">
                    {formatFcfa(simulatorCharges)}
                  </span>
                </div>
                <input
                  type="range"
                  min={500_000}
                  max={80_000_000}
                  step={500_000}
                  value={simulatorCharges}
                  onChange={(e) => setSimulatorCharges(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>500 000 FCFA</span>
                  <span>40 000 000 FCFA</span>
                  <span>80 000 000 FCFA</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-muted-foreground space-y-1 border-t border-border">
                <p>💡 <strong>Règle CGI Togo :</strong> L&apos;IS est de 27% sur le bénéfice fiscal, avec un plancher minimal (IMF) de 1% du CA (min. 200 000 FCFA).</p>
              </div>
            </div>

            {/* Colonne droite : Résultats calculés instantanés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">TVA Nette à Payer (18%)</span>
                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {formatFcfa(fiscalCalculations.tvaNette)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Collectée: {formatFcfa(fiscalCalculations.tvaCollectee)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Impôt sur les Sociétés (IS)</span>
                <p className="text-xl font-extrabold text-foreground font-mono">
                  {formatFcfa(fiscalCalculations.impotDu)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {fiscalCalculations.isTheorique >= fiscalCalculations.imf ? "27% du Bénéfice" : "IMF 1% Plancher"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">CNSS Patronale (17.5%)</span>
                <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                  {formatFcfa(fiscalCalculations.cnssPatronale)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  + AMU (2.5%): {formatFcfa(fiscalCalculations.amuPatronale)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/10 to-teal-600/20 border border-emerald-500/30 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Résultat Net Estimé</span>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatFcfa(fiscalCalculations.resultatNet)}
                </p>
                <p className="text-[10px] text-muted-foreground">Bénéfice net après impôts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. LES 4 PILIERS TECHNOLOGIQUES DE FISCLENS TOGO (ONGLETS INTERACTIFS)    */}
      {/* ========================================================================= */}
      <section id="modules" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Conception Sur-Mesure Togo
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Quatre moteurs spécialisés pour votre gestion
          </h2>
        </div>

        {/* Sélecteur d'onglets */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-muted/50 rounded-2xl max-w-2xl mx-auto border border-border">
          <button
            onClick={() => setActiveTab("compta")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "compta"
                ? "bg-background text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SYSCOHADA Révisé
          </button>
          <button
            onClick={() => setActiveTab("fiscal")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "fiscal"
                ? "bg-background text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Moteur Fiscal OTR
          </button>
          <button
            onClick={() => setActiveTab("cabinet")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "cabinet"
                ? "bg-background text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Experts & Multi-Dossiers
          </button>
          <button
            onClick={() => setActiveTab("rh")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "rh"
                ? "bg-background text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paie, CNSS & AMU
          </button>
        </div>

        {/* Contenu dynamique de l'onglet sélectionné */}
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-xl">
          {activeTab === "compta" && (
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  01
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  Comptabilité Générale en Partie Double SYSCOHADA
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Toutes les écritures sont rigoureusement validées : Classes 1 à 8, 6 journaux auxiliaires (Achats, Ventes, Banque, Caisse, OD, Paie), Balance à 6 colonnes et Grand Livre instantané.
                </p>
                <ul className="space-y-2 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Rejet serveur 422 en cas de déséquilibre au centime près
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Clôture d&apos;exercice sécurisée et génération du Bilan & Compte de Résultat
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Rapprochement bancaire simplifié (Ecobank, Orabank, BTCI)
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-muted/40 border border-border font-mono text-xs space-y-2">
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">// Source de vérité unique consolidée</p>
                <p className="text-muted-foreground">Balance Générale : 8 500 000 FCFA Débit = 8 500 000 FCFA Crédit</p>
                <p className="text-muted-foreground">Grand Livre : 100% des lignes tracées avec pièce justificative</p>
                <p className="text-foreground font-bold">Statut de conformité : 10/10 tests intégrité validés</p>
              </div>
            </div>
          )}

          {activeTab === "fiscal" && (
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  02
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  Conformité Fiscale OTR & Télé-déclarations
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  FiscLens intègre le calendrier fiscal de la République Togolaise et calcule vos déclarations mensuelles et annuelles sans risque de pénalités.
                </p>
                <ul className="space-y-2 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-500" /> Déclaration mensuelle de TVA (18%) avant le 15 du mois
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-500" /> Patente professionnelle (avant le 31 Mars) et Liasse OTR (avant le 30 Avril)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-500" /> Suivi de l&apos;Impôt sur les Sociétés (27%) et Taxe Professionnelle Unique (TPU)
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-muted/40 border border-border font-mono text-xs space-y-2">
                <p className="text-amber-600 dark:text-amber-400 font-bold">// Calendrier des obligations OTR</p>
                <p className="text-muted-foreground">📅 15 de chaque mois : TVA + IRPP + CNSS</p>
                <p className="text-muted-foreground">📅 31 Mars : Patente annuelle & Déclaration DAS</p>
                <p className="text-muted-foreground">📅 30 Avril : Liasse fiscale SYSCOHADA</p>
              </div>
            </div>
          )}

          {activeTab === "cabinet" && (
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                  03
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  Espace Cabinets & Experts-Comptables
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Gérez l&apos;intégralité de votre portefeuille client depuis un tableau de bord unifié avec bascule instantanée entre vos dossiers.
                </p>
                <ul className="space-y-2 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-sky-500" /> Sécurité renforcée avec 2FA obligatoire (TOTP & Codes de secours)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-sky-500" /> Piste d&apos;audit immuable de chaque écriture saisie par collaborateur
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-sky-500" /> Export direct des liasses au format exigé par l&apos;OTR
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-muted/40 border border-border font-mono text-xs space-y-2">
                <p className="text-sky-600 dark:text-sky-400 font-bold">// Mode Expert Multi-Tenants</p>
                <p className="text-muted-foreground">Dossiers illimités · Contrôles anti-fraude</p>
                <p className="text-muted-foreground">Authentification 2FA renforcée</p>
                <p className="text-foreground font-bold">Conçu pour les membres de l&apos;ONET Togo</p>
              </div>
            </div>
          )}

          {activeTab === "rh" && (
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                  04
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  Gestion Sociale, Paie & AMU Togo
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Éditez vos bulletins de paie et calculez les cotisations sociales togolaises avec prise en compte automatique de la nouvelle Assurance Maladie Universelle (AMU).
                </p>
                <ul className="space-y-2 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-500" /> CNSS Part Patronale (17.5%) et Part Salariale (4%)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-500" /> Retenues à la source IRPP selon le barème progressif togolais
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-500" /> Écriture automatique dans le journal de paie (Comptes 661 / 664 / 421 / 431)
                  </li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-muted/40 border border-border font-mono text-xs space-y-2">
                <p className="text-teal-600 dark:text-teal-400 font-bold">// Barème Paie Togo</p>
                <p className="text-muted-foreground">CNSS Totale : 21.5% (17.5% Patronale + 4% Ouvrière)</p>
                <p className="text-muted-foreground">AMU : Conforme aux dispositions en vigueur</p>
                <p className="text-foreground font-bold">Journalisation comptable en 1 clic</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION FINAL                                                   */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-950 text-white border border-emerald-500/30 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Prêt à simplifier votre fiscalité au Togo ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Ouvrez votre espace professionnel en 1 minute. Bénéficiez immédiatement du plan comptable SYSCOHADA complet et de votre calendrier fiscal configuré.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            <Link href="/register">
              <button className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all">
                Créer Mon Espace de Travail Réel →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER ÉPURÉ & UNIQUE FISCLENS TOGO                                    */}
      {/* ========================================================================= */}
      <footer className="border-t border-border bg-card py-12 px-4 sm:px-6 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <LogoAnimated size="sm" />
              <p className="text-[11px] max-w-md">
                Logiciel de comptabilité et de conformité fiscale conçu pour les entreprises et cabinets d&apos;expertise de la République Togolaise.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-foreground">
              <Link href="/login" className="hover:text-emerald-500 transition-colors">Connexion Espace Pro</Link>
              <Link href="/register" className="hover:text-emerald-500 transition-colors">Créer un Compte</Link>
              <a href="#simulateur" className="hover:text-emerald-500 transition-colors">Simulateur Fiscal</a>
              <a href="#modules" className="hover:text-emerald-500 transition-colors">SYSCOHADA & OTR</a>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>
              © {new Date().getFullYear()} FiscLens Togo. Conçu conformément aux dispositions du Code Général des Impôts (CGI) Togo et du SYSCOHADA Révisé.
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold">
              Traitement des données protégé · Loi n°2018-26 (Togo)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
