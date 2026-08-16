"use client";

import { useAuth, useHasRole } from "@/lib/auth-context";
import { formatAmount } from "@/lib/utils";
import { cn } from "@/lib/utils";

type AmountCellProps = {
  amount: number;
  /** Si true, affiche un tiret pour zéro (convention comptable) */
  zeroDash?: boolean;
  className?: string;
};

/**
 * Cellule de montant FCFA — police mono, alignement droite.
 * Les montants sont toujours des entiers.
 */
export function AmountCell({ amount, zeroDash = true, className }: AmountCellProps) {
  const display = zeroDash && amount === 0 ? "—" : formatAmount(amount);
  return (
    <span className={cn("tabular-nums font-mono text-right", className)}>
      {display}
    </span>
  );
}

type ExerciceBadgeProps = {
  status: "OPEN" | "LOCKED";
};

/** Badge statut exercice fiscal */
export function ExerciceBadge({ status }: ExerciceBadgeProps) {
  return status === "OPEN" ? (
    <span className="badge-open">Ouvert</span>
  ) : (
    <span className="badge-locked">Verrouillé</span>
  );
}

type RoleBadgeProps = {
  role: string;
};

const ROLE_LABELS: Record<string, string> = {
  GERANT:    "Gérant",
  COMPTABLE: "Comptable",
  LECTURE:   "Lecture seule",
  CABINET:   "Cabinet",
  ADMIN_SYS: "Admin système",
};

const ROLE_VARIANTS: Record<string, string> = {
  GERANT:    "bg-purple-100 text-purple-800",
  COMPTABLE: "bg-blue-100 text-blue-800",
  LECTURE:   "bg-gray-100 text-gray-700",
  CABINET:   "bg-orange-100 text-orange-800",
  ADMIN_SYS: "bg-red-100 text-red-800",
};

/** Badge rôle RBAC utilisateur */
export function RoleBadge({ role }: RoleBadgeProps) {
  const label   = ROLE_LABELS[role] ?? role;
  const variant = ROLE_VARIANTS[role] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variant)}>
      {label}
    </span>
  );
}

type GuardProps = {
  roles: Parameters<typeof useHasRole>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Composant de garde RBAC côté UI.
 * Cache le contenu si le rôle courant n'est pas dans la liste.
 * NB : la vraie protection est côté serveur (withGuard) — ceci est UI only.
 */
export function RoleGuard({ roles, fallback = null, children }: GuardProps) {
  const allowed = useHasRole(...roles);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

/** Affiche le label métier selon le mode (expert = comptable, simple = gérant) */
export function Label({
  expert,
  simple,
}: {
  expert: string;
  simple: string;
}) {
  const { expertMode } = useAuth();
  return <>{expertMode ? expert : simple}</>;
}
