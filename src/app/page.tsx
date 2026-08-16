"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogoAnimated } from "@/components/ui/logo-animated";
import { DynamicBackground } from "@/components/landing/dynamic-background";
import { ThemeWallpaperModal } from "@/components/landing/theme-wallpaper-modal";
import { useAppTheme } from "@/components/theme/theme-provider";
import {
  ChevronDown,
  ArrowRight,
  Sun,
  Moon,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Building2,
  Layers,
  FileSpreadsheet,
  Check,
  AlertCircle,
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  Receipt,
  FileText,
  BadgeCheck,
  Landmark,
} from "lucide-react";
import { formatFcfa } from "@/lib/utils";

export default function LandingPage() {
  const { theme, toggleTheme } = useAppTheme();
  const [solutionType, setSolutionType] = useState("all");
  const [companySize, setCompanySize] = useState("all");
  const [activeBlogIndex, setActiveBlogIndex] = useState(0);

  // Articles réels adaptés à la fiscalité togolaise et au SYSCOHADA (Image 3)
  const articles = [
    {
      title: "Loi de finances Togo 2025/2026 : Ce qui change pour l'IS (27%), l'IMF (1%) et la TPU",
      desc: "Nouveaux barèmes fiscaux, exonérations pour créateurs d'entreprises et obligations déclaratives auprès de l'Office Togolais des Recettes (OTR).",
      tag: "Réforme Fiscale OTR",
      readTime: "4 min de lecture",
      color: "from-emerald-600 to-teal-800",
      category: "Fiscalité Togo",
    },
    {
      title: "Facturation normalisée & TVA (18%) : Comment ce duo transforme la gestion des PME à Lomé",
      desc: "Facturation certifiée, traçabilité des paiements mobiles (T-Money, Flooz) et automatisation de la déduction de TVA sans risque de rejet.",
      tag: "TVA 18% & Facture Normalisée",
      readTime: "5 min de lecture",
      color: "from-blue-600 to-indigo-800",
      category: "Digitalisation",
    },
    {
      title: "Micro-entrepreneurs & Artisans au Togo : Comment se préparer aux exigences de tenue de compte",
      desc: "Livre-journal des recettes, déclaration de TPU simplifiée et transition en douceur vers le régime du Réel Simplifié.",
      tag: "Artisans & TPE",
      readTime: "6 min de lecture",
      color: "from-amber-600 to-orange-800",
      category: "TPE & Indépendants",
    },
    {
      title: "Cotisations CNSS & IRPP : 7 actions à mener pour être 100% conforme ce mois-ci",
      desc: "Calcul rigoureux de la part patronale (17,5%) et salariale (4%), plafonds de cotisations et retenues à la source sur bulletins de paie.",
      tag: "Paie & Social Togo",
      readTime: "4 min de lecture",
      color: "from-teal-600 to-emerald-800",
      category: "Ressources Humaines",
    },
    {
      title: "Le Port de Lomé et les transitaires en avance sur la conformité fiscale grâce à FiscLens",
      desc: "Découvrez comment les opérateurs logistiques de la Zone Franche automatisent leur liasse fiscale SYSCOHADA en 1 clic.",
      tag: "Étude de Cas Togo",
      readTime: "5 min de lecture",
      color: "from-slate-700 to-slate-900",
      category: "Entreprises & Logistique",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-brand-500 selection:text-white relative overflow-x-hidden transition-colors duration-300">
      {/* Fond d'écran dynamique (100% optionnel, activable via le sélecteur) */}
      <DynamicBackground />

      {/* ========================================================================= */}
      {/* 0. BANDEAU D'ANNONCE & REFORMES FISCALES TOGOLAISES (Top Bar)            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-brand-700 via-emerald-800 to-slate-900 text-white text-xs py-2 px-4 text-center font-medium relative z-40 border-b border-brand-500/30">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
            <Sparkles className="h-3 w-3" /> Flash Fiscal Togo
          </span>
          <span>
            <strong>Loi de Finances & SYSCOHADA :</strong> Télé-déclaration TVA (18%), IRPP, IS (27%) et facturation normalisée intégrées sur FiscLens Togo.
          </span>
          <Link
            href="/register"
            className="underline hover:text-amber-300 font-bold ml-1 inline-flex items-center gap-0.5"
          >
            Découvrir les modules conformes <ArrowRight className="h-3 w-3 inline" />
          </Link>
        </div>
      </div>

      {/* Lignes d'onde vert émeraude (Style Sage officiel) */}
      <div className="absolute top-[180px] left-0 right-0 h-[480px] pointer-events-none z-0 opacity-70 dark:opacity-85 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M-100 280 C 300 420, 600 120, 1000 240 C 1250 320, 1400 180, 1600 220"
            stroke="#16a34a"
            strokeWidth="14"
            strokeLinecap="round"
            className="opacity-90"
          />
          <path
            d="M-100 310 C 320 440, 580 160, 980 260 C 1220 330, 1380 200, 1600 240"
            stroke="#4ade80"
            strokeWidth="3"
            strokeDasharray="12 12"
            className="opacity-40"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR SAGE-STYLE                                                  */}
      {/* ========================================================================= */}
      <header className="relative z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-3.5">
          {/* Logo gauche */}
          <div className="flex items-center gap-8">
            <Link href="/" className="focus:outline-none">
              <LogoAnimated size="md" />
            </Link>

            {/* Liens de menu horizontaux */}
            <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-muted-foreground">
              <a href="#solutions" className="hover:text-foreground transition-colors flex items-center gap-1">
                Produits & Solutions <ChevronDown className="h-3 w-3 opacity-60" />
              </a>
              <a href="#accountants" className="hover:text-foreground transition-colors">
                Experts-comptables
              </a>
              <a href="#fiscalite-togo" className="hover:text-foreground transition-colors">
                Fiscalité OTR (TVA 18%)
              </a>
              <a href="#besoins" className="hover:text-foreground transition-colors">
                Par besoin d&apos;entreprise
              </a>
              <a href="#blog-fiscal" className="hover:text-foreground transition-colors">
                Blog & Actualités
              </a>
            </nav>
          </div>

          {/* Côté droit : Toggle Thème Clair/Sombre + Ambiance + Connexion */}
          <div className="flex items-center gap-2.5">
            {/* Bouton direct 1-clic Clair / Sombre */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-sm"
              title={theme === "light" ? "Passer au thème sombre" : "Passer au thème clair"}
              aria-label="Changer de thème"
            >
              {theme === "light" ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            {/* Modal de personnalisation avancée (fonds & couleurs) */}
            <ThemeWallpaperModal />

            {/* Bouton Connexion style pilule Sage */}
            <Link href="/login">
              <button className="px-5 py-1.5 rounded-full text-xs font-semibold border border-foreground/40 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-500/10 transition-all text-foreground">
                Connexion
              </button>
            </Link>

            {/* Bouton Inscription */}
            <Link href="/register" className="hidden sm:inline-block">
              <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/25">
                S&apos;inscrire
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION & SÉLECTEUR INTERACTIF                                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-16 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight max-w-4xl mx-auto">
          Pour chaque étape de votre activité
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          FiscLens Togo fournit la technologie certifiée <strong className="text-foreground">SYSCOHADA révisé</strong> et
          l&apos;automatisation fiscale indispensables au bon fonctionnement et à la conformité de votre entreprise (OTR & CNSS).
        </p>

        {/* Barre de sélection interactive (exactement comme le screenshot Sage) */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base font-semibold text-muted-foreground">
          <span>Je recherche une solution de</span>

          <div className="relative inline-block">
            <select
              value={solutionType}
              onChange={(e) => setSolutionType(e.target.value)}
              className="appearance-none bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-4 py-2 pr-8 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors shadow-lg shadow-brand-600/30"
            >
              <option value="all">Comptabilité & Fiscalité OTR</option>
              <option value="compta">Comptabilité Générale SYSCOHADA</option>
              <option value="fiscal">Déclarations Fiscales (TVA 18%, IS, IRPP)</option>
              <option value="cabinet">Gestion Multi-Dossiers Cabinet</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-white" />
          </div>

          <span>pour une entreprise de</span>

          <div className="relative inline-block">
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="appearance-none bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-4 py-2 pr-8 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors shadow-lg shadow-brand-600/30"
            >
              <option value="all">Taille de l&apos;entreprise (Toutes)</option>
              <option value="tpe">Artisans & TPE (1 à 9 salariés)</option>
              <option value="pme">PME & Moyenne entreprise (10 à 99)</option>
              <option value="cabinet">Cabinet d&apos;Expertise & Grande Ent.</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-white" />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LES 3 CARTES DE PRODUITS PRINCIPALES (Style Sage exact du screenshot) */}
      {/* ========================================================================= */}
      <section id="solutions" className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* CARTE 1 : FiscLens Active (Artisans & TPE) */}
          <div className="bg-card text-card-foreground rounded-3xl p-6 flex flex-col justify-between shadow-2xl border border-border hover:translate-y-[-4px] transition-transform duration-300">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-3">
                OFFRE FLASH ! 50 % de réduction les 3 premiers mois.
              </span>
              <h2 className="text-2xl font-extrabold mb-2">FiscLens Active</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Gérez les devis, factures normalisées et la comptabilité, ainsi que la TVA (18%), avec une solution cloud tout-en-un.
                Pour les artisans, commerçants et TPE.
              </p>
              <p className="text-xs font-bold text-foreground mb-5">
                Dès 15 000 FCFA/mois
              </p>
              <Link href="/register">
                <button className="w-fit px-5 py-2.5 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity mb-6 shadow-md">
                  Découvrez FiscLens Active
                </button>
              </Link>
            </div>

            {/* Widget UI : Suivi des encours */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3 shadow-inner">
              <h4 className="text-xs font-bold text-foreground">Suivi des encours</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Encours clients</span>
                  <span className="font-bold text-foreground">3 565 670 FCFA Total</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-brand-500 w-3/4 rounded-full" />
                </div>
                <span className="text-[9px] text-muted-foreground">Suivi des échéances par tiers · Balance âgée</span>
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Encours fournisseurs</span>
                  <span className="font-bold text-foreground">865 670 FCFA Total</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-slate-600 dark:bg-slate-400 w-1/3 rounded-full" />
                </div>
                <span className="text-[9px] text-muted-foreground">Suivi des règlements par tiers</span>
              </div>
            </div>
          </div>

          {/* CARTE 2 : FiscLens 50 Pro (PME & Entreprises) */}
          <div className="bg-card text-card-foreground rounded-3xl p-6 flex flex-col justify-between shadow-2xl border-2 border-brand-500 hover:translate-y-[-4px] transition-transform duration-300 relative">
            <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
              Plus Populaire
            </div>
            <div>
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide block mb-3">
                Conforme CGI Togo & SYSCOHADA Révisé
              </span>
              <h2 className="text-2xl font-extrabold mb-2">FiscLens 50 Pro</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Boostez votre gestion avec FiscLens 50 : écritures comptables (Classes 1 à 8), journaux, balance 6 colonnes, IS (27%), IMF (1%) et déclarations OTR. Une solution puissante et fiable.
              </p>
              <p className="text-xs font-bold text-foreground mb-5">
                Pour les PME, dès 45 000 FCFA/mois
              </p>
              <Link href="/register">
                <button className="w-fit px-5 py-2.5 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity mb-6 shadow-md">
                  Découvrez FiscLens 50 Pro
                </button>
              </Link>
            </div>

            {/* Widget UI : Répartition des charges SYSCOHADA (Donut) */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2 shadow-inner">
              <h4 className="text-xs font-bold text-foreground">Répartition des charges SYSCOHADA</h4>
              <div className="flex items-center justify-center py-2 relative">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="12" className="text-muted/60" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#16a34a"
                    strokeWidth="12"
                    strokeDasharray="108 240"
                    strokeDashoffset="0"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#0284c7"
                    strokeWidth="12"
                    strokeDasharray="72 240"
                    strokeDashoffset="-108"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#eab308"
                    strokeWidth="12"
                    strokeDasharray="60 240"
                    strokeDashoffset="-180"
                    fill="none"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-[10px] font-bold text-foreground font-mono">100%</span>
                  <p className="text-[8px] text-muted-foreground">Équilibré</p>
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground font-mono pt-1 border-t border-border">
                <span className="text-green-600 dark:text-green-400 font-bold">● 601000 : 45%</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">● 615000 : 30%</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">● 606300 : 25%</span>
              </div>
            </div>
          </div>

          {/* CARTE 3 : FiscLens Cabinet (Experts-Comptables) */}
          <div className="bg-card text-card-foreground rounded-3xl p-6 flex flex-col justify-between shadow-2xl border border-border hover:translate-y-[-4px] transition-transform duration-300">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block mb-3">
                Pour les cabinets et entreprises en croissance
              </span>
              <h2 className="text-2xl font-extrabold mb-2">FiscLens Cabinet</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Accélérez votre croissance grâce à une solution financière cloud complète : automatisation comptable, gestion multi-dossiers clients, liasses fiscales OTR et reporting en temps réel.
              </p>
              <p className="text-xs font-bold text-foreground mb-5">
                Multi-dossiers illimités · Mode Expert
              </p>
              <Link href="/register">
                <button className="w-fit px-5 py-2.5 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity mb-6 shadow-md">
                  Découvrez FiscLens Cabinet
                </button>
              </Link>
            </div>

            {/* Widget UI : KPIs & Bar Chart par filiale */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3 shadow-inner">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 bg-background rounded-lg border border-border">
                  <span className="text-[8px] text-muted-foreground block uppercase">Actifs</span>
                  <span className="text-[10px] font-bold text-foreground font-mono">14,445K ↗</span>
                </div>
                <div className="p-1.5 bg-background rounded-lg border border-border">
                  <span className="text-[8px] text-muted-foreground block uppercase">Recettes</span>
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 font-mono">74,472K ↗</span>
                </div>
                <div className="p-1.5 bg-background rounded-lg border border-border">
                  <span className="text-[8px] text-muted-foreground block uppercase">Revenu net</span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono">27,475K ↗</span>
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-foreground block">Nouveau net par dossier</span>
                <div className="space-y-1 text-[9px] font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-14 truncate">Lomé Port</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 w-[85%]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 truncate">Zone Franche</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[65%]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 truncate">Kara Filiale</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-[45%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BANDEAU DE CONFIANCE INSTITUTIONNELLE AU TOGO (Image 1 top)           */}
      {/* ========================================================================= */}
      <section className="py-10 border-y border-border/60 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plus de 2 500 entreprises, PME et cabinets au Togo font confiance à FiscLens
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground">
              <Landmark className="h-5 w-5 text-brand-600" /> Office Togolais des Recettes (OTR)
            </div>
            <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground">
              <Building2 className="h-5 w-5 text-amber-500" /> Chambre de Commerce CCIT
            </div>
            <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground">
              <BadgeCheck className="h-5 w-5 text-sky-500" /> Ordre des Experts-Comptables (ONET)
            </div>
            <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground">
              <Briefcase className="h-5 w-5 text-emerald-500" /> Port Autonome de Lomé
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION "OPEN FOR SUCCESS! FISCLENS FOR ACCOUNTANTS" (Image 1 middle)  */}
      {/* ========================================================================= */}
      <section id="accountants" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 grid lg:grid-cols-2 gap-10 items-center shadow-xl">
          {/* Bloc gauche visuel stylisé */}
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-block">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-brand-500 dark:text-brand-400 tracking-tight">
                Open for success !
              </h3>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                Développez votre cabinet, séduisez vos clients.
              </p>
            </div>

            {/* Illustration conceptuelle stylisée finance & fiscalité */}
            <div className="relative mx-auto lg:mx-0 w-full max-w-md h-48 rounded-2xl bg-gradient-to-tr from-brand-600/20 via-emerald-500/10 to-amber-500/20 border border-brand-500/30 flex items-center justify-center p-6 overflow-hidden">
              <div className="text-center space-y-2">
                <div className="flex justify-center gap-2 text-brand-500">
                  <Users className="h-8 w-8 animate-bounce" />
                  <FileText className="h-8 w-8" />
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <p className="text-xs font-bold text-foreground">Multi-dossiers & Télé-déclaration OTR Directe</p>
                <span className="text-[10px] text-muted-foreground">Collaborateurs illimités · Export Liasse SYSCOHADA</span>
              </div>
            </div>
          </div>

          {/* Bloc droit descriptif & bouton vert néon */}
          <div className="space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Découvrez FiscLens for Accountants
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Simplifiez vos process, accélérez vos décisions et boostez votre relation client avec <strong>FiscLens for Accountants</strong>, la nouvelle suite de solutions conçue pour les cabinets d&apos;expertise comptable et de commissariat aux comptes au Togo.
            </p>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Gérez vos clients depuis un point d&apos;entrée unique et collaborez en temps réel avec FiscLens Active. Valorisez vos missions et maximisez la croissance de votre cabinet avec des rapports financiers clairs et conformes OTR.
            </p>

            <div className="pt-2">
              <p className="text-xs font-bold text-foreground mb-3">
                Faites l&apos;expérience FiscLens for Accountants dès aujourd&apos;hui !
              </p>

              <Link href="/register">
                <button className="px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-brand-500/30 hover:scale-105 transition-all">
                  Je veux en savoir plus
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BANNIÈRE D'AVERTISSEMENT FISCAL OTR (Image 1 bottom)                  */}
      {/* ========================================================================= */}
      <div className="py-6 bg-brand-950/40 border-y border-brand-500/30 text-center px-4">
        <p className="text-xs text-muted-foreground font-medium">
          Vous n&apos;aurez plus d&apos;excuse :
        </p>
        <p className="text-sm font-extrabold text-brand-400 mt-0.5">
          Facture normalisée et télé-déclaration OTR obligatoires dans tout le Togo
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 7. LE BLOG & FLASH DES CLÉS DE LA GESTION FISCALE AU TOGO (Image 3)       */}
      {/* ========================================================================= */}
      <section id="blog-fiscal" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              FiscLens Advice
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              Le blog des clés de la gestion d&apos;entreprise & fiscalité au Togo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Consultez notre blog et trouvez des articles, des idées, des décryptages OTR et des conseils pour votre entreprise.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveBlogIndex((i) => (i > 0 ? i - 1 : 0))}
              disabled={activeBlogIndex === 0}
              className="p-2 rounded-full border border-border hover:bg-muted disabled:opacity-40"
              aria-label="Article précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveBlogIndex((i) => (i < articles.length - 1 ? i + 1 : i))}
              disabled={activeBlogIndex >= articles.length - 1}
              className="p-2 rounded-full border border-border hover:bg-muted disabled:opacity-40"
              aria-label="Article suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Grille des 5 articles de blog adaptés aux réalités togolaises */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {articles.map((art, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-brand-500/40 transition-all duration-300 group"
            >
              <div>
                {/* Image / Header avec gradient thématique */}
                <div className={`h-28 bg-gradient-to-br ${art.color} p-3 flex flex-col justify-between relative overflow-hidden`}>
                  <div className="flex justify-between items-center text-white/90">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full">
                      {art.category}
                    </span>
                    <span className="text-[9px] opacity-80">{art.readTime}</span>
                  </div>
                  <Sparkles className="h-6 w-6 text-white/40 absolute -bottom-1 -right-1" />
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2 group-hover:text-brand-500 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {art.desc}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 group-hover:underline inline-flex items-center gap-1">
                  Lire l&apos;article <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link href="/register">
            <button className="px-6 py-2 rounded-full border border-foreground/30 hover:border-brand-500 hover:text-brand-500 text-xs font-semibold transition-all">
              Accédez à tous les guides fiscaux FiscLens
            </button>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MATRICE DE SOLUTIONS PAR BESOIN SPÉCIFIQUE AU TOGO (Image 2)          */}
      {/* ========================================================================= */}
      <section id="besoins" className="py-14 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-6 border-t border-border/60">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          SOLUTIONS — PAR BESOIN SPÉCIFIQUE À VOTRE ENTREPRISE AU TOGO
        </h3>

        {/* Grille de liens de solutions */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm font-medium text-foreground/80 max-w-4xl mx-auto">
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Logiciel comptabilité SYSCOHADA</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Gestion commerciale & Facturation</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Facture normalisée OTR</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Trésorerie & Banque</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Logiciel Immobilisations</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Logiciel ERP Togo</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Finance & Bilan</a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm font-medium text-foreground/80 max-w-4xl mx-auto">
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Logiciel RH Togo</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Gestion de la paie & CNSS</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Dématérialisation fiscale</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Fiscalité (TVA 18%, IS, IRPP)</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Gestion de budget</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">Expertise comptable & CAC</a>
          <span>·</span>
          <a href="#solutions" className="hover:text-brand-500 transition-colors">CRM Clients</a>
        </div>

        <div className="pt-2">
          <Link
            href="/register"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Tous nos logiciels de gestion fiscale et comptable Togo →
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. MEGA-FOOTER SAGE-STYLE EXHAUSTIF (Image 4 & 5)                         */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-border bg-card py-14 px-4 sm:px-6 mt-auto text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Grille 3 Colonnes Majeures (Entreprise, Produits, Services) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Colonne 1 : ENTREPRISE */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Entreprise
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="hover:text-foreground transition-colors">Aperçu</Link></li>
                <li><Link href="/register" className="hover:text-foreground transition-colors">Carrières</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Évènements & Formations Lomé</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Réseaux sociaux</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">À propos de FiscLens Togo</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Partenaires fiscaux (OTR & CCIT)</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Investisseurs</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Actualités / Presse</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Durabilité et conformité légale</Link></li>
              </ul>
            </div>

            {/* Colonne 2 : PRODUITS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Produits & Fiscalité
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="#solutions" className="hover:text-foreground transition-colors">FiscLens Active (Artisans & TPE)</Link></li>
                <li><Link href="#solutions" className="hover:text-foreground transition-colors">FiscLens 50 Pro (PME & Entreprises)</Link></li>
                <li><Link href="#solutions" className="hover:text-foreground transition-colors">FiscLens Business Cloud Paie & CNSS</Link></li>
                <li><Link href="#solutions" className="hover:text-foreground transition-colors">FiscLens 100 ERP Togo</Link></li>
                <li><Link href="#solutions" className="hover:text-foreground transition-colors">FiscLens Cabinet & Experts-Comptables</Link></li>
                <li><Link href="#solutions" className="hover:text-foreground transition-colors">Moteur TVA (18%) & Liasse OTR</Link></li>
                <li><Link href="#solutions" className="hover:text-foreground transition-colors">Module Clôture & TAFIRE SYSCOHADA</Link></li>
                <li><Link href="/register" className="hover:text-foreground transition-colors">Afficher tous les produits</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors font-bold text-brand-600 dark:text-brand-400">Connexion Espace Client</Link></li>
              </ul>
            </div>

            {/* Colonne 3 : SERVICES ET ASSISTANCE */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Services et Assistance
              </h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="hover:text-foreground transition-colors">Assistance en ligne</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Contact Support Lomé</Link></li>
                <li><Link href="#blog-fiscal" className="hover:text-foreground transition-colors">Blog FiscLens Advice</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Espace Client My FiscLens</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">FiscLens University (Formations SYSCOHADA)</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Base de connaissances & Code Général des Impôts</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Espace Client Experts-comptables</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Partner Hub Togo</Link></li>
                <li><Link href="/" className="hover:text-foreground transition-colors">Programme d&apos;affiliation FiscLens</Link></li>
              </ul>
            </div>
          </div>

          {/* Ligne inférieure avec segments, logo et réseaux */}
          <div className="border-t border-border/80 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <LogoAnimated size="sm" />
              <div className="flex flex-wrap gap-4 text-xs text-foreground font-semibold pt-1">
                <Link href="#solutions" className="hover:text-brand-500 transition-colors">Petites entreprises (TPE)</Link>
                <span>·</span>
                <Link href="#solutions" className="hover:text-brand-500 transition-colors">Moyennes et grandes entreprises (PME et ETI)</Link>
                <span>·</span>
                <Link href="#accountants" className="hover:text-brand-500 transition-colors">Experts-comptables</Link>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground md:text-right">
              <div className="flex items-center md:justify-end gap-3 text-foreground">
                <span className="font-semibold">Nos opportunités de partenariat</span>
                <span>·</span>
                <span className="font-semibold">Revendeurs</span>
                <span>·</span>
                <span className="font-semibold">FiscLens Marketplace</span>
              </div>
              <p className="text-[11px]">
                © {new Date().getFullYear()} FiscLens Togo. Conforme aux normes SYSCOHADA révisé & République Togolaise.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
