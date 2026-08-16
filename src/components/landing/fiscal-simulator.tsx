"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/lib/utils";
import { Calculator, Sparkles, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export function FiscalSimulator() {
  const [caHT, setCaHT] = useState(25_000_000); // 25M FCFA
  const [chargesHT, setChargesHT] = useState(12_000_000); // 12M FCFA
  const [masseSalariale, setMasseSalariale] = useState(5_000_000); // 5M FCFA

  const calculations = useMemo(() => {
    // 1. TVA 18%
    const tvaCollectee = Math.round(caHT * 0.18);
    const tvaDeductible = Math.round(chargesHT * 0.18);
    const tvaNette = Math.max(0, tvaCollectee - tvaDeductible);

    // 2. CNSS Togo (Employeur 17.5%, Employé 4%)
    const cnssPatronale = Math.round(masseSalariale * 0.175);
    const cnssSalariale = Math.round(masseSalariale * 0.04);
    const totalCnss = cnssPatronale + cnssSalariale;

    // 3. Résultat fiscal & IS / IMF (CGI Togo)
    const totalCharges = chargesHT + masseSalariale + cnssPatronale;
    const resultatFiscal = Math.max(0, caHT - totalCharges);

    const is27 = Math.round(resultatFiscal * 0.27);
    const imf1 = Math.max(200_000, Math.round(caHT * 0.01)); // Minimum forfaitaire OTR 200k
    const isAPayer = Math.max(is27, imf1);

    const resultatNet = caHT - totalCharges - isAPayer;

    return {
      tvaCollectee,
      tvaDeductible,
      tvaNette,
      totalCnss,
      isAPayer,
      is27,
      imf1,
      isImfApplied: imf1 > is27,
      resultatNet,
    };
  }, [caHT, chargesHT, masseSalariale]);

  return (
    <Card className="glass-card border-brand-500/30 overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-500">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                Simulateur Fiscal & Social Interactif
                <Badge variant="success" className="text-[10px] uppercase font-mono">
                  OTR & SYSCOHADA
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Ajustez les curseurs pour voir le calcul automatique en temps réel selon les barèmes fiscaux togolais.
              </CardDescription>
            </div>
          </div>
          <span className="text-xs font-semibold text-brand-500 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Moteur temps réel
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Curseurs interactifs */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 1. CA */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Chiffre d&apos;Affaires HT</span>
              <span className="font-mono font-bold text-brand-500">{formatFcfa(caHT)}</span>
            </div>
            <input
              type="range"
              min={1_000_000}
              max={100_000_000}
              step={1_000_000}
              value={caHT}
              onChange={(e) => setCaHT(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 M</span>
              <span>100 M FCFA</span>
            </div>
          </div>

          {/* 2. Charges */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Achats & Charges HT</span>
              <span className="font-mono font-bold text-amber-500">{formatFcfa(chargesHT)}</span>
            </div>
            <input
              type="range"
              min={500_000}
              max={60_000_000}
              step={500_000}
              value={chargesHT}
              onChange={(e) => setChargesHT(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>500 k</span>
              <span>60 M FCFA</span>
            </div>
          </div>

          {/* 3. Salaires */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Masse Salariale Brute</span>
              <span className="font-mono font-bold text-cyan-500">{formatFcfa(masseSalariale)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={30_000_000}
              step={500_000}
              value={masseSalariale}
              onChange={(e) => setMasseSalariale(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>30 M FCFA</span>
            </div>
          </div>
        </div>

        {/* Résultats calculés instantanés */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* TVA */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              TVA Nette (18%)
            </p>
            <p className="font-mono font-extrabold text-base sm:text-lg text-brand-500 tabular-nums">
              {formatFcfa(calculations.tvaNette)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {calculations.tvaCollectee > 0 ? "Collectée - Déductible" : "Exonérée"}
            </p>
          </div>

          {/* CNSS */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              CNSS Totale
            </p>
            <p className="font-mono font-extrabold text-base sm:text-lg text-cyan-500 tabular-nums">
              {formatFcfa(calculations.totalCnss)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Taux légal 21.5%
            </p>
          </div>

          {/* IS / IMF */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              IS / IMF Estimé
            </p>
            <p className="font-mono font-extrabold text-base sm:text-lg text-amber-500 tabular-nums">
              {formatFcfa(calculations.isAPayer)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {calculations.isImfApplied ? "IMF 1% appliqué" : "IS 27% du bénéfice"}
            </p>
          </div>

          {/* Résultat Net */}
          <div className="p-3.5 rounded-xl border border-brand-500/40 bg-brand-500/10 space-y-1">
            <p className="text-[11px] font-bold text-brand-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Résultat Net
            </p>
            <p className="font-mono font-extrabold text-base sm:text-lg text-foreground tabular-nums">
              {formatFcfa(calculations.resultatNet)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Bénéfice après impôt
            </p>
          </div>
        </div>

        {/* Mini bannière SYSCOHADA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-brand-500 shrink-0" />
            <span>
              Génération automatique des écritures comptables (Classes 4, 6, 7) et liasses déclaratives OTR.
            </span>
          </div>
          <Link
            href="/register"
            className="text-brand-500 hover:text-brand-400 font-semibold inline-flex items-center gap-1 shrink-0"
          >
            Tester sur vos données réelles <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
