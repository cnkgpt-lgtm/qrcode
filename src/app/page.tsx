import { Suspense } from "react";
import BarcodeStudio from "@/components/BarcodeStudio";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const u = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;
  const user = u?.id ? { id: u.id, name: u.name ?? null, email: u.email ?? null } : null;
  return (
    <main>
      <div className="wrap">
        <Suspense>
          <BarcodeStudio user={user} />
        </Suspense>
      </div>
    </main>
  );
}
