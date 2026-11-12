import type { ReactNode } from "react";
import { getPerfilActual } from "@/lib/perfil";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const perfil = await getPerfilActual();

  return (
    <div className="flex h-dvh overflow-hidden bg-app-bg">
      <Sidebar rol={perfil.rol} nombre={perfil.nombre} />
      <main className="min-w-0 flex-1 overflow-y-auto px-7 py-7">{children}</main>
    </div>
  );
}
