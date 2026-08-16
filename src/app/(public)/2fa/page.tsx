"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiException } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";

type VerifyResponse = { token: string; tenantId: string; usedBackupCode?: boolean };

export default function TwoFaPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [backupCodeInput, setBackupCodeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!useBackupCode) {
      inputRefs.current[0]?.focus();
    }
  }, [useBackupCode]);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = useBackupCode ? backupCodeInput.trim() : code.join("");
    if (!otp) return;
    if (!useBackupCode && otp.length !== 6) return;

    const userId = sessionStorage.getItem("fl_2fa_uid");
    if (!userId) {
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<VerifyResponse>("/auth/2fa/verify", { userId, otp });
      sessionStorage.removeItem("fl_2fa_uid");
      await login(res.token, res.tenantId);

      if (res.usedBackupCode) {
        toast.info("Connexion réussie avec un code de secours. Pensez à regénérer vos codes si besoin.");
      } else {
        toast.success("Authentification réussie");
      }

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiException && err.status === 401) {
        toast.error(useBackupCode ? "Code de secours invalide ou déjà utilisé" : "Code TOTP incorrect — réessayez");
        if (!useBackupCode) {
          setCode(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } else {
        toast.error("Erreur d'authentification — réessayez");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-brand-200">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          {useBackupCode ? (
            <KeyRound className="h-6 w-6 text-brand-600" />
          ) : (
            <ShieldCheck className="h-6 w-6 text-brand-600" />
          )}
        </div>
        <CardTitle className="text-xl font-bold">
          {useBackupCode ? "Code de secours" : "Vérification en deux étapes"}
        </CardTitle>
        <CardDescription>
          {useBackupCode
            ? "Saisissez l'un de vos codes de secours de récupération (8 caractères)"
            : "Saisissez le code à 6 chiffres généré par votre application (Google Authenticator)"}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {!useBackupCode ? (
            /* Grille 6 chiffres */
            <div className="flex gap-2 justify-center py-2">
              {code.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-12 text-center text-xl font-bold rounded-lg border-2 focus:border-brand-600"
                  aria-label={`Chiffre ${i + 1}`}
                />
              ))}
            </div>
          ) : (
            /* Champ code de secours */
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Ex: A1B2-C3D4"
                value={backupCodeInput}
                onChange={(e) => setBackupCodeInput(e.target.value.toUpperCase())}
                className="text-center font-mono text-lg tracking-widest uppercase h-12"
                maxLength={10}
                autoFocus
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={isSubmitting || (!useBackupCode && code.join("").length !== 6) || (useBackupCode && !backupCodeInput.trim())}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Vérification…
              </>
            ) : (
              "Vérifier et continuer"
            )}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode((v) => !v);
                setCode(["", "", "", "", "", ""]);
                setBackupCodeInput("");
              }}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline inline-flex items-center gap-1"
            >
              {useBackupCode
                ? "← Utiliser l'application Google Authenticator"
                : "Appareil inaccessible ? Utiliser un code de secours"}
            </button>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4 flex justify-center">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Retour à la connexion
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
