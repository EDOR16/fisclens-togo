"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, ApiException } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ScopeType = "ALL" | "JOURNAL" | "DATE_RANGE";

const JOURNAUX = ["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"] as const;

interface ResetDataDialogProps {
  onSuccess?: () => void;
}

export function ResetDataDialog({ onSuccess }: ResetDataDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<ScopeType>("ALL");
  const [journal, setJournal] = useState<string>("ACHATS");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const canConfirm = confirmation === "EFFACER" && !isSubmitting;

  function resetState() {
    setScope("ALL");
    setJournal("ACHATS");
    setDateFrom("");
    setDateTo("");
    setConfirmation("");
    setResult(null);
  }

  function handleOpen() {
    resetState();
    setIsOpen(true);
  }

  function handleClose() {
    if (isSubmitting) return;
    setIsOpen(false);
    resetState();
  }

  async function handleSubmit() {
    if (!canConfirm) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const payload: any = {
        confirmation: "EFFACER",
        scope,
      };

      if (scope === "JOURNAL") {
        payload.journal = journal;
      }

      if (scope === "DATE_RANGE") {
        if (!dateFrom || !dateTo) {
          toast.error("Veuillez renseigner les deux dates");
          setIsSubmitting(false);
          return;
        }
        if (dateFrom > dateTo) {
          toast.error("La date de début doit être antérieure à la date de fin");
          setIsSubmitting(false);
          return;
        }
        payload.dateFrom = dateFrom;
        payload.dateTo = dateTo;
      }

      const res = await api.post<any>("/accounting/ecritures/reset", payload);

      setResult(res);
      toast.success(res.message || "Réinitialisation effectuée");

      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err instanceof ApiException) {
        toast.error(err.message || "Erreur de réinitialisation");
      } else {
        toast.error(err.message || "Erreur inattendue");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Bouton déclencheur */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 text-xs gap-1.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Réinitialiser les données
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-red-300 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b bg-red-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg text-red-900">
                    Réinitialisation des données comptables
                  </CardTitle>
                  <CardDescription className="text-xs text-red-700">
                    ⚠️ Cette action est <strong>irréversible</strong>. Toutes les écritures sélectionnées
                    seront définitivement supprimées avec leurs pièces jointes et anomalies.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Choix du périmètre */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Périmètre de la suppression</Label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope("ALL")}
                    disabled={isSubmitting}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-colors text-xs",
                      scope === "ALL"
                        ? "border-red-500 bg-red-50"
                        : "border-border hover:border-red-300"
                    )}
                  >
                    <p className="font-semibold text-foreground">Tout le dossier</p>
                    <p className="text-muted-foreground mt-0.5">Supprime toutes les écritures</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope("JOURNAL")}
                    disabled={isSubmitting}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-colors text-xs",
                      scope === "JOURNAL"
                        ? "border-red-500 bg-red-50"
                        : "border-border hover:border-red-300"
                    )}
                  >
                    <p className="font-semibold text-foreground">Par journal</p>
                    <p className="text-muted-foreground mt-0.5">Achats, Ventes, Banque...</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope("DATE_RANGE")}
                    disabled={isSubmitting}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-colors text-xs",
                      scope === "DATE_RANGE"
                        ? "border-red-500 bg-red-50"
                        : "border-border hover:border-red-300"
                    )}
                  >
                    <p className="font-semibold text-foreground">Par période</p>
                    <p className="text-muted-foreground mt-0.5">Intervalle de dates</p>
                  </button>
                </div>
              </div>

              {/* Options selon le scope */}
              {scope === "JOURNAL" && (
                <div className="space-y-2">
                  <Label className="text-sm">Journal concerné</Label>
                  <div className="flex flex-wrap gap-2">
                    {JOURNAUX.map((j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setJournal(j)}
                        disabled={isSubmitting}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-mono border transition-colors",
                          journal === j
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-background hover:bg-red-50 border-border"
                        )}
                      >
                        {j}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {scope === "DATE_RANGE" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Date de début</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      disabled={isSubmitting}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Date de fin</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      disabled={isSubmitting}
                      className="font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Confirmation forte */}
              <div className="space-y-2 p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-900">
                      Tapez <code className="px-1.5 py-0.5 rounded bg-red-100 font-mono">EFFACER</code> pour
                      débloquer le bouton de confirmation
                    </p>
                    <Input
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                      placeholder="EFFACER"
                      disabled={isSubmitting}
                      className="mt-2 font-mono text-center text-base tracking-widest border-red-300 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Résultat */}
              {result && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-2">
                  <p className="text-sm font-semibold text-green-900">
                    ✅ {result.message}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-white">
                      <span className="text-muted-foreground">Écritures :</span>
                      <span className="ml-2 font-mono font-bold">{result.deleted.ecritures}</span>
                    </div>
                    <div className="p-2 rounded bg-white">
                      <span className="text-muted-foreground">Lignes :</span>
                      <span className="ml-2 font-mono font-bold">{result.deleted.lignes}</span>
                    </div>
                    <div className="p-2 rounded bg-white">
                      <span className="text-muted-foreground">Anomalies :</span>
                      <span className="ml-2 font-mono font-bold">{result.deleted.anomalies}</span>
                    </div>
                    <div className="p-2 rounded bg-white">
                      <span className="text-muted-foreground">Hashes :</span>
                      <span className="ml-2 font-mono font-bold">{result.deleted.hashes}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t pt-4 bg-muted/20">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                {result ? "Fermer" : "Annuler"}
              </Button>
              {!result && (
                <Button
                  onClick={handleSubmit}
                  disabled={!canConfirm}
                  variant="destructive"
                  className={cn(
                    "text-xs gap-1.5",
                    !canConfirm && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Suppression en cours...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Confirmer la suppression définitive
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}