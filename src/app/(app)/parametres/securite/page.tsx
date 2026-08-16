import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Smartphone, LogOut } from "lucide-react";

export const metadata: Metadata = { title: "Sécurité" };

export default function SecuritePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Sécurité du compte</h2>
        <p className="text-sm text-muted-foreground">
          Gérez votre mot de passe, l&apos;authentification à deux facteurs et les sessions actives.
        </p>
      </div>

      {/* Mot de passe */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Mot de passe</CardTitle>
          </div>
          <CardDescription>Dernière modification : il y a 45 jours</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Modifier le mot de passe</Button>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Authentification à deux facteurs</CardTitle>
            </div>
            <Badge variant="warning">Non activé</Badge>
          </div>
          <CardDescription>
            Obligatoire pour les rôles ADMIN_SYS et CABINET. Fortement recommandé pour tous.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Activer la 2FA</Button>
        </CardContent>
      </Card>

      {/* Sessions actives */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Sessions actives</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { device: "Chrome · Windows 11", location: "Lomé, Togo", current: true,  lastSeen: "En cours" },
            { device: "Firefox · Android",   location: "Lomé, Togo", current: false, lastSeen: "Il y a 2j" },
          ].map((session, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{session.device}</p>
                <p className="text-xs text-muted-foreground">{session.location} · {session.lastSeen}</p>
              </div>
              {session.current ? (
                <Badge variant="success">Session actuelle</Badge>
              ) : (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <LogOut className="h-3.5 w-3.5" />
                  Révoquer
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
