import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";
import { auth, signOut } from "@/auth";

export const metadata: Metadata = {
  title: "Accank Barcode Studio — Buat QR & Barcode",
  description:
    "Buat QR Code & barcode siap cetak — tambah logo, hapus background, atur warna. Simpan riwayat per akun.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;

  return (
    <html lang="id">
      <body>
        <Script src="/js/qrcode.min.js" strategy="beforeInteractive" />
        <Script src="/js/JsBarcode.all.min.js" strategy="beforeInteractive" />
        <Script src="/js/jszip.min.js" strategy="beforeInteractive" />
        <header className="site-header">
          <div className="wrap">
            <div className="topnav">
              <div>
                <h1>
                  ACCANK BARCODE<span>&nbsp;STUDIO</span>
                </h1>
                <p>Buat QR Code &amp; barcode siap cetak — tambah logo, hapus background, atur warna.</p>
              </div>
              <nav className="navlinks">
                <Link href="/">Buat</Link>
                <Link href="/riwayat">Riwayat</Link>
                {user ? (
                  <>
                    <span className="who">{user.name || user.email}</span>
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                      }}
                    >
                      <button type="submit">Keluar</button>
                    </form>
                  </>
                ) : (
                  <Link href="/login">Masuk</Link>
                )}
              </nav>
            </div>
            <div className="rule"></div>
          </div>
        </header>
        {children}
        <footer>
          <div className="wrap">
            Accank Barcode Studio — riwayat &amp; logo tersimpan aman di akun Anda.
          </div>
        </footer>
      </body>
    </html>
  );
}
