"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminTenants } from "@/components/admin/admin-tenants";
import { Loader2 } from "lucide-react";

export default function AdminTenantsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const isSuperAdmin = user?.role === "ADMIN_SYS" || user?.isSuperAdmin;

  useEffect(() => {
    if (user && !isSuperAdmin) router.replace("/dashboard");
  }, [user, isSuperAdmin, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-[#157A46]" />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return <AdminTenants />;
}
