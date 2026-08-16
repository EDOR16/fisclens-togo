"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserX, TrendingUp, AlertTriangle, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";

type ClientRisk = {
  id: string;
  nom: string;
  compte: string;
  encoursTotal: number;
  retardMoyenJours: number;
  score: "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";
  derniereFacture: string;
};

const CLIENTS_RISK: ClientRisk[] = [
  { id: "1", nom: "ETS KPONTON & FILS", compte: "411002", encoursTotal: 4_250_000, retardMoyenJours: 78, score: "CRITIQUE", derniereFacture: "15/05/2025" },
  { id: "2", nom: "SOCIETE KEKELI SARL", compte: "411005", encoursTotal: 2_800_000, retardMoyenJours: 42, score: "ELEVE", derniereFacture: "02/06/2025" },
  { id: "3", nom: "SOGET DISTRIB TOGO", compte: "411001", encoursTotal: 1_250_000, retardMoyenJours: 14, score: "MOYEN", derniereFacture: "01/08/2025" },
  { id: "4", nom: "TOGO-TRANS LOGISTICS", compte: "411003", encoursTotal: 850_000, retardMoyenJours: 3, score: "FAIBLE", derniereFacture: "11/08/2025" },
  { id: "5", nom: "AGENCE COMMERCIALE GBEGNEDZI", compte: "411004", encoursTotal: 450_000, retardMoyenJours: 0, score: "FAIBLE", derniereFacture: "14/08/2025" },
];

export default function RisqueClientsPage() {
  function sendRelance(client: ClientRisk) {
    toast.success(`Lettre de relance générée pour ${client.nom}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserX className="h-5 w-5 text-primary" /> Analyse du Risque Clients & Retards d&apos;Encours (411)
          </h2>
          <p className="text-sm text-muted-foreground">
            Scoring automatisé des créances clients, délais moyens de paiement et alertes de dépréciation (provisions)
          </p>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Total Encours Clients (411)</CardDescription>
            <CardTitle className="text-xl font-mono text-primary">{formatAmount(9_600_000)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-red-900">Encours Échu (+60 jours)</CardDescription>
            <CardTitle className="text-xl font-mono text-red-600">{formatAmount(4_250_000)} FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Délai Moyen de Paiement (DSO)</CardDescription>
            <CardTitle className="text-xl font-mono">38 jours</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portefeuille Clients & Niveau d&apos;exposition</CardTitle>
          <CardDescription>Trié par niveau de risque décroissant</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Encours Total (FCFA)</TableHead>
                <TableHead className="text-right">Retard Moyen</TableHead>
                <TableHead>Dernière Facture</TableHead>
                <TableHead>Score de Risque</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CLIENTS_RISK.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.compte}</TableCell>
                  <TableCell className="font-medium text-sm">{c.nom}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatAmount(c.encoursTotal)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.retardMoyenJours} j</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.derniereFacture}</TableCell>
                  <TableCell>
                    {c.score === "CRITIQUE" && <Badge variant="destructive">Critique (+60j)</Badge>}
                    {c.score === "ELEVE" && <Badge variant="destructive" className="bg-orange-600">Élevé (+30j)</Badge>}
                    {c.score === "MOYEN" && <Badge variant="warning">Moyen</Badge>}
                    {c.score === "FAIBLE" && <Badge variant="success">Faible</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => sendRelance(c)}
                    >
                      <Mail className="h-3 w-3 mr-1" /> Relancer
                    </Button>
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
