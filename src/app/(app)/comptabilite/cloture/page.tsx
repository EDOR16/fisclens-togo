"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import {
  CheckCircle2,
  Lock,
  Unlock,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Scale,
  FileCheck,
  Building2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CheckItem = {
  id: string;
  title: string;
  description: string;
  valid: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO";
};

type ClotureData = {
  exerciceYear: number;
  isLocked: boolean;
  tenantName: string;
  totalEcritures: number;
  clotureesCount: number;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  canCloture: boolean;
  checks: CheckItem[];
};

export default function CloturePage() {
  const [data, setData] = useState<ClotureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/accounting/cloture");
      if (!res.ok) throw new Error("Erreur de chargement");
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error("Erreur lors de la vérification de clôture");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLock() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/accounting/cloture", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erreur");
      toast.success(json.message || "Exercice officiellement clôturé et verrouillé.");
      setConfirmOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Impossible de clôturer l'exercice");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnlock() {
    if (!confirm("Voulez-vous réouvrir exceptionnellement cet exercice ?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/accounting/cloture", {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Erreur");
      toast.success(json.message || "Exercice réouvert.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Impossible de réouvrir l'exercice");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Clôture d&apos;exercice fiscal & comptable
          </h2>
          <p className="text-sm text-muted-foreground">
            Verrouillage définitif des écritures de l&apos;exercice. Contrôles de conformité SYSCOHADA en direct.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Actualiser les contrôles
        </Button>
      </div>

      {/* Avertissement réglementaire SYSCOHADA */}
      <Card className="border-red-200 bg-red-50/60">
        <CardContent className="pt-6 flex gap-4">
          <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-red-950">
            <p className="font-semibold">Principe d&apos;intangibilité du bilan et verrouillage immuable (SYSCOHADA art. 19)</p>
            <p className="text-xs text-red-900 leading-relaxed">
              Une fois l&apos;exercice clôturé, aucune écriture ne pourra plus être modifiée ni supprimée. Toute correction ultérieure
              devra impérativement faire l&apos;objet d&apos;une contre-passation sur l&apos;exercice suivant avec traçabilité d&apos;audit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      {data && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold">Statut Exercice</CardDescription>
              <CardTitle className="text-xl flex items-center gap-2">
                {data.isLocked ? (
                  <Badge variant="destructive" className="gap-1">
                    <Lock className="h-3 w-3" /> Verrouillé / Clôturé
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 text-white gap-1 hover:bg-emerald-600">
                    <Unlock className="h-3 w-3" /> Exercice Ouvert
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold">Volume d&apos;écritures</CardDescription>
              <CardTitle className="text-xl font-mono">
                {data.totalEcritures} écriture{data.totalEcritures > 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className={cn(data.isBalanced ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30")}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold">Équilibre Balance</CardDescription>
              <CardTitle className="text-lg font-mono">
                {data.isBalanced ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Équilibrée
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> Écart détecté
                  </span>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Checklist pré-clôture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Contrôles préalables automatisés — Exercice {data?.exerciceYear || new Date().getFullYear()}</span>
            {data && (
              <Badge variant="outline" className="font-mono text-xs">
                Dossier : {data.tenantName || "Actif"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Tous les contrôles bloquants doivent être validés avant l&apos;opération de clôture définitive.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              Vérification des écritures et des comptes en cours...
            </div>
          ) : (
            data?.checks.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-lg border",
                  c.valid ? "bg-card border-border" : "bg-amber-50/40 border-amber-200"
                )}
              >
                <div className="flex items-start gap-3">
                  {c.valid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0",
                    c.valid
                      ? "text-green-700 bg-green-50"
                      : "text-amber-700 bg-amber-50"
                  )}
                >
                  {c.valid ? "Conforme" : "À vérifier"}
                </span>
              </div>
            ))
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/20 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Exercice cible : <strong className="text-foreground">{data?.exerciceYear || new Date().getFullYear()}</strong>
          </div>

          <div className="flex items-center gap-2">
            {data?.isLocked ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-200">
                  <Lock className="h-4 w-4" /> Exercice verrouillé (Lecture seule)
                </div>
                <Button variant="outline" size="sm" onClick={handleUnlock} disabled={actionLoading}>
                  <Unlock className="h-4 w-4 mr-1" /> Réouvrir
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={!data?.canCloture || actionLoading}
                className="gap-2"
              >
                <Lock className="h-4 w-4" /> Clôturer et verrouiller l&apos;exercice {data?.exerciceYear || ""}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Modal / Dialog confirmation */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-300 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle className="text-lg">Confirmer la clôture définitive</CardTitle>
              </div>
              <CardDescription>
                Êtes-vous certain de vouloir clôturer l&apos;exercice {data?.exerciceYear} ?
                Toutes les écritures seront verrouillées et protégées en conformité SYSCOHADA.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={actionLoading}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleLock} disabled={actionLoading}>
                {actionLoading ? "Verrouillage en cours..." : "Oui, verrouiller l'exercice"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
