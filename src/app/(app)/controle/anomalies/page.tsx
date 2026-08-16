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

const INITIAL_ANOMALIES: Anomaly[] = [
  { id: "1", type: "DOUBLON_FACTURE", libelle: "Facture FAC-2025-014 déjà enregistrée le 08/08", compte: "401000", montant: 780_000, date: "2025-08-10", gravite: "HAUTE", statut: "OUVERT" },
  { id: "2", type: "TVA_INCOHERENTE", libelle: "Taux TVA effectif à 14.2% au lieu de 18% sur écriture #089", compte: "445200", montant: 1_250_000, date: "2025-08-12", gravite: "HAUTE", statut: "OUVERT" },
  { id: "3", type: "MONTANT_ATYPIQUE", libelle: "Dépense de caisse inhabituelle supérieure à 500 000 FCFA", compte: "571000", montant: 650_000, date: "2025-08-13", gravite: "MOYENNE", statut: "EN_COURS" },
  { id: "4", type: "PIECE_MANQUANTE", libelle: "Aucune pièce justificative PDF rattachée à l'écriture #094", compte: "601000", montant: 320_000, date: "2025-08-14", gravite: "BASSE", statut: "OUVERT" },
];

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
          <CardDescription>Actions correctives ou justifications requises avant clôture</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Gravité</TableHead>
                <TableHead>Type & Description</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalies.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{formatDate(a.date)}</TableCell>
                  <TableCell>
                    {a.gravite === "HAUTE" && <Badge variant="destructive">Haute</Badge>}
                    {a.gravite === "MOYENNE" && <Badge variant="warning">Moyenne</Badge>}
                    {a.gravite === "BASSE" && <Badge variant="outline">Basse</Badge>}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    <p>{a.libelle}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.compte}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatAmount(a.montant)} FCFA</TableCell>
                  <TableCell>
                    {a.statut === "OUVERT" && <Badge variant="destructive">Ouvert</Badge>}
                    {a.statut === "EN_COURS" && <Badge variant="warning">En cours</Badge>}
                    {a.statut === "RESOLU" && <Badge variant="success">Résolu</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.statut !== "RESOLU" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary"
                        onClick={() => resolveAnomaly(a.id)}
                      >
                        Marquer résolu
                      </Button>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
