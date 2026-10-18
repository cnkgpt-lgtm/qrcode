import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const MAX_PAYLOAD = 2_500_000; // ~2.5MB (boleh memuat logo dataURL)

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.historyItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, kind: true, label: true, createdAt: true },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { kind, label, payload } = (await req.json()) as {
      kind?: string; label?: string; payload?: unknown;
    };
    if (kind !== "qr" && kind !== "barcode")
      return NextResponse.json({ error: "kind harus 'qr' atau 'barcode'." }, { status: 400 });
    const cleanLabel = String(label ?? "").trim().slice(0, 120) || "(tanpa nama)";
    const raw = JSON.stringify(payload ?? {});
    if (raw.length > MAX_PAYLOAD)
      return NextResponse.json({ error: "Data terlalu besar (logo mungkin kebesaran)." }, { status: 413 });
    const item = await prisma.historyItem.create({
      data: { userId, kind, label: cleanLabel, payload: payload as object },
    });
    return NextResponse.json({ ok: true, id: item.id });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
  }
}
