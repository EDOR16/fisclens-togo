"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

export function CustomTaxDialog({ tenantId, onAdded }: { tenantId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    periode: "",
    echeance: "",
    montant: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/fiscal/declarations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          label: formData.nom,
          key: `CUSTOM-${Date.now()}`,
          freq: formData.periode,
          dueDate: formData.echeance,
          regime: "CUSTOM",
          legalRef: "Ajout manuel",
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'ajout de l'impôt");
      }

      toast.success("Impôt ajouté avec succès");
      setOpen(false);
      onAdded();
    } catch (error) {
      toast.error("Impossible d'ajouter cet impôt");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Ajouter un impôt personnalisé
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel impôt ou taxe</DialogTitle>
          <DialogDescription>
            Ajoutez manuellement une obligation fiscale spécifique à votre activité.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom de l'impôt</Label>
            <Input
              id="nom"
              placeholder="Ex: Taxe sur les véhicules..."
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="periode">Période / Fréquence</Label>
            <Input
              id="periode"
              placeholder="Ex: ANNUELLE, MENSUELLE..."
              value={formData.periode}
              onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="echeance">Date d'échéance</Label>
            <Input
              id="echeance"
              type="date"
              value={formData.echeance}
              onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="montant">Montant estimé (Optionnel)</Label>
            <Input
              id="montant"
              type="number"
              placeholder="0 FCFA"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
