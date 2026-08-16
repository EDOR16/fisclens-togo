"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogoAnimated } from "@/components/ui/logo-animated";
import { DynamicBackground } from "@/components/landing/dynamic-background";
import { ThemeWallpaperModal } from "@/components/landing/theme-wallpaper-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  Building2,
  Calculator,
  PieChart,
  BarChart3,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { formatFcfa } from "@/lib/utils";

export default function LandingPage() {
  const [solutionType, setSolutionType] = useState("all");
  const [companySize, setCompanySize] = useState("all");

  return (
    <div className="min-h-screen bg-[#070b12] text-white flex flex-col font-sans selection:bg-brand-500 selection:text-white relative overflow-x-hidden">
      {/* Fond d'écran dynamique (100% optionnel, désactivé par défaut) */}
      <DynamicBackground />

      {/* Lignes d'onde vert néon en arrière-plan (Style Sage officiel) */}
      <div className="absolute top-[180px] left-0 right-0 h-[480px] pointer-events-none z-0 opacity-80 overflow-hidden">
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
      <header className="relative z-30 border-b border-white/10 bg-[#070b12]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-3.5">
          {/* Logo gauche */}
          <div className="flex items-center gap-8">
            <Link href="/" className="focus:outline-none">
              <LogoAnimated size="md" />
            </Link>

            {/* Liens de menu horizontaux */}
            <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-300">
              <a href="#solutions" className="hover:text-brand-400 transition-colors flex items-center gap-1">
                Produits & Solutions <ChevronDown className="h-3 w-3 opacity-60" />
              </a>
              <a href="#syscohada" className="hover:text-brand-400 transition-colors">
                SYSCOHADA Révisé
              </a>
              <a href="#fiscalite" className="hover:text-brand-400 transition-colors">
                Fiscalité OTR (18% TVA)
              </a>
              <a href="#cabinets" className="hover:text-brand-400 transition-colors">
                Experts-comptables
              </a>
              <a href="#support" className="hover:text-slate-100 transition-colors">
                Assistance & Guide
              </a>
            </nav>
          </div>

          {/* Côté droit : Recherche + Thème + Bouton Connexion */}
          <div className="flex items-center gap-3">
            {/* Personnalisation du thème / fond (Optionnel) */}
            <ThemeWallpaperModal />

            {/* Bouton Connexion style pilule Sage */}
            <Link href="/login">
              <button className="px-5 py-1.5 rounded-full text-xs font-semibold border border-white/40 hover:border-brand-400 hover:text-brand-400 hover:bg-white/5 transition-all text-white">
                Connexion
              </button>
            </Link>

            {/* Bouton Essai gratuit */}
            <Link href="/register" className="hidden sm:inline-block">
              <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-slate-950 transition-all shadow-md shadow-brand-500/20">
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
        {/* Titre Principal */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Pour chaque étape de votre activité
        </h1>

        {/* Sous-titre */}
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          FiscLens Togo fournit la technologie certifiée <strong className="text-white">SYSCOHADA révisé</strong> et
          l&apos;automatisation fiscale indispensables au bon fonctionnement et à la conformité de votre entreprise (OTR & CNSS).
        </p>

        {/* Barre de recherche / Sélecteur interactif style Sage (exactement comme le screenshot) */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base font-semibold text-slate-200">
          <span>Je recherche une solution de</span>

          {/* Select 1 : Solution */}
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

          {/* Select 2 : Taille */}
          <div className="relative inline-block">
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="appearance-none bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs sm:text-sm px-4 py-2 pr-8 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors shadow-lg shadow-brand-600/30"
            >
              <option value="all">Toutes les tailles d&apos;entreprise</option>
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
          {/* --------------------------------------------------------------------- */}
          {/* CARTE 1 : FiscLens Active (Artisans & TPE)                             */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white text-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-2xl border border-slate-200 hover:translate-y-[-4px] transition-transform duration-300">
            <div>
              {/* Badge offre */}
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-3">
                OFFRE FLASH ! 50 % de réduction les 3 premiers mois.
              </span>

              {/* Titre */}
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">FiscLens Active</h2>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Gérez les devis, factures normalisées et la comptabilité, ainsi que la TVA (18%), avec une solution cloud tout-en-un.
                Pour les artisans, commerçants et TPE.
              </p>

              {/* Tarif */}
              <p className="text-xs font-bold text-slate-800 mb-5">
                Dès 15 000 FCFA/mois
              </p>

              {/* Bouton CTA */}
              <Link href="/register">
                <button className="w-fit px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-slate-800 transition-colors mb-6 shadow-md">
                  Découvrez FiscLens Active
                </button>
              </Link>
            </div>

            {/* Widget Mockup UI en bas de carte : Suivi des encours */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 shadow-inner">
              <h4 className="text-xs font-bold text-slate-800">Suivi des encours</h4>

              {/* Encours clients */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                  <span>Encours clients</span>
                  <span className="font-bold text-slate-900">3 565 670 FCFA Total</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-brand-500 w-3/4 rounded-full" />
                </div>
                <span className="text-[9px] text-slate-400">Suivi des échéances par tiers · Balance âgée</span>
              </div>

              {/* Encours fournisseurs */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                  <span>Encours fournisseurs</span>
                  <span className="font-bold text-slate-900">865 670 FCFA Total</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-slate-700 w-1/3 rounded-full" />
                </div>
                <span className="text-[9px] text-slate-400">Suivi des règlements par tiers</span>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* CARTE 2 : FiscLens 50 Pro (PME & Entreprises)                          */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white text-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-2xl border-2 border-brand-500 hover:translate-y-[-4px] transition-transform duration-300 relative">
            {/* Tag recommandé */}
            <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
              Plus Populaire
            </div>

            <div>
              <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wide block mb-3">
                Conforme CGI Togo & SYSCOHADA Révisé
              </span>

              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">FiscLens 50 Pro</h2>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Boostez votre gestion avec FiscLens 50 : écritures comptables (Classes 1 à 8), journaux, balance 6 colonnes, IS (27%), IMF (1%) et déclarations OTR. Une solution puissante et fiable.
              </p>

              <p className="text-xs font-bold text-slate-800 mb-5">
                Pour les PME, dès 45 000 FCFA/mois
              </p>

              <Link href="/register">
                <button className="w-fit px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-slate-800 transition-colors mb-6 shadow-md">
                  Découvrez FiscLens 50 Pro
                </button>
              </Link>
            </div>

            {/* Widget Mockup UI en bas de carte : Répartition des charges */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 shadow-inner">
              <h4 className="text-xs font-bold text-slate-800">Répartition des charges SYSCOHADA</h4>

              <div className="flex items-center justify-center py-2 relative">
                {/* Anneau / Donut SVG interactif */}
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                  {/* Part 1 : 601000 Achats (45%) */}
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
                  {/* Part 2 : 615000 Services (30%) */}
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
                  {/* Part 3 : 606300 & Autres (25%) */}
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
                  <span className="text-[10px] font-bold text-slate-700 font-mono">100%</span>
                  <p className="text-[8px] text-slate-400">Équilibré</p>
                </div>
              </div>

              <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                <span className="text-green-700 font-bold">● 601000 : 45%</span>
                <span className="text-sky-700 font-bold">● 615000 : 30%</span>
                <span className="text-amber-700 font-bold">● 606300 : 25%</span>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* CARTE 3 : FiscLens Intacct (Experts-Comptables & Multi-Entités)        */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-white text-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-2xl border border-slate-200 hover:translate-y-[-4px] transition-transform duration-300">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-3">
                Pour les cabinets et entreprises en croissance
              </span>

              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">FiscLens Cabinet</h2>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Accélérez votre croissance grâce à une solution financière cloud complète : automatisation comptable, gestion multi-dossiers clients, liasses fiscales OTR et reporting en temps réel.
              </p>

              <p className="text-xs font-bold text-slate-800 mb-5">
                Multi-dossiers illimités · Mode Expert
              </p>

              <Link href="/register">
                <button className="w-fit px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-slate-800 transition-colors mb-6 shadow-md">
                  Découvrez FiscLens Cabinet
                </button>
              </Link>
            </div>

            {/* Widget Mockup UI en bas de carte : KPIs & Bar Chart par filiale */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 shadow-inner">
              {/* 3 mini KPI pills */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[8px] text-slate-400 block uppercase">Actifs</span>
                  <span className="text-[10px] font-bold text-slate-900 font-mono">14,445K ↗</span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[8px] text-slate-400 block uppercase">Recettes</span>
                  <span className="text-[10px] font-bold text-brand-600 font-mono">74,472K ↗</span>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                  <span className="text-[8px] text-slate-400 block uppercase">Revenu net</span>
                  <span className="text-[10px] font-bold text-amber-600 font-mono">27,475K ↗</span>
                </div>
              </div>

              {/* Bar Chart par dossier */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-700 block">Nouveau net par dossier</span>
                <div className="space-y-1 text-[9px] font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-14 truncate">Lomé Port</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 w-[85%]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 truncate">Zone Franche</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[65%]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 truncate">Kara Filiale</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
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
      {/* 4. CONFORMITÉ & GARANTIES FISCALES TOGOLAISES                             */}
      {/* ========================================================================= */}
      <section id="fiscalite" className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 sm:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <Badge variant="success" className="font-bold text-xs uppercase tracking-wider">
              Conformité OTR & CNSS Togo
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Une automatisation fiscale sans risque de redressement
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              FiscLens Togo intègre les règles du Code Général des Impôts (CGI) togolais en vigueur pour calculer avec exactitude la TVA (18%), l&apos;Impôt sur les Sociétés (27%), le Minimum Forfaitaire (1%) et les retenues d&apos;IRPP sur les salaires.
            </p>
            <div className="space-y-2 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-400" /> Export direct des liasses déclaratives au format OTR
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-400" /> Sécurité renforcée avec Authentification 2FA TOTP
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-400" /> Mode hors-ligne avec synchronisation automatique
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1424] p-6 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider">
              Moteur Fiscal Certifié FiscLens
            </h4>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-300">TVA Déductible & Facturée</span>
                <span className="text-brand-400 font-bold">18.00 %</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-300">Taux Impôt sur les Sociétés (IS)</span>
                <span className="text-amber-400 font-bold">27.00 %</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-300">Impôt Minimum Forfaitaire (IMF)</span>
                <span className="text-amber-400 font-bold">1.00 % (Min 200 000 F)</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-300">Cotisations CNSS Patronales</span>
                <span className="text-teal-400 font-bold">17.50 %</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER SAGE-STYLE                                                     */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-white/10 bg-[#05080e] py-12 px-4 sm:px-6 mt-auto text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoAnimated size="sm" />
            <span className="text-slate-500">|</span>
            <span className="text-[11px] text-slate-400">
              Logiciel Comptable & Fiscal SYSCOHADA (République Togolaise)
            </span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-white transition-colors">
              Espace Connexion
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              Créer un Compte
            </Link>
            <a href="#support" className="hover:text-white transition-colors">
              Support & Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
