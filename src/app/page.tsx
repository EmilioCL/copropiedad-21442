import { redirect } from "next/navigation";
import { getPerfilActual } from "@/lib/perfil";
import { INICIO_POR_ROL } from "@/lib/permisos";

export default async function Home() {
  const perfil = await getPerfilActual();
  redirect(INICIO_POR_ROL[perfil.rol]);
}
