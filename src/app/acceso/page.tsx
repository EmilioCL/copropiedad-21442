import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccesoForm } from "@/components/acceso-form";

export default async function AccesoPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  const { data: resumen } = await supabase.rpc("resumen_publico");
  const fila = resumen?.[0];

  return <AccesoForm unidades={fila?.unidades ?? 0} m2={fila?.m2 ?? 0} />;
}
