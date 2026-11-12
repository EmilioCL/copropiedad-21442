import { requireVista } from "@/lib/guard";
import { PageHeader, VistaEnConstruccion } from "@/components/page-header";

export default async function Page() {
  const perfil = await requireVista("esp");

  return (
    <>
      <PageHeader
        title="Espacios comunes"
        subtitle="Reserva de espacios comunes por fecha y bloque horario."
        nota="acceso limitado a las facultades de tu perfil."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />
      <VistaEnConstruccion />
    </>
  );
}
