import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Empty, Table, Td, Th } from "@/components/ui";
import { fecha } from "@/lib/money";

export default async function Page() {
  const perfil = await requireVista("per");
  const supabase = await createClient();

  const { data: conserjes } = await supabase
    .from("trabajadores")
    .select("id, nombre, telefono, jornada, activo, desde, user_id")
    .eq("condominio_id", perfil.condominioId)
    .ilike("cargo", "%conserje%")
    .order("desde", { ascending: false });

  return (
    <>
      <PageHeader
        title="Personal de conserjería"
        subtitle="Conserjes habilitados para operar los turnos del condominio."
        nota="el acceso al sistema de cada conserje se vincula desde Supabase Auth."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {!conserjes || conserjes.length === 0 ? (
        <Empty>No hay personal de conserjería registrado. Agrégalo en “Trabajadores”.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Jornada</Th>
              <Th>Desde</Th>
              <Th>Estado</Th>
              <Th>Acceso al sistema</Th>
            </tr>
          </thead>
          <tbody>
            {conserjes.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium text-ink-2">{c.nombre}</Td>
                <Td>{c.jornada ?? "—"}</Td>
                <Td>{fecha(c.desde)}</Td>
                <Td>
                  <Badge tone={c.activo ? "success" : "neutral"}>{c.activo ? "Activo" : "Suspendido"}</Badge>
                </Td>
                <Td>
                  <Badge tone={c.user_id ? "success" : "warn"}>{c.user_id ? "Habilitado" : "Sin cuenta"}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
