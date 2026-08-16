"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api, ApiException } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Key,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";

type SetupResponse = {
  secret: string;
  qrCodeDataUrl: string;
  otpauthUrl: string;
};

type EnableResponse = {
  success: boolean;
  message: string;
  backupCodes: string[];
};

export default function SecuritePage() {
  const { user, refreshSession } = useAuth();
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "codes">("idle");
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    if (user) {
      setIs2faEnabled(user.require2fa);
    }
  }, [user]);

  // Étape 1 : Démarrer le setup 2FA
  async function handleStartSetup() {
    setIsSubmitting(true);
    try {
      const data = await api.post<SetupResponse>("/auth/2fa/setup", {});
      setSetupData(data);
      setSetupStep("qr");
      setOtpInput("");
    } catch (err) {
      toast.error("Impossible d'initialiser la 2FA");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Étape 2 : Confirmer le premier code et obtenir les backup codes
  async function handleConfirmOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otpInput.length !== 6) {
      toast.error("Veuillez saisir un code à 6 chiffres");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<EnableResponse>("/auth/2fa/enable", { otp: otpInput });
      setBackupCodes(res.backupCodes);
      setSetupStep("codes");
      setIs2faEnabled(true);
      toast.success("Authentification à deux facteurs activée !");
      await refreshSession();
    } catch (err) {
      if (err instanceof ApiException) {
        toast.error(err.message || "Code OTP invalide");
      } else {
        toast.error("Erreur de confirmation du code");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Étape 3 : Désactiver la 2FA avec confirmation mot de passe
  async function handleDisable2fa(e: React.FormEvent) {
    e.preventDefault();
    if (!disablePassword) {
      toast.error("Veuillez saisir votre mot de passe");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/2fa/disable", { password: disablePassword });
      setIs2faEnabled(false);
      setShowDisableDialog(false);
      setDisablePassword("");
      setSetupStep("idle");
      toast.success("Authentification à deux facteurs désactivée.");
      await refreshSession();
    } catch (err) {
      if (err instanceof ApiException && err.status === 401) {
        toast.error("Mot de passe incorrect");
      } else {
        toast.error("Erreur lors de la désactivation");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyManualKey() {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedKey(true);
      toast.success("Clé secrète copiée !");
      setTimeout(() => setCopiedKey(false), 2500);
    }
  }

  function copyAllBackupCodes() {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedCodes(true);
      toast.success("Codes de secours copiés dans le presse-papier");
      setTimeout(() => setCopiedCodes(false), 2500);
    }
  }

  function downloadBackupCodes() {
    const text = `FiscLens Togo - Codes de secours 2FA\nCompte: ${user?.email}\nDate: ${new Date().toLocaleDateString("fr-FR")}\n\n` +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      "\n\nGardez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une seule fois.";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fisclens-codes-secours-${user?.email || "compte"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fichier texte téléchargé");
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Sécurité & Accès</h2>
        <p className="text-sm text-muted-foreground">
          Protégez votre compte FiscLens Togo avec l&apos;authentification multi-facteurs (SYSCOHADA & OTR conforme).
        </p>
      </div>

      {/* Carte Authentification 2FA */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${is2faEnabled ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Authentification à deux facteurs (TOTP)
                </CardTitle>
                <CardDescription className="text-xs">
                  Recommandé par l&apos;OTR pour sécuriser l&apos;accès aux écritures comptables et déclarations fiscales.
                </CardDescription>
              </div>
            </div>
            {is2faEnabled ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Activé
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <ShieldAlert className="h-3.5 w-3.5" /> Non activé
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* État 1 : Non activé & repos */}
          {!is2faEnabled && setupStep === "idle" && (
            <div className="rounded-lg border border-dashed p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30">
              <div className="space-y-1">
                <p className="text-sm font-medium">Ajouter une couche de sécurité supplémentaire</p>
                <p className="text-xs text-muted-foreground">
                  Générez un code temporaire à chaque connexion avec Google Authenticator ou Microsoft Authenticator.
                </p>
              </div>
              <Button onClick={handleStartSetup} disabled={isSubmitting} className="shrink-0">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Initialisation…
                  </>
                ) : (
                  "Activer la 2FA"
                )}
              </Button>
            </div>
          )}

          {/* État 2 : QR Code & validation */}
          {!is2faEnabled && setupStep === "qr" && setupData && (
            <div className="space-y-6 rounded-lg border p-5 bg-card">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white font-bold">1</span>
                  Scannez le QR Code dans votre application
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setSetupStep("idle")}>
                  Annuler
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-center">
                {/* Image QR Code */}
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="QR Code 2FA"
                    className="w-48 h-48 rounded"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Google Authenticator, Authy ou Microsoft Authenticator
                  </p>
                </div>

                {/* Clé manuelle & Saisie OTP */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Ou saisissez manuellement cette clé secrète :
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-2.5 py-1.5 bg-muted rounded font-mono text-xs select-all break-all border">
                        {setupData.secret}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyManualKey}
                        className="shrink-0"
                      >
                        {copiedKey ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleConfirmOtp} className="space-y-3 pt-2">
                    <label className="text-xs font-semibold text-foreground block">
                      <span className="flex h-5 w-5 inline-flex items-center justify-center rounded-full bg-brand-600 text-[10px] text-white font-bold mr-1.5">2</span>
                      Saisissez le code à 6 chiffres pour valider :
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Ex: 123456"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                        className="font-mono text-base tracking-widest text-center h-10 font-bold"
                        autoFocus
                      />
                      <Button
                        type="submit"
                        disabled={isSubmitting || otpInput.length !== 6}
                        className="shrink-0"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirmer & Activer"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* État 3 : Affichage des Codes de secours après activation */}
          {setupStep === "codes" && backupCodes.length > 0 && (
            <div className="space-y-4 rounded-lg border border-green-200 bg-green-50/50 p-5">
              <div className="flex items-center gap-2 text-green-800">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <h4 className="font-semibold text-sm">
                  Sauvegardez vos codes de secours !
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Conservez ces codes en lieu sûr. Ils vous permettront d&apos;accéder à votre compte si vous perdez l&apos;accès à votre téléphone. Chaque code ne fonctionne qu&apos;une seule fois.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-md border border-green-200">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="font-mono text-center text-xs font-bold py-1.5 px-2 bg-slate-50 border rounded text-slate-800 tracking-wider select-all"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={copyAllBackupCodes} className="gap-1.5">
                  {copiedCodes ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  Copier tous les codes
                </Button>
                <Button variant="outline" size="sm" onClick={downloadBackupCodes} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Télécharger (.txt)
                </Button>
                <Button size="sm" onClick={() => setSetupStep("idle")} className="ml-auto">
                  J&apos;ai sauvegardé mes codes
                </Button>
              </div>
            </div>
          )}

          {/* État 4 : 2FA déjà activée */}
          {is2faEnabled && setupStep !== "codes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">Votre compte est protégé</p>
                  <p className="text-xs text-muted-foreground">
                    Un code de sécurité vous sera demandé à chaque nouvelle connexion.
                  </p>
                </div>
                {!showDisableDialog && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisableDialog(true)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Désactiver la 2FA
                  </Button>
                )}
              </div>

              {/* Formulaire de confirmation pour désactivation */}
              {showDisableDialog && (
                <form onSubmit={handleDisable2fa} className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3">
                  <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Confirmation de la désactivation
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pour des raisons de sécurité, veuillez confirmer votre mot de passe actuel pour désactiver la 2FA :
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Votre mot de passe actuel"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="max-w-xs"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isSubmitting || !disablePassword}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirmer la désactivation"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowDisableDialog(false);
                        setDisablePassword("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carte Sessions Actives */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Sessions & Périphériques</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Appareils actuellement connectés à votre compte FiscLens Togo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-3 bg-muted/20">
            <div>
              <p className="text-sm font-medium">Session actuelle (Navigateur)</p>
              <p className="text-xs text-muted-foreground">Lomé, Togo · En cours</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
