"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Shield, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleBadge } from "@/components/fiscal-ui";

type UserItem = {
  id: string;
  nom: string;
  email: string;
  role: "GERANT" | "COMPTABLE" | "LECTURE" | "CABINET" | "ADMIN_SYS";
  statut: "ACTIF" | "INVITE";
  dateAjout: string;
};

const INITIAL_USERS: UserItem[] = [];

export default function UtilisateursPage() {
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserItem["role"]>("COMPTABLE");

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    const newUser: UserItem = {
      id: String(Date.now()),
      nom: inviteEmail.split("@")[0] || "Nouvel invité",
      email: inviteEmail,
      role: inviteRole,
      statut: "INVITE",
      dateAjout: "Aujourd'hui",
    };
    setUsers([...users, newUser]);
    setInviteEmail("");
    toast.success(`Invitation envoyée à ${inviteEmail} avec le rôle ${inviteRole}`);
  }

  function handleRoleChange(userId: string, newRole: UserItem["role"]) {
    setUsers((list) =>
      list.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    toast.success("Rôle utilisateur mis à jour.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Gestion des Utilisateurs & Rôles RBAC
        </h2>
        <p className="text-sm text-muted-foreground">
          Contrôle des accès multi-utilisateurs et affectation des permissions (Gérant, Comptable, Lecture seule, Cabinet externe)
        </p>
      </div>

      {/* Formulaire d'invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Inviter un collaborateur ou votre cabinet comptable
          </CardTitle>
          <CardDescription>Un lien d&apos;accès sécurisé lui sera envoyé par email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-medium">Adresse email</label>
              <Input
                type="email"
                placeholder="collegue@cabinet.tg"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-sm font-medium">Rôle assigné</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserItem["role"])}
              >
                <option value="COMPTABLE">Comptable</option>
                <option value="LECTURE">Lecture seule</option>
                <option value="CABINET">Cabinet (Expert)</option>
                <option value="GERANT">Gérant</option>
              </select>
            </div>
            <Button type="submit">
              <Mail className="h-4 w-4 mr-1" /> Envoyer l&apos;invitation
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membres du dossier ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle RBAC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d&apos;ajout</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-sm">{u.nom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <select
                      className="text-xs rounded border border-input bg-background px-2 py-1"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserItem["role"])}
                    >
                      <option value="GERANT">Gérant</option>
                      <option value="COMPTABLE">Comptable</option>
                      <option value="LECTURE">Lecture seule</option>
                      <option value="CABINET">Cabinet</option>
                      <option value="ADMIN_SYS">Admin système</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    {u.statut === "ACTIF" ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="warning">Invitation envoyée</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.dateAjout}</TableCell>
                  <TableCell className="text-right">
                    {u.role !== "GERANT" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setUsers((list) => list.filter((item) => item.id !== u.id));
                          toast.success("Utilisateur révoqué du dossier.");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
