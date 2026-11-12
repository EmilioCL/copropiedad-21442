import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Empty, Table, Td, Th } from "@/components/ui";
import { fechaHora } from "@/lib/money";

export default async function Page() {
  const perfil = await requireVista("bit");
  const supabase = await createClient();

  const { data: entradas } = await supabase
    .from("bitacora")
    .select("id, actor, accion, ts")
    .eq("condominio_id", perfil.condominioId)
    .order("ts", { ascending: false })
    .limit(200);

  return (
    <>
      <PageHeader
        title="Bitácora de gestión"
        subtitle="Registro de toda operación de negocio del condominio, generado automáticamente por el sistema."
        nota="solo lectura."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {!entradas || entradas.length === 0 ? (
        <Empty>Aún no hay operaciones registradas.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Fecha</Th>
              <Th>Actor</Th>
              <Th>Acción</Th>
            </tr>
          </thead>
          <tbody>
            {entradas.map((e) => (
              <tr key={e.id}>
                <Td className="whitespace-nowrap">{fechaHora(e.ts)}</Td>
                <Td className="capitalize">{e.actor}</Td>
                <Td>{e.accion}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
