import { requireVista } from "@/lib/guard";
import { PageHeader, VistaEnConstruccion } from "@/components/page-header";

export default async function Page() {
  const perfil = await requireVista("per");

  return (
    <>
      <PageHeader
        title="Personal de conserjería"
        subtitle="Conserjes habilitados para operar los turnos."
        nota="acceso limitado a las facultades de tu perfil."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />
      <VistaEnConstruccion />
    </>
  );
}
