import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Middleware berjalan di Edge Runtime -> pakai config yang edge-safe.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/riwayat"],
};
