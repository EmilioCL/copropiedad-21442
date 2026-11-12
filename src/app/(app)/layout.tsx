import type { ReactNode } from "react";
import { getPerfilActual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const perfil = await getPerfilActual();
  const supabase = await createClient();
  const { count } = await supabase
    .from("unidades")
    .select("id", { count: "exact", head: true })
    .eq("condominio_id", perfil.condominioId);

  return (
    <div className="flex h-dvh overflow-hidden bg-app-bg">
      <Sidebar rol={perfil.rol} nombre={perfil.nombre} unidades={count ?? 0} />
      <main className="min-w-0 flex-1 overflow-y-auto px-7 py-7">{children}</main>
    </div>
  );
}
