"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Search, Plus, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

type AccountItem = {
  code: string;
  libelle: string;
  classe: number;
  type?: "ACTIF" | "PASSIF" | "CHARGE" | "PRODUIT" | "SPECIAL";
  postable: boolean;
  archived: boolean;
};

export default function PlanComptesPage() {
  const [selectedClasse, setSelectedClasse] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [showSubAccountForm, setShowSubAccountForm] = useState(false);
  const [parentCode, setParentCode] = useState("");
  const [subAccountCode, setSubAccountCode] = useState("");
  const [subAccountLabel, setSubAccountLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<{ comptes: AccountItem[] }>("/accounting/comptes")
      .then(({ comptes }) => setAccounts(comptes))
      .catch(() => toast.error("Impossible de charger le plan comptable"));
  }, []);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = localStorage.getItem("fl_token");
      const tenantId = localStorage.getItem("fl_tenant_id");
      const response = await fetch("/api/v1/accounting/comptes/import", { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(tenantId ? { "x-tenant-id": tenantId } : {}) }, body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Import refusé");
      toast.success(`${result.imported} compte(s) de référence importé(s). Ils seront attribués aux nouveaux dossiers.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import impossible");
    } finally {
      event.target.value = "";
    }
  };

  const handleCreateSubAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { compte } = await api.post<{ compte: AccountItem }>("/accounting/comptes/subaccount", { parentCode, code: subAccountCode, libelle: subAccountLabel });
      setAccounts((current) => [...current, compte].sort((a, b) => a.code.localeCompare(b.code)));
      setParentCode("");
      setSubAccountCode("");
      setSubAccountLabel("");
      setShowSubAccountForm(false);
      toast.success("Sous-compte créé.");
    } catch (error) {
      toast.error(error instanceof Error ? "Création du sous-compte refusée." : "Création du sous-compte impossible.");
    }
  };

  const handleViewGrandLivre = (code: string) => {
    toast.info(`Affichage du grand livre pour le compte ${code}`);
  };

  const filtered = accounts.filter((acc) => {
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
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Importer
          </Button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
          <Button size="sm" onClick={() => setShowSubAccountForm((visible) => !visible)}>
            <Plus className="h-4 w-4 mr-1" /> Créer un sous-compte
          </Button>
        </div>
      </div>

      {showSubAccountForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Créer un sous-compte personnalisé</CardTitle><CardDescription>Le code doit commencer par le compte parent et ne peut pas modifier une racine SYSCOHADA.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubAccount} className="grid gap-3 sm:grid-cols-4 sm:items-end">
              <label className="space-y-1 text-sm font-medium"><span>Compte parent</span><Input value={parentCode} onChange={(event) => setParentCode(event.target.value.replace(/\D/g, ""))} placeholder="Ex. 411" required /></label>
              <label className="space-y-1 text-sm font-medium"><span>Code du sous-compte</span><Input value={subAccountCode} onChange={(event) => setSubAccountCode(event.target.value.replace(/\D/g, ""))} placeholder="Ex. 411001" required /></label>
              <label className="space-y-1 text-sm font-medium sm:col-span-1"><span>Intitulé</span><Input value={subAccountLabel} onChange={(event) => setSubAccountLabel(event.target.value)} placeholder="Client X" required /></label>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>
      )}

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
                <TableHead>Statut</TableHead>
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
                    {!acc.type && <Badge variant="outline">SYSCOHADA</Badge>}
                  </TableCell>
                  <TableCell>
                    {acc.archived ? <Badge variant="outline">Archivé</Badge> : acc.postable ? <Badge variant="success">Saisissable</Badge> : <Badge variant="warning">Racine</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleViewGrandLivre(acc.code)}>
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
