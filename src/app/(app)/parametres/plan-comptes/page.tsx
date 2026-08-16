"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Search, Plus, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountItem = {
  code: string;
  libelle: string;
  classe: number;
  type: "ACTIF" | "PASSIF" | "CHARGE" | "PRODUIT" | "SPECIAL";
};

const PLAN_SYSCOHADA: AccountItem[] = [
  { code: "101000", libelle: "Capital social", classe: 1, type: "PASSIF" },
  { code: "162000", libelle: "Emprunts auprès des établissements de crédit", classe: 1, type: "PASSIF" },
  { code: "211000", libelle: "Frais de développement", classe: 2, type: "ACTIF" },
  { code: "241000", libelle: "Matériel industriel et outillage", classe: 2, type: "ACTIF" },
  { code: "245000", libelle: "Matériel de transport", classe: 2, type: "ACTIF" },
  { code: "311000", libelle: "Marchandises A", classe: 3, type: "ACTIF" },
  { code: "401100", libelle: "Fournisseurs d'exploitation locaux", classe: 4, type: "PASSIF" },
  { code: "411100", libelle: "Clients ordinaires Togo", classe: 4, type: "ACTIF" },
  { code: "445200", libelle: "TVA collectée sur ventes (18%)", classe: 4, type: "PASSIF" },
  { code: "445400", libelle: "TVA récupérable sur achats (18%)", classe: 4, type: "ACTIF" },
  { code: "521000", libelle: "Banques locales (Ecobank / Orabank)", classe: 5, type: "ACTIF" },
  { code: "571000", libelle: "Caisse principale Lomé", classe: 5, type: "ACTIF" },
  { code: "601100", libelle: "Achats de marchandises au Togo", classe: 6, type: "CHARGE" },
  { code: "661000", libelle: "Rémunérations directes versées au personnel", classe: 6, type: "CHARGE" },
  { code: "664000", libelle: "Charges sociales patronales CNSS", classe: 6, type: "CHARGE" },
  { code: "701100", libelle: "Ventes de marchandises au Togo", classe: 7, type: "PRODUIT" },
];

export default function PlanComptesPage() {
  const [selectedClasse, setSelectedClasse] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = PLAN_SYSCOHADA.filter((acc) => {
    const matchClasse = selectedClasse === null || acc.classe === selectedClasse;
    const matchSearch =
      acc.code.includes(search) || acc.libelle.toLowerCase().includes(search.toLowerCase());
    return matchClasse && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Plan Comptable SYSCOHADA Révisé
          </h2>
          <p className="text-sm text-muted-foreground">
            Nomenclature des comptes (Classes 1 à 8) et sous-comptes personnalisés du dossier
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" /> Importer
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Créer un sous-compte
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres de classes */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par numéro de compte ou intitulé (ex: 411, TVA, Salaires)..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2">
            <button
              onClick={() => setSelectedClasse(null)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                selectedClasse === null ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              Toutes les classes
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((cl) => (
              <button
                key={cl}
                onClick={() => setSelectedClasse(cl)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  selectedClasse === cl ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
              >
                Classe {cl}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{filtered.length} compte(s) affiché(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro de Compte</TableHead>
                <TableHead>Intitulé du compte</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Nature</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((acc) => (
                <TableRow key={acc.code}>
                  <TableCell className="font-mono text-sm font-semibold text-primary">{acc.code}</TableCell>
                  <TableCell className="text-sm font-medium">{acc.libelle}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Classe {acc.classe}</TableCell>
                  <TableCell>
                    {acc.type === "ACTIF" && <Badge variant="outline" className="text-blue-700 bg-blue-50">Actif</Badge>}
                    {acc.type === "PASSIF" && <Badge variant="outline" className="text-purple-700 bg-purple-50">Passif</Badge>}
                    {acc.type === "CHARGE" && <Badge variant="outline" className="text-red-700 bg-red-50">Charge</Badge>}
                    {acc.type === "PRODUIT" && <Badge variant="outline" className="text-green-700 bg-green-50">Produit</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-xs">
                      Grand Livre
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
