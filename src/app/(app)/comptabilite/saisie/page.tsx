"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import { api, ApiException } from "@/lib/api-client";
import { formatAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Schéma miroir du serveur (EntryInputSchema)
// ---------------------------------------------------------------------------

const LineSchema = z.object({
  accountCode: z
    .string()
    .regex(/^\d{3,8}$/, "Code compte SYSCOHADA (3-8 chiffres)"),
  libelle:     z.string().min(1, "Libellé requis"),
  debit:       z.coerce.number().int().nonnegative("Entier ≥ 0"),
  credit:      z.coerce.number().int().nonnegative("Entier ≥ 0"),
});

const EntryFormSchema = z.object({
  journal: z.enum(["ACHATS", "VENTES", "BANQUE", "CAISSE", "OD", "PAIE"]),
  date:    z.string().min(1, "Date requise"),
  piece:   z.string().min(1, "N° de pièce requis"),
  lines:   z.array(LineSchema).min(2, "Minimum 2 lignes"),
});

type EntryFormValues = z.infer<typeof EntryFormSchema>;

const JOURNALS = [
  { value: "ACHATS",  label: "Achats" },
  { value: "VENTES",  label: "Ventes" },
  { value: "BANQUE",  label: "Banque" },
  { value: "CAISSE",  label: "Caisse" },
  { value: "OD",      label: "Opérations diverses" },
  { value: "PAIE",    label: "Paie" },
] as const;

// ---------------------------------------------------------------------------
// Composant de contrôle d'équilibre (Σ débit = Σ crédit)
// ---------------------------------------------------------------------------

function BalanceControl({ lines }: { lines: EntryFormValues["lines"] }) {
  const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced    = totalDebit > 0 && totalDebit === totalCredit;
  const diff        = Math.abs(totalDebit - totalCredit);

  return (
    <div className={cn(
      "flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium",
      balanced ? "bg-green-50 text-green-800" : "bg-yellow-50 text-yellow-800"
    )}>
      <div className="flex items-center gap-2">
        {balanced
          ? <CheckCircle2 className="h-4 w-4" />
          : <AlertCircle  className="h-4 w-4" />}
        <span>
          {balanced
            ? "Écriture équilibrée ✓"
            : `Écart : ${formatAmount(diff)} FCFA`}
        </span>
      </div>
      <div className="flex gap-4 tabular-nums font-mono text-xs">
        <span>Débit : {formatAmount(totalDebit)}</span>
        <span>Crédit : {formatAmount(totalCredit)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------

export default function SaisiePage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register, control, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(EntryFormSchema),
    defaultValues: {
      journal: "ACHATS",
      date:    new Date().toISOString().slice(0, 10),
      piece:   "",
      lines:   [
        { accountCode: "", libelle: "", debit: 0, credit: 0 },
        { accountCode: "", libelle: "", debit: 0, credit: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");

  async function onSubmit(data: EntryFormValues) {
    try {
      await api.post(
        "/accounting/ecritures",
        data,
        { queueOffline: true, idempotencyKey: `entry-${data.piece}-${Date.now()}` }
      );
      toast.success("Écriture enregistrée");
      setSubmitted(true);
      reset();
      setSubmitted(false);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 409) toast.error("Pièce en doublon — vérifiez le numéro");
        else if (err.status === 423) toast.error("Exercice verrouillé — saisie impossible");
        else toast.error((err as ApiException).code);
      } else {
        toast.info("Écriture mise en file (hors ligne) — sera synchronisée au retour du réseau");
      }
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Saisie comptable</h2>
        <p className="text-sm text-muted-foreground">
          Toutes les écritures doivent être équilibrées (Σ débit = Σ crédit)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouvelle écriture</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* En-tête écriture */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Journal</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register("journal")}
                >
                  {JOURNALS.map((j) => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" {...register("date")} />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">N° de pièce</label>
                <Input placeholder="FAC-2025-001" {...register("piece")} />
                {errors.piece && <p className="text-xs text-destructive">{errors.piece.message}</p>}
              </div>
            </div>

            {/* Lignes d'écriture */}
            <div className="space-y-2">
              <div className="grid grid-cols-[120px_1fr_130px_130px_36px] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                <span>Compte</span>
                <span>Libellé</span>
                <span className="text-right">Débit (FCFA)</span>
                <span className="text-right">Crédit (FCFA)</span>
                <span />
              </div>

              {fields.map((field, i) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[120px_1fr_130px_130px_36px] gap-2 items-start"
                >
                  <div>
                    <Input
                      placeholder="411000"
                      className="font-mono text-sm"
                      {...register(`lines.${i}.accountCode`)}
                    />
                    {errors.lines?.[i]?.accountCode && (
                      <p className="text-xs text-destructive mt-0.5">
                        {errors.lines[i]?.accountCode?.message}
                      </p>
                    )}
                  </div>

                  <Input
                    placeholder="Libellé de l'opération"
                    {...register(`lines.${i}.libelle`)}
                  />

                  <div>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      className="text-right tabular-nums font-mono"
                      {...register(`lines.${i}.debit`)}
                    />
                  </div>

                  <div>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      className="text-right tabular-nums font-mono"
                      {...register(`lines.${i}.credit`)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => fields.length > 2 && remove(i)}
                    disabled={fields.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => append({ accountCode: "", libelle: "", debit: 0, credit: 0 })}
              >
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>

            {/* Contrôle d'équilibre */}
            <BalanceControl lines={lines} />

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[160px]"
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
                  : "Enregistrer l'écriture"}
              </Button>
              <Button type="button" variant="outline" onClick={() => reset()}>
                Réinitialiser
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
