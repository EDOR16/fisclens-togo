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

const CLIENTS_RISK: ClientRisk[] = [];

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

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Total Encours Clients (411)</CardDescription>
            <CardTitle className="text-xl font-mono text-primary">0 FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-red-900">Encours Échu (+60 jours)</CardDescription>
            <CardTitle className="text-xl font-mono text-red-600">0 FCFA</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Délai Moyen de Paiement (DSO)</CardDescription>
            <CardTitle className="text-xl font-mono">0 jour</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portefeuille Clients & Niveau d&apos;exposition</CardTitle>
          <CardDescription>Les données client apparaîtront dès qu’un portefeuille réel sera importé.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-hand text-3xl">Aucun client en risque pour le moment.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Les encours, retards et scores seront calculés automatiquement à partir des factures et paiements réels.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
