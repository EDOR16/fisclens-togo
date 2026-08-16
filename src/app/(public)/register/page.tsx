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
import { Loader2 } from "lucide-react";

const RegisterSchema = z.object({
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  email:       z.string().email("Email invalide"),
  password:    z.string().min(8, "8 caractères minimum"),
  confirmPassword: z.string(),
  regime: z.enum(["REEL_NORMAL", "REEL_SIMPLIFIE", "TPU"], {
    errorMap: () => ({ message: "Régime fiscal requis" }),
  }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterInput = z.infer<typeof RegisterSchema>;
type RegisterResponse = { token: string; tenantId: string };

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema) });

  async function onSubmit(data: RegisterInput) {
    try {
      const res = await api.post<RegisterResponse>("/auth/register", data);
      await login(res.token, res.tenantId);
      toast.success("Compte créé ! Bienvenue sur FiscLens.");
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiException && err.status === 409) {
        toast.error("Un compte existe déjà avec cet email");
      } else {
        toast.error("Erreur lors de la création du compte");
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Votre compte inclut un espace entreprise (tenant) prêt à l&apos;emploi
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="companyName" className="text-sm font-medium">Nom de l&apos;entreprise</label>
            <Input id="companyName" placeholder="SARL Exemple Togo" {...register("companyName")} />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" placeholder="vous@entreprise.tg" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="regime" className="text-sm font-medium">Régime fiscal</label>
            <select
              id="regime"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("regime")}
            >
              <option value="">Sélectionnez votre régime</option>
              <option value="REEL_NORMAL">Réel normal</option>
              <option value="REEL_SIMPLIFIE">Réel simplifié</option>
              <option value="TPU">Taxe professionnelle unique (TPU)</option>
            </select>
            {errors.regime && <p className="text-xs text-destructive">{errors.regime.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
            <Input id="password" type="password" placeholder="8 caractères minimum" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe</label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Création…</> : "Créer mon compte"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">Se connecter</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
