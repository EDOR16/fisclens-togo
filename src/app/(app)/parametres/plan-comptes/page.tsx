"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Search, Plus, Upload, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

type AccountItem = {
  id: string;
  code: string;
  libelle: string;
  classe: number;
  postable: boolean;
  isRoot: boolean;
};

const CLASSES_SYSCOHADA = [
  { num: 1, label: "Capitaux" },
  { num: 2, label: "Actif Immobilisé" },
  { num: 3, label: "Stocks" },
  { num: 4, label: "Tiers" },
  { num: 5, label: "Trésorerie" },
  { num: 6, label: "Charges" },
  { num: 7, label: "Produits" },
  { num: 8, label: "Hors Activités Ordinaires" },
];

export default function PlanComptesPage() {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClasse, setSelectedClasse] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ comptes: AccountItem[] }>("/accounting/comptes");
      setAccounts(res.comptes || []);
    } catch (err: any) {
      toast.error("Impossible de charger le plan comptable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filtered = accounts.filter((acc) => {
    const matchClasse = selectedClasse === null || acc.classe === selectedClasse;
    const matchSearch =
      !search ||
      acc.code.includes(search) ||
      acc.libelle.toLowerCase().includes(search.toLowerCase());
    return matchClasse && matchSearch;
  });

  // Compter les comptes par classe pour les filtres
  const countByClass = (classeNum: number) =>
    accounts.filter((a) => a.classe === classeNum).length;

  const handleImport = () => {
    toast.info("Fonctionnalité d'import CSV disponible prochainement");
  };

  const handleCreateSubAccount = () => {
    toast.info("Fonctionnalité de création de sous-compte disponible prochainement");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Plan Comptable SYSCOHADA Révisé
          </h2>
          <p className="text-sm text-muted-foreground">
            Nomenclature officielle OHADA — {accounts.length} comptes chargés
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-1" /> Importer
          </Button>
          <Button size="sm" onClick={handleCreateSubAccount}>
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
              placeholder="Rechercher par numéro ou intitulé (ex: 411, TVA, Salaires)..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            <button
              onClick={() => setSelectedClasse(null)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                selectedClasse === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent"
              )}
            >
              Toutes ({accounts.length})
            </button>
            {CLASSES_SYSCOHADA.map((cl) => {
              const count = countByClass(cl.num);
              return (
                <button
                  key={cl.num}
                  onClick={() => setSelectedClasse(cl.num)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                    selectedClasse === cl.num
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent"
                  )}
                >
                  Cl.{cl.num} {cl.label} {count > 0 ? `(${count})` : ""}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tableau des comptes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {filtered.length} compte{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Chargement du plan comptable...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Aucun compte ne correspond à votre recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">N° Compte</TableHead>
                    <TableHead>Intitulé du compte</TableHead>
                    <TableHead className="w-20">Classe</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-24 text-right">Postable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((acc) => (
                    <TableRow key={acc.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm font-bold text-primary">
                        {acc.code}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{acc.libelle}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        Classe {acc.classe}
                      </TableCell>
                      <TableCell>
                        {acc.isRoot ? (
                          <Badge variant="outline" className="text-[10px]">Racine</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Détail</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {acc.postable ? (
                          <Badge variant="success" className="text-[10px]">Oui</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">Non</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}