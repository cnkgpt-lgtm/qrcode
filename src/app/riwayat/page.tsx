import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { auth } from "@/auth";
import HistoryActions from "@/components/HistoryActions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export default async function RiwayatPage() {
  const session = await auth();
  const userId = await requireUserId();

  if (!userId) {
    return (
      <main>
        <div className="wrap single">
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <h2>Masuk dulu</h2>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Riwayat barcode tersimpan per akun. Masuk untuk melihat riwayat Anda.
            </p>
            <Link className="btn" href="/login?callbackUrl=/riwayat">Masuk</Link>
          </div>
        </div>
      </main>
    );
  }

  const items = await prisma.historyItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, kind: true, label: true, createdAt: true },
  });

  const name = (session?.user as { name?: string | null } | undefined)?.name;

  return (
    <main>
      <div className="wrap single" style={{ maxWidth: 980 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 4px" }}>
          Riwayat{name ? ` — ${name}` : ""}
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>
          {items.length} tersimpan · klik <b>Muat</b> untuk membuka lagi di generator
        </p>
        {items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>Belum ada riwayat.</p>
            <Link className="btn" href="/">Buat barcode pertama</Link>
          </div>
        ) : (
          <div className="histgrid">
            {items.map((it) => (
              <div className="histcard" key={it.id}>
                <div className="k">{it.kind === "qr" ? "QR Code" : "Barcode"}</div>
                <div className="t">{it.label}</div>
                <div className="d">{fmtDate(it.createdAt)}</div>
                <HistoryActions id={it.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
