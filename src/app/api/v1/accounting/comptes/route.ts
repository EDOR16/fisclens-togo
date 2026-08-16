import { NextRequest, NextResponse } from "next/server";
import { withGuard } from "@/lib/server/with-guard";
import { prisma } from "@/lib/server/prisma";

export const GET = withGuard(async (req: NextRequest, { tenantId }) => {
  const comptes = await prisma.comptePlan.findMany({
    where: { tenantId },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({ comptes });
});
