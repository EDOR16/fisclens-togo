export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { withGuard } from "@/lib/server/with-guard";

const schema = z.object({
  parentCode: z.string().regex(/^\d{2,8}$/),
  code: z.string().regex(/^\d{3,8}$/),
  libelle: z.string().trim().min(2).max(160),
});

export const POST = withGuard(async (request: NextRequest, { tenantId, user }) => {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.format() }, { status: 400 });
  const { parentCode, code, libelle } = parsed.data;
  if (!code.startsWith(parentCode) || code === parentCode) {
    return NextResponse.json({ error: "INVALID_PREFIX", message: "Le sous-compte doit commencer par le code du compte parent." }, { status: 422 });
  }
  const parent = await prisma.comptePlan.findUnique({ where: { tenantId_code: { tenantId, code: parentCode } } });
  if (!parent || parent.archived) return NextResponse.json({ error: "PARENT_NOT_FOUND", message: "Compte parent introuvable ou archivé." }, { status: 404 });
  const exists = await prisma.comptePlan.findUnique({ where: { tenantId_code: { tenantId, code } } });
  if (exists) return NextResponse.json({ error: "ACCOUNT_EXISTS", message: "Ce code existe déjà." }, { status: 409 });
  const account = await prisma.comptePlan.create({ data: { tenantId, code, libelle, classe: parent.classe, postable: true, isRoot: false, type: "CUSTOM" } });
  await prisma.auditLog.create({ data: { tenantId, userId: user.userId, action: "CREATE_SUBACCOUNT", entity: "COMPTE_PLAN", details: JSON.stringify({ parentCode, code, libelle }) } });
  return NextResponse.json({ compte: account }, { status: 201 });
});
