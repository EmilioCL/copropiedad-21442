import { requireVista } from "@/lib/guard";
import { PageHeader, VistaEnConstruccion } from "@/components/page-header";

export default async function Page() {
  const perfil = await requireVista("acc");

  return (
    <>
      <PageHeader
        title="Control de acceso"
        subtitle="Registro de accesos al portón vehicular, puerta peatonal y bodegas."
        nota="acceso limitado a las facultades de tu perfil."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />
      <VistaEnConstruccion />
    </>
  );
}
