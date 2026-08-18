"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Declaration = {
  id: string;
  nom: string;
  periode: string;
  echeance: string;
  type: string;
  statut: "A_PRODUIRE" | "PRODUIT" | "EN_RETARD";
};

const DECLARATIONS: Declaration[] = [];

export default function DeclarationsPage() {
  function downloadExport(decl: Declaration) {
    toast.success(`Fichier structuré exporté pour ${decl.nom} (${decl.periode})`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Centre des Déclarations Fiscales & Exports OTR
          </h2>
          <p className="text-sm text-muted-foreground">
            Téléchargement des formulaires officiels pré-remplis et fichiers compatibles télédéclaration OTR
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toutes les déclarations réglementaires</CardTitle>
          <CardDescription>Aucune déclaration à traiter dans cet environnement réel pour le moment.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-hand text-3xl">Aucune déclaration fiscale à afficher.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Les formulaires TVA, IRPP, IS et liasse seront générés automatiquement dès qu’un exercice réel sera saisi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
