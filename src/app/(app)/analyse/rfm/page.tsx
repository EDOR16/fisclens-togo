"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, RefreshCw, TrendingUp, AlertTriangle, Crown, UserX } from "lucide-react";
import { formatFcfaSmart } from "@/lib/format-money";
import { cn } from "@/lib/utils";

type RFMSegment = {
  clientCode: string;
  clientName: string;
  recency: number;
  frequency: number;
  monetary: number;
  rfmScore: string;
};

export default function RfmPage() {
  const [data, setData] = useState<RFMSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("fl_token");
        const tenantId = localStorage.getItem("fl_tenant_id");
        if (!token || !tenantId) {
          setError("Session expirée ou dossier non sélectionné. Reconnectez-vous.");
          return;
        }
        const res = await fetch("/api/v1/bi/dashboard/clients", {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-tenant-id": tenantId,
          },
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json?.error || `Erreur ${res.status}`);
          return;
        }
        const json = await res.json();
        setData(json.data?.rfmSegmentation || []);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les données clients.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getBadge = (score: string) => {
    switch (score) {
      case "VIP": return <Badge className="bg-emerald-600 text-white"><Crown className="h-3 w-3 mr-1" /> VIP</Badge>;
      case "High Value": return <Badge className="bg-blue-600 text-white"><TrendingUp className="h-3 w-3 mr-1" /> High Value</Badge>;
      case "At Risk": return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> À Risque</Badge>;
      default: return <Badge variant="outline">{score}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Segmentation RFM Clients
          </h2>
          <p className="text-sm text-muted-foreground">Récence, Fréquence et Montant d'achat — Données réelles</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Clients par Score RFM</CardTitle>
          <CardDescription>Classification automatique basée sur l'historique réel des ventes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-sm">{error}</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Aucune donnée client disponible</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Récence (jours)</TableHead>
                  <TableHead className="text-right">Fréquence</TableHead>
                  <TableHead className="text-right">CA Total</TableHead>
                  <TableHead>Segment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow key={c.clientCode}>
                    <TableCell className="font-medium">{c.clientName}</TableCell>
                    <TableCell className="text-right font-mono">{c.recency} j</TableCell>
                    <TableCell className="text-right font-mono">{c.frequency}</TableCell>
                    <TableCell className="text-right font-mono">{formatFcfaSmart(c.monetary)}</TableCell>
                    <TableCell>{getBadge(c.rfmScore)}</TableCell>
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