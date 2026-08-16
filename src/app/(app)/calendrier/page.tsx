"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Bell, Download, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

type Obligation = {
  id: string;
  titre: string;
  regime: "TOUS" | "REEL_NORMAL" | "REEL_SIMPLIFIE" | "TPU";
  dateLegale: string;
  echeanceType: "MENSUELLE" | "TRIMESTRIELLE" | "ANNUELLE";
  statut: "URGENT" | "A_VENIR" | "PLANIFIE";
  alertes: string;
};

const OBLIGATIONS: Obligation[] = [
  { id: "1", titre: "Déclaration & Paiement TVA du mois précédent", regime: "REEL_NORMAL", dateLegale: "15 de chaque mois (15 Sept. 2025)", echeanceType: "MENSUELLE", statut: "URGENT", alertes: "J-7 (08/09), J-3 (12/09), J (15/09)" },
  { id: "2", titre: "Versement Retenues IRPP sur Salaires & CNSS", regime: "TOUS", dateLegale: "15 de chaque mois (15 Sept. 2025)", echeanceType: "MENSUELLE", statut: "URGENT", alertes: "J-7 (08/09), J-3 (12/09), J (15/09)" },
  { id: "3", titre: "Paiement du 2ème Acompte Provisionnel IS", regime: "REEL_NORMAL", dateLegale: "30 Septembre 2025", echeanceType: "TRIMESTRIELLE", statut: "A_VENIR", alertes: "J-7 (23/09), J-3 (27/09), J (30/09)" },
  { id: "4", titre: "Paiement 3ème fraction Taxe Professionnelle Unique (TPU)", regime: "TPU", dateLegale: "31 Octobre 2025", echeanceType: "TRIMESTRIELLE", statut: "PLANIFIE", alertes: "J-7 (24/10), J (31/10)" },
  { id: "5", titre: "Déclaration Annuelle des Salaires & Honoraires (DAS)", regime: "TOUS", dateLegale: "31 Mars 2026", echeanceType: "ANNUELLE", statut: "PLANIFIE", alertes: "J-15 (16/03), J-7 (24/03), J (31/03)" },
  { id: "6", titre: "Dépôt de la Liasse Fiscale & États Financiers Annuels (SYSCOHADA)", regime: "TOUS", dateLegale: "30 Avril 2026", echeanceType: "ANNUELLE", statut: "PLANIFIE", alertes: "J-30 (31/03), J-7 (23/04), J (30/04)" },
];

export default function CalendrierPage() {
  function toggleNotif() {
    toast.success("Rappels par email et notifications activés (J-7 / J-3 / J-J)");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Calendrier Fiscal & Échéancier Togo
          </h2>
          <p className="text-sm text-muted-foreground">
            Toutes les dates limites d&apos;obligations fiscales et déclarations OTR par régime (Réel Normal, RSI, TPU)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleNotif}>
            <Bell className="h-4 w-4 mr-1" /> Configurer les rappels
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-1" /> Exporter iCal / Google Calendar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Échéances Réglementaires Applicables</CardTitle>
          <CardDescription>Système de relances automatiques J-7 / J-3 / Jour J activé</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obligation Fiscale</TableHead>
                <TableHead>Régime Concerné</TableHead>
                <TableHead>Périodicité</TableHead>
                <TableHead>Date d&apos;échéance</TableHead>
                <TableHead>Fréquence des alertes</TableHead>
                <TableHead className="text-right">Urgence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {OBLIGATIONS.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {o.titre}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{o.regime}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{o.echeanceType}</TableCell>
                  <TableCell className="text-sm font-semibold">{o.dateLegale}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{o.alertes}</TableCell>
                  <TableCell className="text-right">
                    {o.statut === "URGENT" && <Badge variant="destructive">Urgent (J-7)</Badge>}
                    {o.statut === "A_VENIR" && <Badge variant="warning">À venir</Badge>}
                    {o.statut === "PLANIFIE" && <Badge variant="outline">Planifié</Badge>}
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
