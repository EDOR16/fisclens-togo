"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

const RegisterSchema = z
  .object({
    companyName: z.string().min(2, "Nom de l'entreprise ou du cabinet requis"),
    email: z.string().email("Email invalide"),
    password: z.string().min(10, "10 caractères minimum requis"),
    confirmPassword: z.string(),
    regime: z.enum(["REEL_NORMAL", "RSI", "TPU"], {
      errorMap: () => ({ message: "Veuillez sélectionner un régime fiscal" }),
    }),
    role: z.enum(["GERANT", "COMPTABLE", "CABINET"]).default("GERANT"),
    nif: z.string().optional(),
    cgu: z.literal(true, {
      errorMap: () => ({ message: "Vous devez accepter les Conditions Générales d'Utilisation" }),
    }),
    confidentialite: z.literal(true, {
      errorMap: () => ({
        message: "Vous devez accepter la politique de confidentialité (Loi n°2018-26 Togo)",
      }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof RegisterSchema>;
type RegisterResponse = { token: string; tenantId: string; require2fa?: boolean };

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      regime: "REEL_NORMAL",
      role: "GERANT",
      cgu: true,
      confidentialite: true,
    },
  });

  async function onSubmit(data: RegisterInput) {
    try {
      const res = await api.post<RegisterResponse>("/auth/register", data);
      await login(res.token, res.tenantId);

      toast.success("Espace professionnel créé ! Bienvenue sur FiscLens Togo.");

      if (res.require2fa) {
        toast.info("Enrôlement 2FA obligatoire requis pour ce profil (Cabinet / Admin).");
        router.push("/parametres/securite");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        toast.error("Un compte existe déjà avec cet email.");
      } else if (err instanceof ApiException && err.status === 422) {
        toast.error("Vérifiez les informations saisies et les consentements.");
      } else {
        toast.error("Erreur lors de la création de votre espace de travail.");
      }
    }
  }

  return (
    <Card className="shadow-2xl border-border bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wide">
          <ShieldCheck className="h-4 w-4" /> Environnement Professionnel Réel
        </div>
        <CardTitle className="text-xl font-extrabold">Ouvrir un Espace de Travail</CardTitle>
        <CardDescription className="text-xs">
          Votre espace sera créé vierge, structuré et immédiatement prêt à l&apos;emploi (Plan SYSCOHADA révisé, 6 journaux et calendrier fiscal OTR).
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="companyName" className="font-semibold text-foreground">
              Nom de l&apos;entreprise ou du cabinet *
            </label>
            <Input id="companyName" placeholder="Ex: TOGO LOGISTICS SARL" {...register("companyName")} />
            {errors.companyName && <p className="text-destructive font-medium">{errors.companyName.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="email" className="font-semibold text-foreground">
                Email professionnel *
              </label>
              <Input id="email" type="email" placeholder="contact@entreprise.tg" {...register("email")} />
              {errors.email && <p className="text-destructive font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nif" className="font-semibold text-foreground">
                NIF OTR (Optionnel)
              </label>
              <Input id="nif" placeholder="100XXXXXXXXX" {...register("nif")} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="regime" className="font-semibold text-foreground">
                Régime fiscal Togo *
              </label>
              <select
                id="regime"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("regime")}
              >
                <option value="REEL_NORMAL">Réel Normal (TVA 18% + IS 27%)</option>
                <option value="RSI">Régime Simplifié d&apos;Imposition (RSI)</option>
                <option value="TPU">Taxe Professionnelle Unique (TPU)</option>
              </select>
              {errors.regime && <p className="text-destructive font-medium">{errors.regime.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role" className="font-semibold text-foreground">
                Profil utilisateur *
              </label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("role")}
              >
                <option value="GERANT">Gérant / Chef d&apos;Entreprise</option>
                <option value="COMPTABLE">Comptable d&apos;Entreprise</option>
                <option value="CABINET">Expert-Comptable / Cabinet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="password" className="font-semibold text-foreground">
                Mot de passe (10+ car.) *
              </label>
              <Input id="password" type="password" placeholder="••••••••••••" {...register("password")} />
              {errors.password && <p className="text-destructive font-medium">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="font-semibold text-foreground">
                Confirmer le mot de passe *
              </label>
              <Input id="confirmPassword" type="password" placeholder="••••••••••••" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-destructive font-medium">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {/* Consentements actifs Loi 2018-26 Togo */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="flex items-start gap-2 cursor-pointer text-[11px] text-muted-foreground leading-tight">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-input text-brand-600 focus:ring-brand-500"
                {...register("cgu")}
              />
              <span>
                J&apos;accepte les <strong className="text-foreground">Conditions Générales d&apos;Utilisation</strong> du service FiscLens Togo.
              </span>
            </label>
            {errors.cgu && <p className="text-destructive font-medium text-[11px]">{errors.cgu.message}</p>}

            <label className="flex items-start gap-2 cursor-pointer text-[11px] text-muted-foreground leading-tight">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-input text-brand-600 focus:ring-brand-500"
                {...register("confidentialite")}
              />
              <span>
                J&apos;accepte la politique de traitement et de protection des données financières (conformément à la <strong className="text-foreground">Loi togolaise n°2018-26</strong>).
              </span>
            </label>
            {errors.confidentialite && <p className="text-destructive font-medium text-[11px]">{errors.confidentialite.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Initialisation de l&apos;espace...
              </>
            ) : (
              "Créer mon Espace Réel et Commencer"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-brand-600 dark:text-brand-400 hover:underline font-semibold">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
