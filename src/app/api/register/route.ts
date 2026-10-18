import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = (await req.json()) as {
      name?: string; email?: string; password?: string;
    };
    const cleanEmail = String(email ?? "").toLowerCase().trim();
    const cleanName = String(name ?? "").trim();
    const pw = String(password ?? "");
    if (!cleanEmail || !cleanEmail.includes("@"))
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    if (pw.length < 6)
      return NextResponse.json({ error: "Kata sandi minimal 6 karakter." }, { status: 400 });
    const exists = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (exists)
      return NextResponse.json({ error: "Email sudah terdaftar. Silakan masuk." }, { status: 409 });
    const hash = await bcrypt.hash(pw, 10);
    await prisma.user.create({
      data: { email: cleanEmail, name: cleanName || null, password: hash },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal mendaftar. Coba lagi." }, { status: 500 });
  }
}
