import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { tenantId, key, label, regime, freq, dueDate, legalRef } = data;

    if (!tenantId || !key || !label || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const obligation = await prisma.calendarObligation.create({
      data: {
        tenantId,
        key,
        label,
        regime,
        freq,
        dueDate,
        legalRef,
        status: "A_JOUR",
      },
    });

    return NextResponse.json(obligation, { status: 201 });
  } catch (error) {
    console.error("Error creating custom tax:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const obligations = await prisma.calendarObligation.findMany({
      where: { tenantId },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(obligations, { status: 200 });
  } catch (error) {
    console.error("Error fetching obligations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
