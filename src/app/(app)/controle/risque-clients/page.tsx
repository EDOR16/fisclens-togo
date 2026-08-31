"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserX, TrendingUp, AlertTriangle, ShieldCheck, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ClientRisk = {
  id: string;
  code: string;
  nom: string;
  compte: string;
  zone: string;
  encoursTotal: number;
  encoursAutorise: number;
  retardMoyenJours: number;
  score: "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";
  derniereFacture: string;
};

type RisqueClientsData = {
  encoursTotal: number;
  encoursEchu: number;
  dsoMoyen: number;
  clients: ClientRisk[];
};

export default function RisqueClientsPage() {
  const [data, setData] = useState<RisqueClientsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/controle/risque-clients");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error("Impossible de charger les données de risque client");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
            Scoring automatisé des créances clients, délais moyens de paiement (DSO) et encours SYSCOHADA
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-blue-900">Total Encours Clients (411)</CardDescription>
            <CardTitle className="text-xl font-mono text-blue-950">
              {formatAmount(data?.encoursTotal || 0)} FCFA
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-red-900">Encours Échu / En retard</CardDescription>
            <CardTitle className="text-xl font-mono text-red-600">
              {formatAmount(data?.encoursEchu || 0)} FCFA
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Délai Moyen de Paiement (DSO)</CardDescription>
            <CardTitle className="text-xl font-mono">{data?.dsoMoyen || 0} jours</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portefeuille Clients &amp; Niveau d&apos;exposition</CardTitle>
          <CardDescription>Suivi individuel des créances et limites de crédit autorisées</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              Calcul des encours clients en cours...
            </div>
          ) : !data || data.clients.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 m-6 p-6 text-center">
              <ShieldCheck className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-sm">Encours global 411 : {formatAmount(data?.encoursTotal || 0)} FCFA</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Importez ou référencez vos clients dans le module BI pour activer le suivi individuel et les lettres de relance.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Encours (FCFA)</TableHead>
                  <TableHead className="text-right">Plafond</TableHead>
                  <TableHead>Niveau de risque</TableHead>
                  <TableHead className="w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-xs">{c.nom}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.compte}</TableCell>
                    <TableCell className="text-xs">{c.zone}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">{formatAmount(c.encoursTotal)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatAmount(c.encoursAutorise)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.score === "CRITIQUE" ? "destructive" : "outline"}
                        className={cn(
                          "text-[10px]",
                          c.score === "ELEVE" && "border-amber-400 bg-amber-50 text-amber-800",
                          c.score === "FAIBLE" && "border-emerald-400 bg-emerald-50 text-emerald-800"
                        )}
                      >
                        {c.score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => sendRelance(c)}>
                        <Mail className="h-3 w-3" /> Relancer
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
