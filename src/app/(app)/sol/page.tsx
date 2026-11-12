import { requireVista } from "@/lib/guard";
import { PageHeader, VistaEnConstruccion } from "@/components/page-header";

export default async function Page() {
  const perfil = await requireVista("sol");

  return (
    <>
      <PageHeader
        title="Repactar mi deuda"
        subtitle="Propón un convenio de pago para la deuda de tu unidad."
        nota="acceso limitado a las facultades de tu perfil."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />
      <VistaEnConstruccion />
    </>
  );
}
