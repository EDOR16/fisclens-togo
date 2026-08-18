import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export const metadata: Metadata = { title: "Analyse" };

export default function AnalysePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analyse & Indicateurs</h2>
        <p className="text-sm text-muted-foreground">Aucune donnée d'analyse disponible pour l'instant.</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
          <Info className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-semibold text-sm">Espace d'analyse vierge</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les indicateurs KPI (CA, marge, clients, trésorerie) apparaîtront automatiquement après vos premières écritures comptables et imports Excel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
