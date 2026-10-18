"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setErr("Email atau kata sandi salah.");
      return;
    }
    router.push(sp.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <main>
      <div className="wrap single">
        <div className="authbox">
          <div className="card">
            <h2>Masuk ke Barcode Studio</h2>
            <div className={`err ${err ? "show" : ""}`}>{err}</div>
            <form onSubmit={submit}>
              <div className="field">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="field">
                <label>Kata sandi</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <button className="btn" style={{ width: "100%" }} disabled={busy}>
                {busy ? "Memeriksa…" : "Masuk"}
              </button>
            </form>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14, marginBottom: 0 }}>
              Belum punya akun? <Link href="/register" style={{ fontWeight: 700, color: "var(--ink)" }}>Daftar di sini</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
