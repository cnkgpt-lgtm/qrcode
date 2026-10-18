import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const item = await prisma.historyItem.findFirst({ where: { id, userId } });
  if (!item) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const item = await prisma.historyItem.findFirst({ where: { id, userId } });
  if (!item) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });
  await prisma.historyItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
