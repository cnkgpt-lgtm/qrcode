"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    qrcode: any;
    JsBarcode: any;
    JSZip: any;
  }
}

/* ================= pure helpers (diport dari v1, sudah teruji) ================= */

function removeWhite(canvas: HTMLCanvasElement, thr = 245) {
  const c = canvas.getContext("2d");
  if (!c) return;
  const img = c.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > thr && d[i + 1] > thr && d[i + 2] > thr) d[i + 3] = 0;
  }
  c.putImageData(img, 0, 0);
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

type QrOpts = {
  ec: string; size: number; fg: string; bg: string; transparent: boolean; quiet: number;
  logo: HTMLImageElement | null; logoPct: number; logoPad: number; logoRad: number;
};

function renderQR(target: HTMLCanvasElement, text: string, o: QrOpts): number {
  const qr = window.qrcode(0, o.ec);
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const q = o.quiet;
  const total = n + q * 2;
  const s = o.size / total;
  target.width = target.height = o.size;
  const c = target.getContext("2d")!;
  c.clearRect(0, 0, o.size, o.size);
  if (!o.transparent) {
    c.fillStyle = o.bg;
    c.fillRect(0, 0, o.size, o.size);
  }
  c.fillStyle = o.fg;
  const w = Math.ceil(s);
  for (let r = 0; r < n; r++)
    for (let col = 0; col < n; col++)
      if (qr.isDark(r, col)) c.fillRect(Math.floor((q + col) * s), Math.floor((q + r) * s), w, w);
  if (o.logo) {
    const lp = o.size * o.logoPct;
    const pad = o.logoPad * (o.size / 1024);
    const rad = (o.logoRad / 100) * lp;
    const bx = (o.size - lp) / 2 - pad;
    const by = (o.size - lp) / 2 - pad;
    const bs = lp + pad * 2;
    c.save();
    if (!o.transparent) {
      // Badge putih hanya bila background tidak transparan
      c.fillStyle = "#ffffff";
      rr(c, bx, by, bs, bs, rad + pad * 0.6);
      c.fill();
    }
    c.clip();
    c.drawImage(o.logo, (o.size - lp) / 2, (o.size - lp) / 2, lp, lp);
    c.restore();
  }
  return n;
}

function qrSVG(text: string, o: QrOpts): string {
  const qr = window.qrcode(0, o.ec);
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const q = o.quiet;
  const total = n + q * 2;
  const unit = 10;
  const W = total * unit;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}">`;
  if (!o.transparent) s += `<rect width="${W}" height="${W}" fill="${o.bg}"/>`;
  s += `<g fill="${o.fg}">`;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.isDark(r, c))
        s += `<rect x="${(q + c) * unit}" y="${(q + r) * unit}" width="${unit}" height="${unit}"/>`;
  s += "</g>";
  if (o.logo) {
    const lp = W * o.logoPct;
    const pad = o.logoPad * (W / 1024);
    const rad = (o.logoRad / 100) * lp;
    const bx = (W - lp) / 2 - pad;
    const by = (W - lp) / 2 - pad;
    const bs = lp + pad * 2;
    const tmp = document.createElement("canvas");
    tmp.width = o.logo.naturalWidth || o.logo.width;
    tmp.height = o.logo.naturalHeight || o.logo.height;
    tmp.getContext("2d")!.drawImage(o.logo, 0, 0);
    if (!o.transparent) {
      s += `<rect x="${bx}" y="${by}" width="${bs}" height="${bs}" rx="${rad + pad * 0.6}" fill="#ffffff"/>`;
    }
    s += `<image href="${tmp.toDataURL("image/png")}" x="${(W - lp) / 2}" y="${(W - lp) / 2}" width="${lp}" height="${lp}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return s + "</svg>";
}

type BarOpts = {
  format: string; fg: string; bg: string; transparent: boolean;
  width: number; height: number; displayValue: boolean;
};

function renderBar(target: HTMLCanvasElement, value: string, o: BarOpts) {
  window.JsBarcode(target, value, {
    format: o.format,
    lineColor: o.fg,
    background: "#ffffff",
    width: o.width,
    height: o.height,
    displayValue: o.displayValue,
    fontSize: 20,
    margin: 12,
    font: "monospace",
  });
  if (o.transparent) removeWhite(target);
}

function download(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function canvasDownload(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((b) => {
    if (!b) return;
    const url = URL.createObjectURL(b);
    download(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, "image/png");
}

function safeName(v: string, i: number) {
  const s = v.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "kode";
  return String(i + 1).padStart(3, "0") + "-" + s + ".png";
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal membaca gambar."));
    img.src = dataUrl;
  });
}

async function makeCleanLogo(img: HTMLImageElement): Promise<HTMLImageElement> {
  const t = document.createElement("canvas");
  t.width = img.naturalWidth;
  t.height = img.naturalHeight;
  t.getContext("2d")!.drawImage(img, 0, 0);
  removeWhite(t, 235);
  return loadImage(t.toDataURL("image/png"));
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve(String(rd.result));
    rd.onerror = () => reject(new Error("Gagal membaca file."));
    rd.readAsDataURL(file);
  });
}

/* ================= component ================= */

type User = { id: string; name: string | null; email: string | null } | null;
type LogoState = { img: HTMLImageElement; clean: HTMLImageElement; name: string; dataUrl: string };
type SavedLogo = { id: string; name: string; dataUrl: string };

const QR_DEFAULT = {
  kind: "link" as "link" | "text",
  text: "https://tokosaya.com",
  ec: "Q",
  size: "1024",
  quiet: 4,
  fg: "#141414",
  bg: "#ffffff",
  transparent: false,
};
const BAR_DEFAULT = {
  format: "CODE128",
  text: "8991234567891",
  width: 2,
  height: 100,
  displayValue: true,
  fg: "#141414",
  bg: "#ffffff",
  transparent: false,
};
const LOGOOPTS_DEFAULT = { pct: 22, pad: 8, rad: 18, noWhite: false };

export default function BarcodeStudio({ user }: { user: User }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"qr" | "bar" | "batch">("qr");
  const [qr, setQr] = useState(QR_DEFAULT);
  const [logo, setLogo] = useState<LogoState | null>(null);
  const [logoOpts, setLogoOpts] = useState(LOGOOPTS_DEFAULT);
  const [bar, setBar] = useState(BAR_DEFAULT);
  const [batchKind, setBatchKind] = useState<"qr" | "bar">("qr");
  const [batchText, setBatchText] = useState("");
  const [batchItems, setBatchItems] = useState<{ name: string; url: string }[]>([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [dimInfo, setDimInfo] = useState("—");
  const [showCanvas, setShowCanvas] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [checker, setChecker] = useState(false);
  const [savedLogos, setSavedLogos] = useState<SavedLogo[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  /* ---------- render ---------- */
  function doRender() {
    setErr("");
    const cv = canvasRef.current;
    if (!cv || typeof window.qrcode === "undefined") return;
    try {
      if (mode === "qr") {
        if (!qr.text.trim()) {
          setShowCanvas(false); setIsEmpty(true); setDimInfo("—"); setChecker(false); return;
        }
        const n = renderQR(cv, qr.text, {
          ec: qr.ec,
          size: parseInt(qr.size, 10),
          fg: qr.fg,
          bg: qr.bg,
          transparent: qr.transparent,
          quiet: qr.quiet,
          logo: logo ? (logoOpts.noWhite ? logo.clean : logo.img) : null,
          logoPct: logoOpts.pct / 100,
          logoPad: logoOpts.pad,
          logoRad: logoOpts.rad,
        });
        setShowCanvas(true); setIsEmpty(false);
        setChecker(qr.transparent);
        setDimInfo(`${qr.size} × ${qr.size} px · ${n}×${n} modul`);
      } else if (mode === "bar") {
        if (!bar.text.trim()) {
          setShowCanvas(false); setIsEmpty(true); setDimInfo("—"); setChecker(false); return;
        }
        renderBar(cv, bar.text, {
          format: bar.format,
          fg: bar.fg,
          bg: bar.bg,
          transparent: bar.transparent,
          width: bar.width,
          height: bar.height,
          displayValue: bar.displayValue,
        });
        setShowCanvas(true); setIsEmpty(false);
        setChecker(bar.transparent);
        setDimInfo(`${cv.width} × ${cv.height} px · ${bar.format}`);
      }
    } catch (e: any) {
      setShowCanvas(false); setIsEmpty(false);
      setErr("Gagal membuat kode: " + (e?.message || String(e)) + " — coba perpendek teks / cek format nilai.");
    }
  }

  const renderRef = useRef(doRender);
  renderRef.current = doRender;
  useEffect(() => {
    const t = setTimeout(() => renderRef.current(), 200);
    return () => clearTimeout(t);
  });

  /* ---------- muat dari riwayat (?load=) ---------- */
  useEffect(() => {
    if (loadedRef.current) return;
    const id = searchParams.get("load");
    if (!id) return;
    loadedRef.current = true;
    (async () => {
      try {
        const r = await fetch(`/api/history/${id}`);
        if (!r.ok) throw new Error("Riwayat tidak ditemukan.");
        const { item } = await r.json();
        const p = item.payload as any;
        if (item.kind === "qr" && p?.qr) {
          setMode("qr");
          setQr({ ...QR_DEFAULT, ...p.qr });
          if (p.logoOpts) setLogoOpts({ ...LOGOOPTS_DEFAULT, ...p.logoOpts });
          if (p.logoDataUrl) await setLogoFromDataUrl(p.logoDataUrl, "logo-riwayat");
        } else if (item.kind === "barcode" && p?.bar) {
          setMode("bar");
          setBar({ ...BAR_DEFAULT, ...p.bar });
        }
      } catch (e: any) {
        setErr(e?.message || "Gagal memuat riwayat.");
      }
      router.replace("/");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- logo ---------- */
  async function setLogoFromDataUrl(dataUrl: string, name: string) {
    const img = await loadImage(dataUrl);
    const clean = await makeCleanLogo(img);
    setLogo({ img, clean, name, dataUrl });
    setQr((q) => (q.ec === "H" ? q : { ...q, ec: "H" }));
  }

  async function handleLogoFile(file: File) {
    if (!/^image\//.test(file.type)) {
      setErr("File harus gambar (PNG/JPG/WebP).");
      return;
    }
    try {
      const dataUrl = await readAsDataURL(file);
      await setLogoFromDataUrl(dataUrl, file.name);
    } catch (e: any) {
      setErr(e?.message || "Gagal membaca logo.");
    }
  }

  /* ---------- logo tersimpan ---------- */
  useEffect(() => {
    if (user) fetchSavedLogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function fetchSavedLogos() {
    try {
      const r = await fetch("/api/logos");
      if (r.ok) setSavedLogos((await r.json()).logos);
    } catch { /* abaikan */ }
  }

  async function saveLogoToAccount() {
    if (!logo || !user) return;
    setErr(""); setOk("");
    try {
      const r = await fetch("/api/logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: logo.name, dataUrl: logo.dataUrl }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Gagal menyimpan logo.");
      setOk("Logo tersimpan di akun Anda.");
      fetchSavedLogos();
    } catch (e: any) {
      setErr(e?.message || "Gagal menyimpan logo.");
    }
  }

  async function deleteSavedLogo(id: string) {
    await fetch(`/api/logos/${id}`, { method: "DELETE" });
    fetchSavedLogos();
  }

  /* ---------- simpan riwayat ---------- */
  async function saveHistory() {
    if (!user) {
      router.push("/login?callbackUrl=" + encodeURIComponent("/"));
      return;
    }
    if (mode === "batch") return;
    setSaving(true); setErr(""); setOk("");
    try {
      const isQr = mode === "qr";
      const label = isQr ? qr.text.slice(0, 60) : `${bar.format}: ${bar.text}`.slice(0, 60);
      const payload = isQr
        ? { qr: { ...qr }, logoOpts: { ...logoOpts }, logoDataUrl: logo?.dataUrl ?? null }
        : { bar: { ...bar } };
      const r = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: isQr ? "qr" : "barcode", label, payload }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Gagal menyimpan.");
      setOk("Tersimpan di riwayat Anda.");
    } catch (e: any) {
      setErr(e?.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- download ---------- */
  function downloadPng() {
    doRender();
    const cv = canvasRef.current;
    if (!cv || !showCanvas) return;
    canvasDownload(cv, mode === "qr" ? "qrcode.png" : "barcode.png");
  }

  function downloadSvg() {
    setErr("");
    try {
      let svg: string, name: string;
      if (mode === "qr") {
        if (!qr.text.trim()) return;
        svg = qrSVG(qr.text, {
          ec: qr.ec, size: 1024, fg: qr.fg, bg: qr.bg, transparent: qr.transparent, quiet: qr.quiet,
          logo: logo ? (logoOpts.noWhite ? logo.clean : logo.img) : null,
          logoPct: logoOpts.pct / 100, logoPad: logoOpts.pad, logoRad: logoOpts.rad,
        });
        name = "qrcode.svg";
      } else {
        if (!bar.text.trim()) return;
        const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        window.JsBarcode(el, bar.text, {
          format: bar.format, lineColor: bar.fg,
          background: bar.transparent ? "transparent" : bar.bg,
          width: bar.width, height: bar.height, displayValue: bar.displayValue,
          fontSize: 20, margin: 12, font: "monospace",
        });
        svg = new XMLSerializer().serializeToString(el);
        name = "barcode.svg";
      }
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      download(url, name);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e: any) {
      setErr("Gagal membuat SVG: " + (e?.message || String(e)));
    }
  }

  /* ---------- batch ---------- */
  async function runBatch() {
    setErr("");
    const lines = batchText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 200);
    if (!lines.length) {
      setErr("Isi dulu daftar nilai (satu per baris).");
      return;
    }
    const tmp = document.createElement("canvas");
    const items: { name: string; url: string }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const v = lines[i];
      try {
        if (batchKind === "qr") {
          renderQR(tmp, v, {
            ec: qr.ec, size: 512, fg: qr.fg, bg: qr.bg, transparent: qr.transparent, quiet: qr.quiet,
            logo: null, logoPct: 0.22, logoPad: 8, logoRad: 18,
          });
        } else {
          renderBar(tmp, v, {
            format: bar.format, fg: bar.fg, bg: bar.bg, transparent: bar.transparent,
            width: bar.width, height: bar.height, displayValue: bar.displayValue,
          });
        }
        items.push({ name: safeName(v, i), url: tmp.toDataURL("image/png") });
      } catch (e: any) {
        setErr(`Baris ${i + 1} gagal (${v}): ${e?.message || String(e)}`);
      }
    }
    setBatchItems(items);
  }

  async function downloadZip() {
    if (!batchItems.length) return;
    setErr("");
    try {
      const zip = new window.JSZip();
      batchItems.forEach((it) => zip.file(it.name, it.url.split(",")[1], { base64: true }));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      download(url, "barcode-batch.zip");
      setTimeout(() => URL.revokeObjectURL(url), 8000);
    } catch (e: any) {
      setErr("Gagal membuat ZIP: " + (e?.message || String(e)));
    }
  }

  const setQ = (patch: Partial<typeof qr>) => setQr((q) => ({ ...q, ...patch }));
  const setB = (patch: Partial<typeof bar>) => setBar((b) => ({ ...b, ...patch }));
  const setL = (patch: Partial<typeof logoOpts>) => setLogoOpts((l) => ({ ...l, ...patch }));

  /* ================= UI ================= */
  return (
    <>
      {/* ============ CONTROLS ============ */}
      <div>
        <div className="tabs" role="tablist">
          <button className={mode === "qr" ? "active" : ""} onClick={() => setMode("qr")}>QR Code</button>
          <button className={mode === "bar" ? "active" : ""} onClick={() => setMode("bar")}>Barcode 1D</button>
          <button className={mode === "batch" ? "active" : ""} onClick={() => setMode("batch")}>Batch</button>
        </div>
        <div className={`err ${err ? "show" : ""}`}>{err}</div>
        <div className={`okmsg ${ok ? "show" : ""}`}>{ok}</div>

        {mode === "qr" && (
          <>
            <div className="card">
              <h2>Isi QR Code</h2>
              <div className="field">
                <label>Jenis isi</label>
                <div className="chips">
                  <button
                    className={`chip ${qr.kind === "link" ? "on" : ""}`}
                    onClick={() => setQ({ kind: "link" })}
                  >
                    Link
                  </button>
                  <button
                    className={`chip ${qr.kind === "text" ? "on" : ""}`}
                    onClick={() => setQ({ kind: "text" })}
                  >
                    Tulisan
                  </button>
                </div>
              </div>
              {qr.kind === "link" ? (
                <div className="field">
                  <label>Alamat link</label>
                  <input
                    type="text"
                    value={qr.text}
                    onChange={(e) => setQ({ text: e.target.value })}
                    placeholder="https://tokosaya.com"
                  />
                  <div className="hint">Discan langsung membuka link. Contoh: https://tokosaya.com</div>
                  <div className="chips">
                    <button className="chip" onClick={() => setQ({ text: "https://wa.me/62" })}>WhatsApp</button>
                    <button className="chip" onClick={() => setQ({ text: "WIFI:T:WPA;S:NamaWiFi;P:password;;" })}>WiFi</button>
                  </div>
                </div>
              ) : (
                <div className="field">
                  <label>Tulisan</label>
                  <textarea
                    value={qr.text}
                    onChange={(e) => setQ({ text: e.target.value })}
                    placeholder="Ketik tulisan di sini..."
                  />
                  <div className="hint">Tulisan bebas — discan langsung tampil sebagai teks.</div>
                </div>
              )}
              <div className="row2">
                <div className="field">
                  <label>Koreksi error</label>
                  <select value={qr.ec} onChange={(e) => setQ({ ec: e.target.value })}>
                    <option value="L">L — rendah</option>
                    <option value="M">M — sedang</option>
                    <option value="Q">Q — tinggi</option>
                    <option value="H">H — maksimal</option>
                  </select>
                </div>
                <div className="field">
                  <label>Ukuran ekspor</label>
                  <select value={qr.size} onChange={(e) => setQ({ size: e.target.value })}>
                    <option value="512">512 px</option>
                    <option value="1024">1024 px</option>
                    <option value="2048">2048 px</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Zona tenang (margin) — <b>{qr.quiet}</b> modul</label>
                <input type="range" min={0} max={10} value={qr.quiet} onChange={(e) => setQ({ quiet: parseInt(e.target.value, 10) })} />
              </div>
            </div>

            <div className="card">
              <h2>Warna &amp; Latar</h2>
              <div className="field">
                <label>Latar</label>
                <div className="chips">
                  <button
                    className={`chip ${!qr.transparent ? "on" : ""}`}
                    onClick={() => setQ({ transparent: false })}
                  >
                    Berwarna
                  </button>
                  <button
                    className={`chip ${qr.transparent ? "on" : ""}`}
                    onClick={() => setQ({ transparent: true })}
                  >
                    Transparan
                  </button>
                </div>
                <div className="hint">
                  Transparan: background dihilangkan total (file PNG), cocok ditempel ke desain/kemasan.
                </div>
              </div>
              <div className="row2">
                <div className="field"><label>Warna kode</label><input type="color" value={qr.fg} onChange={(e) => setQ({ fg: e.target.value })} /></div>
                {!qr.transparent && (
                  <div className="field"><label>Warna latar</label><input type="color" value={qr.bg} onChange={(e) => setQ({ bg: e.target.value })} /></div>
                )}
              </div>
            </div>

            <div className="card">
              <h2>Logo di Tengah</h2>
              <div
                className={`drop ${dragOver ? "over" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleLogoFile(f);
                }}
              >
                <b>Klik / seret logo ke sini</b><br />PNG atau JPG, disarankan kotak &amp; kontras
              </div>
              <input
                ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoFile(f);
                  e.target.value = "";
                }}
              />
              {logo && (
                <div className="logoPrev">
                  <img src={logo.dataUrl} alt="logo" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{logo.name}</div>
                    <button className="linklike" onClick={() => setLogo(null)}>Hapus logo</button>
                  </div>
                </div>
              )}
              {logo && (
                <div style={{ marginTop: 14 }}>
                  <div className="field">
                    <label>Ukuran logo — <b>{logoOpts.pct}</b>%</label>
                    <input type="range" min={10} max={40} value={logoOpts.pct} onChange={(e) => setL({ pct: parseInt(e.target.value, 10) })} />
                  </div>
                  <div className="field">
                    <label>Bantalan putih — <b>{logoOpts.pad}</b> px</label>
                    <input type="range" min={0} max={30} value={logoOpts.pad} onChange={(e) => setL({ pad: parseInt(e.target.value, 10) })} />
                  </div>
                  <div className="field">
                    <label>Lengkung sudut — <b>{logoOpts.rad}</b>%</label>
                    <input type="range" min={0} max={50} value={logoOpts.rad} onChange={(e) => setL({ rad: parseInt(e.target.value, 10) })} />
                  </div>
                  <label className="check">
                    <input type="checkbox" checked={logoOpts.noWhite} onChange={(e) => setL({ noWhite: e.target.checked })} />
                    <span><b>Hapus putih pada logo</b> — background putih logo jadi transparan</span>
                  </label>
                  {user && (
                    <div style={{ marginTop: 10 }}>
                      <button className="btn ghost small" onClick={saveLogoToAccount}>Simpan logo ke akun</button>
                    </div>
                  )}
                </div>
              )}
              {user && savedLogos.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Logo tersimpan</label>
                  <div className="savedlogo">
                    {savedLogos.map((sl) => (
                      <button key={sl.id} title={sl.name}
                        onClick={() => setLogoFromDataUrl(sl.dataUrl, sl.name)}
                        onContextMenu={(e) => { e.preventDefault(); if (confirm(`Hapus logo "${sl.name}"?`)) deleteSavedLogo(sl.id); }}>
                        <img src={sl.dataUrl} alt={sl.name} />
                        <span>{sl.name.length > 14 ? sl.name.slice(0, 14) + "…" : sl.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="hint" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    Klik untuk pakai · klik kanan untuk menghapus
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {mode === "bar" && (
          <>
            <div className="card">
              <h2>Isi Barcode</h2>
              <div className="field">
                <label>Format</label>
                <select value={bar.format} onChange={(e) => setB({ format: e.target.value })}>
                  <option value="CODE128">CODE128 — umum / teks bebas</option>
                  <option value="CODE128A">CODE128A</option>
                  <option value="CODE128B">CODE128B</option>
                  <option value="CODE128C">CODE128C — angka genap</option>
                  <option value="EAN13">EAN-13 — produk retail</option>
                  <option value="EAN8">EAN-8</option>
                  <option value="UPC">UPC-A</option>
                  <option value="UPCE">UPC-E</option>
                  <option value="CODE39">CODE39</option>
                  <option value="ITF14">ITF-14 — karton</option>
                  <option value="MSI">MSI</option>
                  <option value="pharmacode">Pharmacode</option>
                  <option value="codabar">Codabar</option>
                </select>
              </div>
              <div className="field">
                <label>Nilai</label>
                <input type="text" value={bar.text} onChange={(e) => setB({ text: e.target.value })} placeholder="cth: 8991234567891" />
                <div className="hint">EAN-13 butuh 12–13 digit angka. CODE128 bebas huruf &amp; angka.</div>
              </div>
              <div className="row2">
                <div className="field">
                  <label>Lebar bar — <b>{bar.width}</b></label>
                  <input type="range" min={1} max={4} step={0.5} value={bar.width} onChange={(e) => setB({ width: parseFloat(e.target.value) })} />
                </div>
                <div className="field">
                  <label>Tinggi — <b>{bar.height}</b> px</label>
                  <input type="range" min={40} max={200} value={bar.height} onChange={(e) => setB({ height: parseInt(e.target.value, 10) })} />
                </div>
              </div>
              <label className="check">
                <input type="checkbox" checked={bar.displayValue} onChange={(e) => setB({ displayValue: e.target.checked })} />
                Tampilkan teks di bawah barcode
              </label>
            </div>

            <div className="card">
              <h2>Warna &amp; Latar</h2>
              <div className="field">
                <label>Latar</label>
                <div className="chips">
                  <button
                    className={`chip ${!bar.transparent ? "on" : ""}`}
                    onClick={() => setB({ transparent: false })}
                  >
                    Berwarna
                  </button>
                  <button
                    className={`chip ${bar.transparent ? "on" : ""}`}
                    onClick={() => setB({ transparent: true })}
                  >
                    Transparan
                  </button>
                </div>
                <div className="hint">
                  Transparan: background dihilangkan total (file PNG), cocok ditempel ke desain/kemasan.
                </div>
              </div>
              <div className="row2">
                <div className="field"><label>Warna bar</label><input type="color" value={bar.fg} onChange={(e) => setB({ fg: e.target.value })} /></div>
                {!bar.transparent && (
                  <div className="field"><label>Warna latar</label><input type="color" value={bar.bg} onChange={(e) => setB({ bg: e.target.value })} /></div>
                )}
              </div>
            </div>
          </>
        )}

        {mode === "batch" && (
          <div className="card">
            <h2>Batch — banyak sekaligus</h2>
            <div className="field">
              <label>Jenis kode</label>
              <div className="chips">
                <button className={`chip ${batchKind === "qr" ? "on" : ""}`} onClick={() => setBatchKind("qr")}>QR Code</button>
                <button className={`chip ${batchKind === "bar" ? "on" : ""}`} onClick={() => setBatchKind("bar")}>Barcode 1D</button>
              </div>
              <div className="hint">Memakai pengaturan warna &amp; ukuran dari tab QR / Barcode.</div>
            </div>
            <div className="field">
              <label>Satu nilai per baris (maks 200)</label>
              <textarea rows={6} value={batchText} onChange={(e) => setBatchText(e.target.value)}
                placeholder={"https://tokosaya.com/produk-1\nhttps://tokosaya.com/produk-2\n899100000001"} />
            </div>
            <div className="btnrow">
              <button className="btn ghost" onClick={runBatch}>Buat pratinjau</button>
              <button className="btn accent" onClick={downloadZip} disabled={!batchItems.length}>Download ZIP</button>
            </div>
            <div className="batchgrid">
              {batchItems.map((it) => (
                <div className="cell" key={it.name}>
                  <img src={it.url} alt={it.name} />
                  <div className="cap">{it.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============ PREVIEW ============ */}
      <div className="preview">
        <div className="card">
          <h2>Hasil</h2>
          <div className={`stage ${checker ? "checker" : ""}`}>
            <canvas ref={canvasRef} style={{ display: showCanvas ? "block" : "none" }} />
            {!showCanvas && isEmpty && (
              <div className="empty">Isi teks / nilai dulu,<br />hasilnya muncul di sini.</div>
            )}
          </div>
          <div className="meta"><span>{dimInfo}</span><span>PNG resolusi penuh</span></div>
          {mode !== "batch" && (
            <div className="btnrow" style={{ marginBottom: 10 }}>
              <button className="btn ghost" onClick={saveHistory} disabled={saving}>
                {saving ? "Menyimpan…" : user ? "Simpan ke riwayat" : "Masuk untuk menyimpan"}
              </button>
            </div>
          )}
          <div className="btnrow">
            <button className="btn accent" onClick={downloadPng}>Download PNG</button>
            <button className="btn ghost" onClick={downloadSvg}>Download SVG</button>
          </div>
        </div>
        <div className="card">
          <div className="kv"><span>Format file</span><b>PNG / SVG vektor</b></div>
          <div className="kv"><span>Background transparan</span><b>didukung</b></div>
          <div className="kv"><span>Logo tengah QR</span><b>didukung</b></div>
          <div className="kv"><span>Batch + ZIP</span><b>didukung</b></div>
          <div className="kv"><span>Riwayat per akun</span><b>{user ? "aktif" : "masuk dulu"}</b></div>
        </div>
      </div>
    </>
  );
}
