import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/lib/permisos";

export type PerfilActual = {
  userId: string;
  condominioId: string;
  rol: Rol;
  unidadId: string | null;
  nombre: string;
  email: string | null;
};

/** Perfil (rol + unidad + condominio) de la persona autenticada. Redirige a /acceso si no hay sesión o perfil. */
export async function getPerfilActual(): Promise<PerfilActual> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/acceso");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("condominio_id, rol, unidad_id, nombre")
    .eq("user_id", auth.user.id)
    .single();

  if (!perfil) redirect("/acceso");

  return {
    userId: auth.user.id,
    condominioId: perfil.condominio_id,
    rol: perfil.rol as Rol,
    unidadId: perfil.unidad_id,
    nombre: perfil.nombre,
    email: auth.user.email ?? null,
  };
}
