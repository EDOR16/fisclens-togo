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

const DECLARATIONS: Declaration[] = [
  { id: "1", nom: "Déclaration Mensuelle TVA (CA3)", periode: "Août 2025", echeance: "15 Septembre 2025", type: "TVA", statut: "A_PRODUIRE" },
  { id: "2", nom: "Déclaration Retenues à la Source IRPP / Salaire", periode: "Août 2025", echeance: "15 Septembre 2025", type: "IRPP", statut: "A_PRODUIRE" },
  { id: "3", nom: "2ème Acompte Provisionnel IS", periode: "Exercice 2025", echeance: "30 Septembre 2025", type: "IS", statut: "A_PRODUIRE" },
  { id: "4", nom: "Déclaration Mensuelle TVA (CA3)", periode: "Juillet 2025", echeance: "15 Août 2025", type: "TVA", statut: "PRODUIT" },
  { id: "5", nom: "1er Acompte Provisionnel IS", periode: "Exercice 2025", echeance: "30 Juin 2025", type: "IS", statut: "PRODUIT" },
  { id: "6", nom: "Liasse Fiscale & États Financiers Annuels", periode: "Exercice 2024", echeance: "30 Avril 2025", type: "BILAN", statut: "PRODUIT" },
];

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
          <CardDescription>Format PDF officiel et fichier structuré pour le portail téléprocédures OTR</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Déclaration</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Date d&apos;échéance légale</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DECLARATIONS.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {d.nom}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{d.periode}</TableCell>
                  <TableCell className="text-sm">{d.echeance}</TableCell>
                  <TableCell>
                    {d.statut === "PRODUIT" && <Badge variant="success">Transmis OTR</Badge>}
                    {d.statut === "A_PRODUIRE" && <Badge variant="warning">À télétransmettre</Badge>}
                    {d.statut === "EN_RETARD" && <Badge variant="destructive">Échéance dépassée</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => downloadExport(d)}
                      >
                        <Download className="h-3 w-3 mr-1" /> PDF OTR
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={() => downloadExport(d)}
                      >
                        Données JSON/EDI
                      </Button>
                    </div>
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
