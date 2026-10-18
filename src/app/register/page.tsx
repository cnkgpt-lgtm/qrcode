"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Gagal mendaftar.");
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) throw new Error("Pendaftaran berhasil, tetapi gagal masuk otomatis.");
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Gagal mendaftar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <div className="wrap single">
        <div className="authbox">
          <div className="card">
            <h2>Buat akun Accank Barcode Studio</h2>
            <div className={`err ${err ? "show" : ""}`}>{err}</div>
            <form onSubmit={submit}>
              <div className="field">
                <label>Nama</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Nama Anda" />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="field">
                <label>Kata sandi (min. 6 karakter)</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
              </div>
              <button className="btn" style={{ width: "100%" }} disabled={busy}>
                {busy ? "Mendaftar…" : "Daftar"}
              </button>
            </form>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14, marginBottom: 0 }}>
              Sudah punya akun? <Link href="/login" style={{ fontWeight: 700, color: "var(--ink)" }}>Masuk di sini</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
