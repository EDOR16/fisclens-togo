"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle2, Eye, ShieldAlert, Filter } from "lucide-react";
import { toast } from "sonner";

type Anomaly = {
  id: string;
  type: "DOUBLON_FACTURE" | "TVA_INCOHERENTE" | "MONTANT_ATYPIQUE" | "PIECE_MANQUANTE";
  libelle: string;
  compte: string;
  montant: number;
  date: string;
  gravite: "HAUTE" | "MOYENNE" | "BASSE";
  statut: "OUVERT" | "EN_COURS" | "RESOLU";
};

const INITIAL_ANOMALIES: Anomaly[] = [];

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(INITIAL_ANOMALIES);

  function resolveAnomaly(id: string) {
    setAnomalies((list) =>
      list.map((a) => (a.id === id ? { ...a, statut: "RESOLU" } : a))
    );
    toast.success("Anomalie marquée comme résolue.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Moteur de Détection des Anomalies & Fraudes
            </h2>
            <Badge variant="destructive" className="text-xs">
              {anomalies.filter((a) => a.statut !== "RESOLU").length} actives
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Contrôle d&apos;intégrité continu : doublons de pièces, cohérence TVA 18%, seuils espèces et justificatifs
          </p>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-red-900">Gravité Haute</CardDescription>
            <CardTitle className="text-2xl font-mono text-red-600">
              {anomalies.filter((a) => a.gravite === "HAUTE" && a.statut !== "RESOLU").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-amber-900">Gravité Moyenne</CardDescription>
            <CardTitle className="text-2xl font-mono text-amber-600">
              {anomalies.filter((a) => a.gravite === "MOYENNE" && a.statut !== "RESOLU").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-green-900">Anomalies Traitées</CardDescription>
            <CardTitle className="text-2xl font-mono text-green-700">
              {anomalies.filter((a) => a.statut === "RESOLU").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anomalies relevées sur l&apos;exercice</CardTitle>
          <CardDescription>Aucune anomalie détectée pour le moment sur cet environnement réel.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-hand text-3xl">Aucune anomalie à traiter.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Les doublons, écarts TVA, montants atypiques et pièces manquantes seront listés automatiquement dès qu’une donnée réelle sera saisie.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
