import { redirect } from "next/navigation";
import { getPerfilActual } from "@/lib/perfil";
import { puedeAcceder, INICIO_POR_ROL } from "@/lib/permisos";

/** Carga el perfil y redirige a la vista de inicio del rol si no tiene permiso sobre `ruta`. */
export async function requireVista(ruta: string) {
  const perfil = await getPerfilActual();
  if (!puedeAcceder(perfil.rol, ruta)) {
    redirect(INICIO_POR_ROL[perfil.rol]);
  }
  return perfil;
}
