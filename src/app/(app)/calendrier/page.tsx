"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Info } from "lucide-react";

export default function CalendrierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" /> Calendrier Fiscal & Échéancier
        </h2>
        <p className="text-sm text-muted-foreground">
          Aucune obligation fiscale enregistrée pour le moment.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Calendrier Vierge</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <Info className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-semibold text-sm">Calendrier fiscal à initialiser</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Lors de la création de votre espace de travail, le calendrier fiscal officiel Togo (TVA 15, Patente 31/03, Liasse 30/04, etc.) selon votre régime fiscal sera automatiquement généré.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
