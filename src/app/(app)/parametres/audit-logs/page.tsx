"use client";

import type { Metadata } from "next";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Lock, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";


type AuditEntry = {
  id: string;
  action: string;
  userId: string;
  userName: string;
  tenantId: string;
  createdAt: string;
  details: string;
};

const EMPTY_AUDIT: AuditEntry[] = [];

const ACTION_BADGE: Record<string, React.ReactNode> = {
  ENTRY_CREATE:     <Badge variant="info">Saisie</Badge>,
  PERIOD_LOCK:      <Badge variant="destructive">ClÃ´ture</Badge>,
  CABINET_SWITCH:   <Badge variant="warning">Switch dossier</Badge>,
  PARAM_UPDATE:     <Badge variant="warning">ParamÃ¨tre</Badge>,
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
            Log immuable â€” aucune entrÃ©e ne peut Ãªtre modifiÃ©e ou supprimÃ©e
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info("Export audit log en CSV...") }>
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            AccÃ¨s en lecture seule â€” GERANT et ADMIN_SYS uniquement. Les Ã©vÃ©nements sont append-only au niveau base de donnÃ©es (REVOKE UPDATE/DELETE).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="font-hand text-3xl">Aucune activitÃ© dâ€™audit enregistrÃ©e.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Les Ã©vÃ©nements de sÃ©curitÃ©, de validation et de clÃ´ture apparaitront ici dÃ¨s quâ€™une vraie action sera exÃ©cutÃ©e.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
