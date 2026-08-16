"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, ShieldAlert, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function CloturePage() {
  const [isLocked, setIsLocked] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const checks = [
    { title: "Équilibre strict de la balance générale (Σ Débit = Σ Crédit)", valid: true },
    { title: "Inventaire et dotations aux amortissements calculés", valid: true },
    { title: "Comptes d'attente (471/472) totalement soldés", valid: true },
    { title: "Rapprochements bancaires arrêtés au 31/12", valid: true },
    { title: "Toutes les pièces justificatives numérisées et rattachées", valid: true },
  ];

  function handleLock() {
    setIsLocked(true);
    setConfirmOpen(false);
    toast.error("Exercice 2024 officiellement clôturé et verrouillé.");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" /> Clôture d&apos;exercice fiscal & comptable
        </h2>
        <p className="text-sm text-muted-foreground">
          Verrouillage définitif des écritures de l&apos;exercice N. Action réservée au profil GÉRANT.
        </p>
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

      {/* Checklist pré-clôture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vérifications préalables à la clôture — Exercice 2024</CardTitle>
          <CardDescription>Tous les contrôles automatisés doivent être validés avant l&apos;opération de clôture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span className="text-sm font-medium">{c.title}</span>
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
                Conforme
              </span>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/20 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Exercice cible : <strong className="text-foreground">2024</strong> (1er janv. - 31 déc. 2024)
          </div>
          {!isLocked ? (
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              className="gap-2"
            >
              <Lock className="h-4 w-4" /> Clôturer et verrouiller l&apos;exercice 2024
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-200">
              <Lock className="h-4 w-4" /> Exercice 2024 verrouillé (Lecture seule)
            </div>
          )}
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
                Êtes-vous certain de vouloir clôturer l&apos;exercice 2024 ? Cette action est irréversible et génère l&apos;écriture de bilan d&apos;ouverture pour 2025.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleLock}>
                Oui, verrouiller l&apos;exercice
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
