"use client";

import React, { useState } from "react";
import { formatFcfa } from "@/lib/utils";
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Receipt,
  BookOpen,
  Activity,
  Layers,
  ChevronRight,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TerminalPreview() {
  const [activeTab, setActiveTab] = useState<"ecritures" | "tva" | "audit">("ecritures");

  return (
    <div className="w-full rounded-2xl glass-card border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden relative group">
      {/* Barre de titre type macOS / Fintech */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-muted/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-2 font-mono text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-brand-500" /> fisclens-core-v2.5 // SYSCOHADA Engine (Lomé, TG)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("ecritures")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ecritures"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Écritures SYSCOHADA
          </button>
          <button
            onClick={() => setActiveTab("tva")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "tva"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Déclaration TVA (18%)
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "audit"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Contrôle & Sécurité
          </button>
        </div>
      </div>

      {/* Contenu de la fenêtre */}
      <div className="p-5 font-mono text-xs space-y-4">
        {/* Tab 1 : Écritures */}
        {activeTab === "ecritures" && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-muted-foreground border-b pb-2">
              <span>PIÈCE : #VT-2025-0842</span>
              <span>JOURNAL : VENTES</span>
              <span className="text-green-500 font-bold">● STATUT : ÉQUILIBRÉ (0.00 FCFA)</span>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="text-muted-foreground border-b border-border/40 text-[11px]">
                  <th className="pb-1.5 font-semibold">COMPTE</th>
                  <th className="pb-1.5 font-semibold">INTITULÉ SYSCOHADA</th>
                  <th className="pb-1.5 text-right font-semibold">DÉBIT (FCFA)</th>
                  <th className="pb-1.5 text-right font-semibold">CRÉDIT (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-foreground">
                <tr>
                  <td className="py-2 text-brand-400 font-bold">411100</td>
                  <td className="py-2 text-muted-foreground">Clients — Société TOGO BOISSONS</td>
                  <td className="py-2 text-right font-bold text-green-400">11 800 000</td>
                  <td className="py-2 text-right text-muted-foreground">—</td>
                </tr>
                <tr>
                  <td className="py-2 text-brand-400 font-bold">701100</td>
                  <td className="py-2 text-muted-foreground">Ventes de marchandises au Togo</td>
                  <td className="py-2 text-right text-muted-foreground">—</td>
                  <td className="py-2 text-right font-bold text-amber-400">10 000 000</td>
                </tr>
                <tr>
                  <td className="py-2 text-brand-400 font-bold">443100</td>
                  <td className="py-2 text-muted-foreground">État, TVA facturée sur ventes (18%)</td>
                  <td className="py-2 text-right text-muted-foreground">—</td>
                  <td className="py-2 text-right font-bold text-amber-400">1 800 000</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-brand-500/50 font-bold text-foreground">
                  <td colSpan={2} className="pt-2 text-right uppercase tracking-wider text-[11px]">
                    Totaux Équilibrés :
                  </td>
                  <td className="pt-2 text-right text-green-400">11 800 000</td>
                  <td className="pt-2 text-right text-green-400">11 800 000</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 2 : TVA */}
        {activeTab === "tva" && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-muted-foreground border-b pb-2">
              <span>FORMULAIRE OTR : CA-TVA 2025</span>
              <span className="text-amber-400 font-bold">ÉCHÉANCE : 15 DU MOIS SUIVANT</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-background/50 border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Base Imposable HT</span>
                <p className="text-sm font-bold text-foreground">{formatFcfa(45_000_000)}</p>
                <span className="text-[10px] text-brand-400">Taux standard 18%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-background/50 border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">TVA Déductible</span>
                <p className="text-sm font-bold text-foreground">{formatFcfa(5_220_000)}</p>
                <span className="text-[10px] text-blue-400">Sur achats & services</span>
              </div>
              <div className="p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/40 space-y-1">
                <span className="text-[10px] text-brand-500 uppercase font-bold">Net à Verser OTR</span>
                <p className="text-sm font-extrabold text-brand-400">{formatFcfa(2_880_000)}</p>
                <span className="text-[10px] text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Télé-déclaration prête
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3 : Audit & Sécurité */}
        {activeTab === "audit" && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-muted-foreground border-b pb-2">
              <span>JOURNAL D&apos;AUDIT & CONTRÔLE</span>
              <span className="text-green-400 font-bold">● SYSTÈME SÉCURISÉ (2FA ACTIF)</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-background/40 border">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-brand-400" />
                  <span>Chiffrement AES-256 & Signature JWT</span>
                </div>
                <span className="text-green-400 font-bold">CONFORME</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-background/40 border">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-brand-400" />
                  <span>Vérification d&apos;intégrité de la balance générale</span>
                </div>
                <span className="text-green-400 font-bold">0 ÉCART</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-background/40 border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />
                  <span>Règle anti-fraude OTR (Pas de suppression d&apos;écriture validée)</span>
                </div>
                <span className="text-green-400 font-bold">VERROUILLÉ</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
