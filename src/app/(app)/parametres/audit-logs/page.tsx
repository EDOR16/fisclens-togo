import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Lock, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Audit log" };

type AuditEntry = {
  id: string;
  action: string;
  userId: string;
  userName: string;
  tenantId: string;
  createdAt: string;
  details: string;
};

const MOCK_AUDIT: AuditEntry[] = [
  { id: "a1", action: "ENTRY_CREATE",      userId: "u1", userName: "Kofi Mensah",   tenantId: "t1", createdAt: "2025-08-14T09:32:00Z", details: "Écriture #ECR-2025-089 créée" },
  { id: "a2", action: "PERIOD_LOCK",       userId: "u1", userName: "Kofi Mensah",   tenantId: "t1", createdAt: "2025-08-13T17:01:00Z", details: "Exercice 2024 verrouillé" },
  { id: "a3", action: "CABINET_SWITCH",    userId: "u2", userName: "Afi Delali",     tenantId: "t1", createdAt: "2025-08-13T14:22:00Z", details: "Changement dossier → tenant t2" },
  { id: "a4", action: "PARAM_UPDATE",      userId: "u3", userName: "Admin Système",  tenantId: "t1", createdAt: "2025-08-10T11:05:00Z", details: "Paramètres fiscaux 2025-v1 créés" },
  { id: "a5", action: "EXPORT_CREATED",    userId: "u1", userName: "Kofi Mensah",   tenantId: "t1", createdAt: "2025-08-09T16:43:00Z", details: "Export TVA août 2025" },
  { id: "a6", action: "REVERSAL_CREATED",  userId: "u1", userName: "Kofi Mensah",   tenantId: "t1", createdAt: "2025-08-08T10:12:00Z", details: "Contre-passation ECR-2025-071" },
];

const ACTION_BADGE: Record<string, React.ReactNode> = {
  ENTRY_CREATE:     <Badge variant="info">Saisie</Badge>,
  PERIOD_LOCK:      <Badge variant="destructive">Clôture</Badge>,
  CABINET_SWITCH:   <Badge variant="warning">Switch dossier</Badge>,
  PARAM_UPDATE:     <Badge variant="warning">Paramètre</Badge>,
  EXPORT_CREATED:   <Badge variant="outline">Export</Badge>,
  REVERSAL_CREATED: <Badge variant="secondary">Contre-pass.</Badge>,
};

export default function AuditLogsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Journal d&apos;audit</h2>
          <p className="text-sm text-muted-foreground">
            Log immuable — aucune entrée ne peut être modifiée ou supprimée
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Accès en lecture seule — GERANT et ADMIN_SYS uniquement. Les événements sont append-only au niveau base de données (REVOKE UPDATE/DELETE).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horodatage</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_AUDIT.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                  </TableCell>
                  <TableCell>{ACTION_BADGE[entry.action] ?? <Badge variant="outline">{entry.action}</Badge>}</TableCell>
                  <TableCell className="text-sm font-medium">{entry.userName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.details}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
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
