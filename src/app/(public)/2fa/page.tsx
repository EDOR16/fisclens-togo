"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiException } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";

type VerifyResponse = { token: string; tenantId: string };

export default function TwoFaPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

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
    const otp = code.join("");
    if (otp.length !== 6) return;

    const userId = sessionStorage.getItem("fl_2fa_uid");
    if (!userId) { router.push("/login"); return; }

    setIsSubmitting(true);
    try {
      const res = await api.post<VerifyResponse>("/auth/2fa/verify", { userId, otp });
      sessionStorage.removeItem("fl_2fa_uid");
      await login(res.token, res.tenantId);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiException && err.status === 401) {
        toast.error("Code incorrect — réessayez");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.error("Erreur — réessayez");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <ShieldCheck className="h-6 w-6 text-brand-600" />
        </div>
        <CardTitle>Vérification en deux étapes</CardTitle>
        <CardDescription>
          Saisissez le code à 6 chiffres de votre application d&apos;authentification
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Grille 6 chiffres */}
          <div className="flex gap-2 justify-center">
            {code.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-12 text-center text-xl font-bold"
                aria-label={`Chiffre ${i + 1}`}
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || code.join("").length !== 6}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Vérification…</>
            ) : (
              "Vérifier le code"
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
