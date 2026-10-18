import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const MAX_LOGO = 1_500_000; // ~1.5MB base64

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const logos = await prisma.savedLogo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    logos: logos.map((l) => ({
      id: l.id,
      name: l.name,
      createdAt: l.createdAt,
      dataUrl: `data:${l.mime};base64,${Buffer.from(l.data).toString("base64")}`,
    })),
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, dataUrl } = (await req.json()) as { name?: string; dataUrl?: string };
    const m = /^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ""));
    if (!m) return NextResponse.json({ error: "Format gambar tidak valid." }, { status: 400 });
    if (m[3].length > MAX_LOGO)
      return NextResponse.json({ error: "Logo terlalu besar (maks ~1MB)." }, { status: 413 });
    const count = await prisma.savedLogo.count({ where: { userId } });
    if (count >= 50)
      return NextResponse.json({ error: "Maksimal 50 logo tersimpan." }, { status: 400 });
    const logo = await prisma.savedLogo.create({
      data: {
        userId,
        name: String(name ?? "logo").slice(0, 80) || "logo",
        mime: m[1],
        data: Buffer.from(m[3], "base64"),
      },
    });
    return NextResponse.json({ ok: true, id: logo.id });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan logo." }, { status: 500 });
  }
}
