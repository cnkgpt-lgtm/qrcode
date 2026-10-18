import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const t0 = Date.now();
  try {
    const r = await prisma.user.count();
    return NextResponse.json({ ok: true, ms: Date.now() - t0, r });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, ms: Date.now() - t0, error: String(e?.message || e).slice(0, 500), code: e?.code },
      { status: 500 }
    );
  }
}
