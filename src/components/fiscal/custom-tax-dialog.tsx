"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlusCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const MODELES_TAXES_TOGO = [
  { label: "Personnalisé (libre)", nom: "", freq: "MENSUELLE", ref: "Réglementation spécifique" },
  { label: "Taxe sur les Véhicules à Moteur (TVM)", nom: "Taxe sur les Véhicules à Moteur (TVM)", freq: "ANNUELLE", ref: "CGI art. 162" },
  { label: "Taxe sur les Entreprises de Télécoms (TETTIC)", nom: "Taxe Télécoms (TETTIC 5%)", freq: "MENSUELLE", ref: "CGI art. 171 bis" },
  { label: "Taxe à l'Émission des Billets d'Avion (TEBA)", nom: "Taxe Billets d'Avion (TEBA 2000 F)", freq: "MENSUELLE", ref: "CGI art. 235" },
  { label: "Produits des Jeux de Hasard", nom: "Taxe sur les Jeux de Hasard (7%)", freq: "MENSUELLE", ref: "CGI art. 230" },
  { label: "Droits d'Accises Spécifiques", nom: "Droits d'Accises Spécifiques", freq: "MENSUELLE", ref: "CGI art. 241-243" },
  { label: "Redevance de Régulation des Marchés Publics (ARCOP)", nom: "Redevance de Régulation ARCOP", freq: "PAR_MARCHE", ref: "Code des Marchés Publics" },
  { label: "Taxe d'Abattage / Sanitaire Animaux", nom: "Taxe Sanitaire & d'Abattage", freq: "MENSUELLE", ref: "Réglementation Municipale" },
  { label: "Taxe sur les Spectacles & Manifestations", nom: "Taxe sur les Spectacles Publics", freq: "OCCASIONNELLE", ref: "Code des Collectivités" },
];

export function CustomTaxDialog({ tenantId: propTenantId, onAdded }: { tenantId?: string; onAdded?: () => void }) {
  const { currentTenantId } = useAuth();
  const tenantId = propTenantId || currentTenantId || "";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modeleChoisi, setModeleChoisi] = useState("0");
  const [formData, setFormData] = useState({
    nom: "",
    periode: "MENSUELLE",
    echeance: "",
    montant: "",
    legalRef: "CGI Togo",
  });

  function handleModeleChange(indexStr: string) {
    setModeleChoisi(indexStr);
    const index = Number(indexStr);
    const mod = MODELES_TAXES_TOGO[index];
    if (mod && index > 0) {
      setFormData((prev) => ({
        ...prev,
        nom: mod.nom,
        periode: mod.freq,
        legalRef: mod.ref,
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      toast.error("Veuillez sélectionner un dossier d'entreprise actif.");
      return;
    }

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
          legalRef: formData.legalRef || "Ajout manuel entreprise",
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'ajout de la taxe");
      }

      toast.success("Taxe ou impôt personnalisé ajouté avec succès !");
      setOpen(false);
      setFormData({
        nom: "",
        periode: "MENSUELLE",
        echeance: "",
        montant: "",
        legalRef: "CGI Togo",
      });
      if (onAdded) onAdded();
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
        <Button variant="default" size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
          <PlusCircle className="h-4 w-4" />
          Ajouter un impôt personnalisé
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="h-4 w-4 text-emerald-600" /> Nouvel Impôt ou Taxe Personnalisé
          </DialogTitle>
          <DialogDescription className="text-xs">
            Ajoutez une taxe sectorielle ou obligation fiscale propre à l&apos;activité de votre entreprise.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          {/* Modèles suggérés */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Modèle prédéfini (Optionnel)</Label>
            <select
              value={modeleChoisi}
              onChange={(e) => handleModeleChange(e.target.value)}
              className="w-full p-2 rounded-md border text-xs bg-background"
            >
              {MODELES_TAXES_TOGO.map((m, idx) => (
                <option key={idx} value={String(idx)}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="nom" className="text-xs font-semibold">Intitulé de l&apos;impôt ou taxe</Label>
            <Input
              id="nom"
              placeholder="Ex: Taxe de Voirie, Droits de concession..."
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="periode" className="text-xs font-semibold">Fréquence / Période</Label>
              <select
                id="periode"
                value={formData.periode}
                onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                className="w-full p-2 rounded-md border text-xs bg-background"
              >
                <option value="MENSUELLE">Mensuelle (15 du mois)</option>
                <option value="TRIMESTRIELLE">Trimestrielle</option>
                <option value="ANNUELLE">Annuelle</option>
                <option value="PAR_MARCHE">Par Marché / Événement</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="echeance" className="text-xs font-semibold">Prochaine Échéance</Label>
              <Input
                id="echeance"
                type="date"
                value={formData.echeance}
                onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                className="text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="montant" className="text-xs font-semibold">Montant estimé (FCFA)</Label>
              <Input
                id="montant"
                type="number"
                placeholder="0"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="legalRef" className="text-xs font-semibold">Référence légale (Optionnel)</Label>
              <Input
                id="legalRef"
                placeholder="Ex: CGI art. 162..."
                value={formData.legalRef}
                onChange={(e) => setFormData({ ...formData, legalRef: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading} className="text-xs">
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
              {loading ? "Enregistrement..." : "Enregistrer la taxe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
