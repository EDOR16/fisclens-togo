"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "bilan" | "compte-resultat" | "tafire" | "annexe";

export default function EtatsFinanciersPage() {
  const [activeTab, setActiveTab] = useState<TabType>("bilan");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> États Financiers SYSCOHADA (Système Normal)
          </h2>
          <p className="text-sm text-muted-foreground">
            Aucun montant fictif : ces états se généreront automatiquement à partir de vos écritures réelles.
          </p>
        </div>
      </div>

      <div className="flex border-b space-x-4">
        <button
          onClick={() => setActiveTab("bilan")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "bilan"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Bilan (Actif / Passif)
        </button>
        <button
          onClick={() => setActiveTab("compte-resultat")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "compte-resultat"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Compte de Résultat
        </button>
        <button
          onClick={() => setActiveTab("tafire")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "tafire"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          TAFIRE (Flux de trésorerie)
        </button>
        <button
          onClick={() => setActiveTab("annexe")}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "annexe"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Notes Annexes
        </button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-hand text-3xl">Vos états financiers sont vides pour le moment.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Dès qu’une écriture réelle sera enregistrée, les bilans et comptes de résultats seront calculés automatiquement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
