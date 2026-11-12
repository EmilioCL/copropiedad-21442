import { requireVista } from "@/lib/guard";
import { PageHeader, VistaEnConstruccion } from "@/components/page-header";

export default async function Page() {
  const perfil = await requireVista("turno");

  return (
    <>
      <PageHeader
        title="Mi turno"
        subtitle="Apertura y cierre de turno, con novedades horarias."
        nota="acceso limitado a las facultades de tu perfil."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />
      <VistaEnConstruccion />
    </>
  );
}
