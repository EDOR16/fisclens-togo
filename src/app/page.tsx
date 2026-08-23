"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { LogoAnimated } from "@/components/ui/logo-animated";
import {
  ShieldCheck,
  Calculator,
  ArrowRight,
  Check,
  FileText,
  Building2,
  Users,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  Receipt,
  Scale,
  Clock,
  Briefcase,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { formatFcfa } from "@/lib/utils";

// Badge de référence légale (Principe 6.5)
function LegalRef({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span
      className={`inline-block ml-1.5 px-1.5 py-0.5 rounded border text-[10px] font-mono tracking-tight ${
        warn
          ? "border-amber-600/50 text-amber-700 bg-amber-50"
          : "border-[#0B3D2E]/30 text-[#33604C] bg-white/60"
      }`}
    >
      {children}
    </span>
  );
}

// Tampon Comptable
function Stamp({
  children,
  color = "#157A46",
  variant = "badge",
}: {
  children: React.ReactNode;
  color?: string;
  variant?: "badge" | "circle";
}) {
  if (variant === "circle") {
    return (
      <div
        className="stamp-circle"
        style={{ borderColor: color, color }}
      >
        <span className="text-[10px] font-extrabold leading-tight text-center">
          {children}
        </span>
      </div>
    );
  }
  return (
    <span
      className="stamp-badge"
      style={{ borderColor: color, color }}
    >
      {children}
    </span>
  );
}

// Surligneur Jaune Togo
function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="highlight-togo">{children}</span>;
}

// Calcul de la prochaine échéance réelle OTR
function getProchaineEcheance() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const le15 = new Date(year, month, 15);
  const due = now.getTime() <= le15.getTime() ? le15 : new Date(year, month + 1, 15);
  const diffDays = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const dueFormatted = due.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return { dueFormatted, diffDays };
}

export default function GrandLivreLandingPage() {
  // Simulateur Fiscal Interactif
  const [caMensuel, setCaMensuel] = useState(5_000_000); // 5 000 000 FCFA
  const [margeEstimee, setMargeEstimee] = useState(30); // 30%
  const [activePersona, setActivePersona] = useState<"gerant" | "expert" | "artisan" | "daf">("gerant");

  // Calculs fiscaux rigoureux (CGI Togo / SYSCOHADA)
  const calc = useMemo(() => {
    const caAnnuel = caMensuel * 12;
    const tvaCollectee = Math.round(caMensuel * 0.18); // 18% standard
    const beneficeEstime = Math.max(0, caAnnuel * (margeEstimee / 100));
    const isTheorique = Math.round(beneficeEstime * 0.27); // IS 27%
    const imf = Math.max(200_000, Math.round(caAnnuel * 0.01)); // IMF 1% plancher 200 000 F
    const impotDu = Math.max(isTheorique, imf);
    const regleRetenue = isTheorique >= imf ? "IS (27%)" : "IMF (1% plancher)";

    return {
      caAnnuel,
      tvaCollectee,
      beneficeEstime,
      isTheorique,
      imf,
      impotDu,
      regleRetenue,
    };
  }, [caMensuel, margeEstimee]);

  const echeance = useMemo(() => getProchaineEcheance(), []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 font-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 h-[600px] w-[600px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute top-1/4 right-0 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-lens-red/10 blur-[120px]" />
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR : RÉFÉRENCES RÉGLEMENTAIRES SOURCÉES                         */}
      {/* ========================================================================= */}
      <div className="relative z-30 bg-black/40 backdrop-blur-md text-slate-300 text-xs py-2.5 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-white font-semibold">RÉFÉRENTIEL TOGO :</span>
            <span className="opacity-90">
              SYSCOHADA Révisé · CGI Togo (IS 27%, TVA 18%, IRPP art. 74) · OTR Formulaires CA3
            </span>
          </div>
          <div className="font-mono text-[11px]">
            <span>Lomé, République Togolaise</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVBAR GRAND LIVRE                                                     */}
      {/* ========================================================================= */}
      <header className="border-b border-[#E2D9C2] bg-[#FBF7EC]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="focus:outline-none">
              <LogoAnimated size="md" />
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-[#33604C]">
              <a href="#simulateur" className="hover:text-[#0B3D2E] transition-colors">
                Simulateur Sourcé
              </a>
              <a href="#preuve" className="hover:text-[#0B3D2E] transition-colors">
                Preuve par l&apos;Article
              </a>
              <a href="#tarifs" className="hover:text-[#0B3D2E] transition-colors">
                Tarifs en Reçus
              </a>
              <a href="#cabinets" className="hover:text-[#0B3D2E] transition-colors">
                Espace Cabinets
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-5 py-2 rounded-full text-xs font-mono font-bold text-[#0B3D2E] border border-[#0B3D2E]/30 hover:bg-[#0B3D2E]/5 transition-colors">
                Connexion
              </button>
            </Link>
            <Link href="/register">
              <button className="px-5 py-2 rounded-full text-xs font-mono font-bold text-[#FBF7EC] bg-[#0B3D2E] hover:bg-[#157A46] shadow-md transition-colors">
                Ouvrir un Dossier
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION : "CHAQUE CHIFFRE A SA LOI" & SIMULATEUR REÇU PERFORÉ     */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Colonne gauche : Titre & Positionnement */}
          <div className="lg:col-span-6 space-y-6">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#33604C] flex items-center gap-2 flex-wrap">
              <span>SYSCOHADA</span>
              <LegalRef>Acte uniforme OHADA</LegalRef>
              <span>CGI</span>
              <LegalRef>art. 74</LegalRef>
              <span>OTR</span>
              <LegalRef>CA3</LegalRef>
            </div>

            <h1 className="font-hand text-6xl sm:text-7xl lg:text-8xl text-[#0B3D2E] leading-[0.95] tracking-tight">
              Chaque chiffre<br />a sa loi.
            </h1>

            <p className="text-base sm:text-lg text-[#33604C] leading-relaxed max-w-lg">
              Comptabilité SYSCOHADA, TVA 18 %, IRPP barème art. 74, IS vs IMF : <span className="text-ink">Fisc</span><span className="text-[#B3261E] font-bold">Lens</span> Togo calcule,{" "}
              <strong className="text-[#0B3D2E]">cite l&apos;article de loi</strong>, et prépare vos déclarations OTR sans approximation.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register">
                <button className="px-7 py-3.5 rounded-full font-mono text-xs font-bold text-[#FBF7EC] bg-[#0B3D2E] hover:bg-[#157A46] shadow-xl hover:scale-105 transition-all">
                  Créer mon espace réel →
                </button>
              </Link>
              <a href="#preuve">
                <button className="px-7 py-3.5 rounded-full font-mono text-xs font-bold text-[#0B3D2E] border-2 border-[#0B3D2E] hover:bg-[#0B3D2E] hover:text-[#FBF7EC] transition-all">
                  Voir un calcul sourcé
                </button>
              </a>
            </div>

            <div className="pt-4 flex items-center gap-6 font-mono text-[11px] text-[#33604C]">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#157A46]" /> Zéro donnée simulée en PROD
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[#157A46]" /> Équilibre strict Débit = Crédit
              </span>
            </div>
          </div>

          {/* Colonne droite : LE SIMULATEUR-REÇU PERFORÉ (Mockup 1) */}
          <div id="simulateur" className="lg:col-span-6 relative">
            <div className="receipt-perforated p-6 sm:p-8 rounded-lg text-[#0B3D2E] transform sm:rotate-1 hover:rotate-0 transition-transform duration-300">
              {/* En-tête du reçu avec tampon circulaire vert "ÉQUILIBRÉ" */}
              <div className="flex items-start justify-between border-b-2 border-dashed border-[#0B3D2E]/20 pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#33604C] block">
                    QUITTANCE D&apos;ESTIMATION FISCALE
                  </span>
                  <span className="font-mono text-xs font-bold text-[#0B3D2E]">
                    <span className="text-ink">Fisc</span><span className="text-[#B3261E] font-bold">Lens</span> Togo · Moteur SYSCOHADA v1.0
                  </span>
                </div>
                <Stamp variant="circle" color="#157A46">
                  ÉQUILIBRÉ
                </Stamp>
              </div>

              {/* Saisie interactive du Chiffre d'Affaires */}
              <div className="mt-6 space-y-4 font-mono">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#33604C]">
                    Chiffre d&apos;Affaires Mensuel HT (FCFA)
                  </label>
                  <input
                    type="number"
                    step={500_000}
                    value={caMensuel}
                    onChange={(e) => setCaMensuel(Math.max(0, Number(e.target.value) || 0))}
                    className="mt-1 w-full border-b-2 border-dashed border-[#0B3D2E] bg-transparent py-1 font-mono text-3xl font-bold text-[#0B3D2E] outline-none focus:border-[#157A46]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#33604C]">
                    <span>Marge bénéficiaire estimée :</span>
                    <span className="font-bold text-[#0B3D2E]">{margeEstimee}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={70}
                    step={5}
                    value={margeEstimee}
                    onChange={(e) => setMargeEstimee(Number(e.target.value))}
                    className="mt-2 w-full accent-[#0B3D2E] cursor-pointer"
                  />
                </div>
              </div>

              {/* Lignes du Reçu avec Surligneur Jaune Togo */}
              <div className="mt-6 space-y-3 font-mono text-xs border-t-2 border-dashed border-[#0B3D2E]/20 pt-4">
                <div className="flex items-center justify-between">
                  <span>
                    TVA Collectée (18%)
                    <LegalRef>CGI Togo standard</LegalRef>
                  </span>
                  <span className="font-bold text-sm">
                    {formatFcfa(calc.tvaCollectee)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>
                    IS Estimé (27% du bénéfice)
                    <LegalRef>CGI IS</LegalRef>
                  </span>
                  <span className="font-bold text-sm">
                    {formatFcfa(calc.isTheorique)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>
                    IMF (1% du CA annuel)
                    <LegalRef warn>plancher 200k F</LegalRef>
                  </span>
                  <span className="font-bold text-sm">
                    {formatFcfa(calc.imf)}
                  </span>
                </div>

                {/* Résultat Règle du Max */}
                <div className="border-t-2 border-dashed border-[#0B3D2E] pt-3 bg-[#FCD116]/15 p-3 rounded">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#33604C] font-bold">
                        Impôt annuel dû — règle du <Highlight>max(IS, IMF)</Highlight>
                      </p>
                      <span className="text-[10px] text-[#33604C]">
                        Application de la règle : {calc.regleRetenue}
                      </span>
                    </div>
                    <span className="font-mono text-xl font-extrabold text-[#0B3D2E]">
                      {formatFcfa(calc.impotDu)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compte à rebours échéance réelle */}
              <div className="mt-6 pt-4 border-t border-[#0B3D2E]/20 font-mono text-xs flex items-center justify-between">
                <div>
                  <span className="text-[#33604C] block text-[10px] uppercase tracking-wider">
                    PROCHAINE ÉCHÉANCE OTR RÉELLE :
                  </span>
                  <span className="font-bold text-[#0B3D2E]">
                    15 du mois — TVA · IRPP · CNSS ({echeance.dueFormatted})
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded bg-[#0B3D2E] text-[#FBF7EC] font-bold text-xs">
                  J-{echeance.diffDays}
                </div>
              </div>

              <div className="mt-4 text-[10px] text-[#33604C] font-mono leading-tight">
                * Calcul automatique selon les règles en vigueur en République Togolaise. Dans votre espace, le moteur applique le barème progressif IRPP [CGI art. 74] et les déductions réelles.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BANDEAU "CE MOIS-CI AU TOGO" (ÉCHÉANCIER VIVANT EN TEMPS RÉEL)         */}
      {/* ========================================================================= */}
      <section className="border-y-2 border-dashed border-[#0B3D2E]/20 bg-[#FDFAF1] py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#157A46] font-bold flex items-center gap-2">
                <Clock className="h-4 w-4" /> CALENDRIER FISCAL TOGO EN TEMPS RÉEL
              </span>
              <h3 className="font-mono text-lg font-bold text-[#0B3D2E]">
                Ce mois-ci : Télé-déclarations & Cotisations exigibles
              </h3>
            </div>

            {/* 3 Cartes d'échéances réelles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
              <div className="p-3.5 rounded-lg border border-[#E2D9C2] bg-white font-mono text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#0B3D2E]">TVA & IRPP / CNSS</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FCD116] text-[#0B3D2E] font-bold text-[10px]">
                    J-{echeance.diffDays}
                  </span>
                </div>
                <p className="text-[11px] text-[#33604C]">Exigible le 15 du mois prochain</p>
                <LegalRef>CGI / LPF Togo</LegalRef>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E2D9C2] bg-white font-mono text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#0B3D2E]">Taxe Patente</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#E2D9C2] text-[#0B3D2E] font-bold text-[10px]">
                    31 Mars
                  </span>
                </div>
                <p className="text-[11px] text-[#33604C]">Paiement annuel obligatoire</p>
                <LegalRef>CGI Section 10</LegalRef>
              </div>

              <div className="p-3.5 rounded-lg border border-[#E2D9C2] bg-white font-mono text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#0B3D2E]">Liasse SYSCOHADA</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#E2D9C2] text-[#0B3D2E] font-bold text-[10px]">
                    30 Avril
                  </span>
                </div>
                <p className="text-[11px] text-[#33604C]">Bilan & États financiers OTR</p>
                <LegalRef>OHADA / CGI</LegalRef>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. "LA PREUVE PAR L'ARTICLE" : LE MOTEUR FISCAL TOGOLAIS EXPOSÉ           */}
      {/* ========================================================================= */}
      <section id="preuve" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Stamp>ARGUMENT DE VENTE N°1</Stamp>
          <h2 className="font-hand text-5xl sm:text-6xl text-[#0B3D2E] tracking-tight">
            La preuve par l&apos;article de loi.
          </h2>
          <p className="text-sm text-[#33604C] leading-relaxed">
            <span className="text-ink">Fisc</span><span className="text-[#B3261E] font-bold">Lens</span> ne cache aucun calcul derrière une boîte noire. Voici comment le moteur décompose un bulletin de paie et la retenue IRPP ligne par ligne, avec chaque source juridique.
          </p>
        </div>

        {/* Tableau style Grand Livre avec marge rouge et annotations */}
        <div className="receipt-card p-6 sm:p-10 rounded-2xl max-w-4xl mx-auto font-mono text-xs space-y-4">
          <div className="border-b-2 border-[#0B3D2E] pb-3 flex justify-between items-center">
            <span className="font-bold uppercase tracking-wider text-[#0B3D2E]">
              CHAÎNE DE DÉCOMPOSITION SOCIALE & FISCALE (EXEMPLE 500 000 FCFA BRUT)
            </span>
            <span className="text-[11px] text-[#33604C]">RÉGIME GÉNÉRAL TOGO</span>
          </div>

          <div className="space-y-2.5 divide-y divide-[#E2D9C2]/60">
            <div className="pt-2 flex justify-between items-baseline">
              <div>
                <span className="font-bold text-[#0B3D2E]">1. SALAIRE BRUT CONTRACTUEL</span>
                <LegalRef>Contrat de travail</LegalRef>
              </div>
              <span className="font-bold text-sm">500 000 F</span>
            </div>

            <div className="pt-2 flex justify-between items-baseline text-[#33604C]">
              <div>
                <span>2. Déduction Cotisation CNSS Ouvrière (4%)</span>
                <LegalRef>Code Sécurité Sociale Togo</LegalRef>
              </div>
              <span>- 20 000 F</span>
            </div>

            <div className="pt-2 flex justify-between items-baseline text-[#33604C]">
              <div>
                <span>3. Déduction Cotisation AMU Ouvrière (5%)</span>
                <LegalRef>Décret 2023-096/PR</LegalRef>
              </div>
              <span>- 25 000 F</span>
            </div>

            <div className="pt-2 flex justify-between items-baseline font-semibold text-[#0B3D2E]">
              <div>
                <span>= SALAIRE BRUT IMPOSABLE (SBI)</span>
                <span className="text-[10px] text-[#33604C] block">Base de calcul de l&apos;impôt sur le revenu</span>
              </div>
              <span>455 000 F</span>
            </div>

            <div className="pt-2 flex justify-between items-baseline text-[#33604C]">
              <div>
                <span>4. Abattement forfaitaire pour frais professionnels (28%)</span>
                <LegalRef>CGI Togo art. 26</LegalRef>
              </div>
              <span>- 127 400 F</span>
            </div>

            <div className="pt-2 flex justify-between items-baseline font-bold text-[#0B3D2E]">
              <div>
                <span>= REVENU NET IMPOSABLE SOUMIS AU BARÈME PROGRESSIF</span>
                <LegalRef>CGI Togo art. 74</LegalRef>
              </div>
              <span>327 600 F</span>
            </div>

            <div className="pt-2 flex justify-between items-baseline text-[#157A46] font-bold">
              <div>
                <span>5. Application du Barème Progressif IRPP (Tranches 0% à 35%)</span>
                <span className="text-[10px] block text-[#33604C]">Avec déductions pour charges de famille [CGI art. 72-73]</span>
              </div>
              <span>Retenue calculée : 34 250 F</span>
            </div>

            <div className="pt-3 flex justify-between items-baseline bg-[#FCD116]/20 p-3 rounded-lg border border-[#FCD116]">
              <div>
                <span className="font-extrabold text-sm text-[#0B3D2E]">SALAIRE NET À PAYER AU SALARIÉ</span>
                <span className="text-[10px] text-[#33604C] block">Brut − CNSS − AMU − Retenue IRPP</span>
              </div>
              <span className="font-mono text-xl font-black text-[#0B3D2E]">433 250 FCFA</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. "CONÇU POUR LE RÉEL TOGOLAIS" (4 QUITTANCES DE CONCEPTION)             */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="font-hand text-5xl text-[#0B3D2E]">
            Conçu pour le réel togolais.
          </h2>
          <p className="text-xs sm:text-sm text-[#33604C]">
            Pas une adaptation superficielle d&apos;un logiciel européen : <span className="text-ink">Fisc</span><span className="text-[#B3261E] font-bold">Lens</span> répond aux réalités quotidiennes de Lomé, Kara et de l&apos;intérieur.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="receipt-card p-6 rounded-xl font-mono space-y-3">
            <div className="h-8 w-8 rounded-full bg-[#157A46]/10 text-[#157A46] flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="font-bold text-sm text-[#0B3D2E]">Saisie Hors-Ligne Résiliente</h3>
            <p className="text-xs text-[#33604C] leading-relaxed">
              Continuez à saisir vos pièces et factures même en cas de coupure internet. Synchronisation automatique dès le retour de la connexion.
            </p>
          </div>

          <div className="receipt-card p-6 rounded-xl font-mono space-y-3">
            <div className="h-8 w-8 rounded-full bg-[#FCD116]/30 text-[#0B3D2E] flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="font-bold text-sm text-[#0B3D2E]">T-Money & Flooz Intégrés</h3>
            <p className="text-xs text-[#33604C] leading-relaxed">
              Rapprochement automatisé des encaissements et paiements mobiles avec génération de la quittance comptable conforme.
            </p>
          </div>

          <div className="receipt-card p-6 rounded-xl font-mono space-y-3">
            <div className="h-8 w-8 rounded-full bg-[#0B3D2E]/10 text-[#0B3D2E] flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="font-bold text-sm text-[#0B3D2E]">Monnaie XOF au Franc Près</h3>
            <p className="text-xs text-[#33604C] leading-relaxed">
              Zéro centime flottant, calculs entiers stricts en Francs CFA (XOF) conformément aux normes bancaires de l&apos;UEMOA.
            </p>
          </div>

          <div className="receipt-card p-6 rounded-xl font-mono space-y-3">
            <div className="h-8 w-8 rounded-full bg-[#157A46]/10 text-[#157A46] flex items-center justify-center font-bold">
              04
            </div>
            <h3 className="font-bold text-sm text-[#0B3D2E]">Télétransmission CA3-OTR</h3>
            <p className="text-xs text-[#33604C] leading-relaxed">
              Export prêt pour la télé-déclaration OTR avec contrôle de cohérence entre CA déclaré et écritures de classe 7.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. TARIFS EN 3 REÇUS PERFORÉS (MOCKUP 2 EXACT)                           */}
      {/* ========================================================================= */}
      <section id="tarifs" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Stamp>FORFAITS TRANSPARENTS</Stamp>
          <h2 className="font-hand text-5xl sm:text-6xl text-[#0B3D2E]">
            Tarifs clairs, quittance en main.
          </h2>
          <p className="text-xs sm:text-sm text-[#33604C]">
            Aucun frais caché. Choisissez l&apos;offre adaptée à la taille de votre structure.
          </p>
        </div>

        {/* Grille des 3 reçus (Mockup 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
          {/* REÇU 1 : ACTIVE (10 000 F /mois) */}
          <div className="receipt-perforated p-6 sm:p-8 rounded-lg font-mono flex flex-col justify-between hover:translate-y-[-4px] transition-transform shadow-xl">
            <div>
              <div className="border-b-2 border-dashed border-[#0B3D2E]/30 pb-4">
                <span className="text-xs text-[#33604C] uppercase tracking-wider block">FORFAIT TPE & ARTISANS</span>
                <h3 className="text-2xl font-bold text-[#0B3D2E] mt-1">Active</h3>
              </div>

              <div className="py-6">
                <p className="text-3xl font-extrabold text-[#0B3D2E]">
                  10 000 F <span className="text-xs font-normal text-[#33604C]">/mois</span>
                </p>
                <p className="text-[11px] text-[#33604C] mt-2">
                  Idéal pour indépendants, artisans et micro-entreprises assujettis à la TPU ou au RSI.
                </p>
              </div>

              <div className="border-t border-dashed border-[#0B3D2E]/20 pt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Devis & Factures Normalisées
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Livre-journal des recettes
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Suivi des encours clients
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/register">
                <button className="w-full py-3 rounded-full font-bold text-xs text-[#0B3D2E] border-2 border-[#0B3D2E] hover:bg-[#0B3D2E] hover:text-[#FBF7EC] transition-colors">
                  Choisir Active
                </button>
              </Link>
              {/* Code-barres stylisé */}
              <div className="mt-4 flex justify-center opacity-40">
                <div className="h-6 w-36 bg-[repeating-linear-gradient(90deg,#0B3D2E,#0B3D2E_2px,transparent_2px,transparent_4px)]" />
              </div>
            </div>
          </div>

          {/* REÇU 2 : PRO (25 000 F /mois) — TAMPON "MEILLEUR CHOIX" */}
          <div className="receipt-perforated p-6 sm:p-8 rounded-lg font-mono flex flex-col justify-between hover:translate-y-[-4px] transition-transform shadow-2xl border-2 border-[#157A46] relative">
            <div className="absolute top-4 right-4">
              <Stamp color="#D4AF37" variant="circle">
                MEILLEUR CHOIX
              </Stamp>
            </div>

            <div>
              <div className="border-b-2 border-dashed border-[#0B3D2E]/30 pb-4">
                <span className="text-xs text-[#157A46] font-bold uppercase tracking-wider block">
                  POUR LES PME CONFORMES
                </span>
                <h3 className="text-2xl font-bold text-[#0B3D2E] mt-1">Pro</h3>
              </div>

              <div className="py-6">
                <p className="text-3xl font-extrabold text-[#0B3D2E]">
                  25 000 F <span className="text-xs font-normal text-[#33604C]">/mois</span>
                </p>
                <p className="text-[11px] text-[#33604C] mt-2">
                  La solution complète pour entreprises au Réel Normal : comptabilité SYSCOHADA et déclarations OTR.
                </p>
              </div>

              <div className="border-t border-dashed border-[#0B3D2E]/20 pt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Comptabilité Classes 1 à 8
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Déclaration TVA 18% automatique
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Bilan, Résultat & Liasse OTR
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Balance 6 colonnes & Grand Livre
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/register">
                <button className="w-full py-3 rounded-full font-bold text-xs text-[#FBF7EC] bg-[#0B3D2E] hover:bg-[#157A46] shadow-lg transition-colors">
                  Choisir Pro →
                </button>
              </Link>
              <div className="mt-4 flex justify-center opacity-40">
                <div className="h-6 w-36 bg-[repeating-linear-gradient(90deg,#0B3D2E,#0B3D2E_3px,transparent_3px,transparent_5px)]" />
              </div>
            </div>
          </div>

          {/* REÇU 3 : CABINET (SUR DEVIS) */}
          <div className="receipt-perforated p-6 sm:p-8 rounded-lg font-mono flex flex-col justify-between hover:translate-y-[-4px] transition-transform shadow-xl">
            <div>
              <div className="border-b-2 border-dashed border-[#0B3D2E]/30 pb-4">
                <span className="text-xs text-[#33604C] uppercase tracking-wider block">EXPERTS-COMPTABLES</span>
                <h3 className="text-2xl font-bold text-[#0B3D2E] mt-1">Cabinet</h3>
              </div>

              <div className="py-6">
                <p className="text-3xl font-extrabold text-[#0B3D2E]">
                  sur devis
                </p>
                <p className="text-[11px] text-[#33604C] mt-2">
                  Pour cabinets d&apos;expertise comptable, commissaires aux comptes et groupes multi-filiales.
                </p>
              </div>

              <div className="border-t border-dashed border-[#0B3D2E]/20 pt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Portefeuille Multi-Dossiers illimité
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Sécurité 2FA Obligatoire & Audit
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Portail de collaboration client
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#157A46]" /> Support dédié & formation Lomé
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/register">
                <button className="w-full py-3 rounded-full font-bold text-xs text-[#0B3D2E] border-2 border-[#0B3D2E] hover:bg-[#0B3D2E] hover:text-[#FBF7EC] transition-colors">
                  Contacter l&apos;Équipe
                </button>
              </Link>
              <div className="mt-4 flex justify-center opacity-40">
                <div className="h-6 w-36 bg-[repeating-linear-gradient(90deg,#0B3D2E,#0B3D2E_2px,transparent_2px,transparent_4px)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SECTION CABINETS : "VOUS GARDEZ LA SIGNATURE..."                       */}
      {/* ========================================================================= */}
      <section id="cabinets" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-[#0B3D2E] text-[#FBF7EC] p-8 sm:p-14 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <span className="font-mono text-xs text-[#FCD116] uppercase tracking-widest font-bold">
              POUR LES PROFESSIONNELS DU CHIFFRE
            </span>
            <h2 className="font-hand text-5xl sm:text-6xl text-[#FBF7EC] leading-tight">
              Vous gardez la signature et le jugement.<br />
              <span className="text-[#FCD116]"><span className="text-ink">Fisc</span><span className="text-[#B3261E] font-bold">Lens</span> prend le clavier et les échéances.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Libérez vos collaborateurs de la ressaisie manuelle. <span className="text-ink">Fisc</span><span className="text-[#B3261E] font-bold">Lens</span> sécurise les écritures d&apos;équilibrage, applique les proratas de déduction et prépare vos états financiers SYSCOHADA prêts à être certifiés.
            </p>
          </div>

          <div className="pt-4">
            <Link href="/register">
              <button className="px-8 py-3.5 rounded-full font-mono text-xs font-bold text-[#0B3D2E] bg-[#FCD116] hover:bg-amber-300 shadow-xl transition-all">
                Rejoindre le Programme Cabinets Togo →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FOOTER "LE GRAND LIVRE"                                                */}
      {/* ========================================================================= */}
      <footer className="border-t-2 border-[#0B3D2E]/20 bg-[#FDFAF1] py-14 px-4 sm:px-6 text-xs text-[#33604C] font-mono">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-2">
              <LogoAnimated size="sm" />
              <p className="text-[11px] max-w-md text-[#33604C]">
                Le Grand Livre Comptable & Moteur de Conformité Fiscale de la République Togolaise.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-xs font-bold text-[#0B3D2E]">
              <Link href="/login" className="hover:underline">Espace Connexion</Link>
              <Link href="/register" className="hover:underline">Créer un Dossier Réel</Link>
              <a href="#simulateur" className="hover:underline">Simulateur Fiscal</a>
              <a href="#preuve" className="hover:underline">Moteur IRPP</a>
              <a href="#tarifs" className="hover:underline">Tarifs</a>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E2D9C2] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>
              © {new Date().getFullYear()} <span className="text-ink">Fisc</span><span className="text-[#B3261E] font-bold">Lens</span> Togo. Conçu conformément aux référentiels <strong>SYSCOHADA Révisé</strong>, <strong>CGI Togo</strong> et formulaires OTR.
            </p>
            <p className="font-bold text-[#0B3D2E]">
              Protection des Données Financières · Loi n°2018-26 (Togo)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
