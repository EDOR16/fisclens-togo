"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Anomaly = {
  id: string;
  type: string;
  libelle: string;
  piece: string;
  compte: string;
  montant: number;
  date: string;
  gravite: "HAUTE" | "MOYENNE" | "BASSE";
  statut: "OUVERT" | "RESOLU";
  explication: string;
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [hauteCount, setHauteCount] = useState(0);
  const [moyenneCount, setMoyenneCount] = useState(0);

  async function loadAnomalies() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/controle/anomalies");
      if (!res.ok) throw new Error("Erreur de chargement");
      const json = await res.json();
      setAnomalies(json.anomalies || []);
      setHauteCount(json.haute || 0);
      setMoyenneCount(json.moyenne || 0);
    } catch (err) {
      toast.error("Impossible de charger les anomalies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnomalies();
  }, []);

  function resolveAnomaly(id: string) {
    setAnomalies((list) =>
      list.map((a) => (a.id === id ? { ...a, statut: "RESOLU" } : a))
    );
    toast.success("Anomalie marquée comme traitée.");
  }

  const activeAnomalies = anomalies.filter((a) => a.statut !== "RESOLU");
  const resolues = anomalies.filter((a) => a.statut === "RESOLU").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Moteur de Détection des Anomalies & Fraudes
            </h2>
            <Badge variant={activeAnomalies.length > 0 ? "destructive" : "outline"} className="text-xs">
              {activeAnomalies.length} active{activeAnomalies.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Contrôle d&apos;intégrité continu : doublons de pièces, cohérence comptable, comptes d&apos;attente et pièces manquantes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnomalies} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Analyser les écritures
        </Button>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-red-900">Gravité Haute (Bloquante)</CardDescription>
            <CardTitle className="text-2xl font-mono text-red-600">
              {anomalies.filter((a) => a.gravite === "HAUTE" && a.statut !== "RESOLU").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-amber-900">Gravité Moyenne / Avertissement</CardDescription>
            <CardTitle className="text-2xl font-mono text-amber-600">
              {anomalies.filter((a) => a.gravite === "MOYENNE" && a.statut !== "RESOLU").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-green-900">Anomalies Résolues</CardDescription>
            <CardTitle className="text-2xl font-mono text-green-700">
              {resolues}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anomalies relevées sur les écritures comptables</CardTitle>
          <CardDescription>
            {activeAnomalies.length > 0
              ? `${activeAnomalies.length} point(s) d'attention identifié(s) nécessitant une vérification.`
              : "Toutes les écritures sont conformes aux règles de contrôle."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              Audit des écritures comptables en cours...
            </div>
          ) : activeAnomalies.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 m-6 p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold">Aucune anomalie détectée</p>
              <p className="text-xs text-muted-foreground mt-1">
                Toutes les pièces, équilibres de balance et ventilations sont parfaitement conformes.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Pièce</TableHead>
                  <TableHead>Description de l&apos;anomalie</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Gravité</TableHead>
                  <TableHead className="w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAnomalies.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.date}</TableCell>
                    <TableCell className="font-semibold text-xs">{a.piece}</TableCell>
                    <TableCell>
                      <p className="text-xs font-medium text-foreground">{a.libelle}</p>
                      <p className="text-[11px] text-muted-foreground">{a.explication}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{formatAmount(a.montant)} FCFA</TableCell>
                    <TableCell>
                      <Badge
                        variant={a.gravite === "HAUTE" ? "destructive" : "outline"}
                        className={cn("text-[10px]", a.gravite === "MOYENNE" && "border-amber-400 bg-amber-50 text-amber-800")}
                      >
                        {a.gravite}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => resolveAnomaly(a.id)}>
                        Résoudre
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
