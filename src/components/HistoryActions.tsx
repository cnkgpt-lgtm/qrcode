"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HistoryActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Hapus riwayat ini?")) return;
    setBusy(true);
    await fetch(`/api/history/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="acts">
      <a className="btn ghost small" href={`/?load=${id}`}>Muat</a>
      <button className="btn ghost small" onClick={remove} disabled={busy}>
        {busy ? "…" : "Hapus"}
      </button>
    </div>
  );
}
