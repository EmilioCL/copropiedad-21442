import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Th } from "@/components/ui";
import { fecha, porcentaje } from "@/lib/money";

const QUORUM: Record<string, { primera: number; segunda: number }> = {
  Ordinaria: { primera: 60, segunda: 30 },
  Extraordinaria: { primera: 80, segunda: 60 },
};

async function convocar(formData: FormData) {
  "use server";
  const perfil = await requireVista("asam");
  const tipo = String(formData.get("tipo") ?? "Ordinaria");
  const citacion = String(formData.get("citacion") ?? "Primera");
  const fecha_a = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const lugar = String(formData.get("lugar") ?? "").trim();

  if (!fecha_a || !hora || !lugar) {
    redirect("/asam?error=" + encodeURIComponent("Completa fecha, hora y lugar."));
  }

  const quorum_requerido = QUORUM[tipo][citacion === "Primera" ? "primera" : "segunda"];
  const folio = `${perfil.rol === "comite" ? "AC" : "AS"}-${Date.now()}`;

  const supabase = await createClient();
  const { error } = await supabase.from("asambleas").insert({
    condominio_id: perfil.condominioId,
    folio,
    tipo: tipo as "Ordinaria" | "Extraordinaria",
    citacion: citacion as "Primera" | "Segunda",
    fecha: fecha_a,
    hora,
    lugar,
    convocante: perfil.rol as "administrador" | "comite",
    quorum_requerido,
  });

  if (error) redirect("/asam?error=" + encodeURIComponent("No se pudo convocar la asamblea."));
  revalidatePath("/asam");
  redirect("/asam");
}

async function validar(formData: FormData) {
  "use server";
  await requireVista("asam");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("asamblea_validar", { a: id });
  if (error) redirect("/asam?error=" + encodeURIComponent(error.message));
  revalidatePath("/asam");
  redirect("/asam");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("asam");
  const { error } = await searchParams;
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";

  const { data: asambleas } = await supabase
    .from("asambleas")
    .select("id, folio, tipo, citacion, fecha, hora, lugar, convocante, quorum_requerido, derechos_habiles, validada")
    .eq("condominio_id", perfil.condominioId)
    .order("fecha", { ascending: false });

  return (
    <>
      <PageHeader
        title="Convocatoria de asamblea"
        subtitle="Citaciones y quórum. El administrador debe validar la habilidad de voto antes de emitir la citación; el comité puede convocar sin validar."
        nota={esAdmin ? "puedes convocar y validar." : "puedes convocar sin validar la habilidad."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Asambleas citadas</div>
          {!asambleas || asambleas.length === 0 ? (
            <Empty>No hay asambleas citadas.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Folio</Th>
                  <Th>Tipo</Th>
                  <Th>Fecha</Th>
                  <Th>Quórum</Th>
                  <Th>Estado</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {asambleas.map((a) => (
                  <tr key={a.id}>
                    <Td className="font-medium text-ink-2">{a.folio}</Td>
                    <Td>
                      {a.tipo} · {a.citacion}
                    </Td>
                    <Td>
                      {fecha(a.fecha)} {a.hora}
                    </Td>
                    <Td>{a.quorum_requerido}%</Td>
                    <Td>
                      {a.validada ? (
                        <Badge tone="success">Validada · {porcentaje(a.derechos_habiles)} hábiles</Badge>
                      ) : (
                        <Badge tone="neutral">Por validar</Badge>
                      )}
                    </Td>
                    <Td>
                      {esAdmin && !a.validada && (
                        <form action={validar}>
                          <input type="hidden" name="id" value={a.id} />
                          <Button type="submit" variant="secondary" className="text-[11px]">
                            Validar
                          </Button>
                        </form>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Convocar asamblea</div>
          <form action={convocar} className="flex flex-col gap-4">
            <Field label="Tipo">
              <Select name="tipo" defaultValue="Ordinaria">
                <option>Ordinaria</option>
                <option>Extraordinaria</option>
              </Select>
            </Field>
            <Field label="Citación">
              <Select name="citacion" defaultValue="Primera">
                <option>Primera</option>
                <option>Segunda</option>
              </Select>
            </Field>
            <Field label="Fecha">
              <Input name="fecha" type="date" required />
            </Field>
            <Field label="Hora">
              <Input name="hora" type="time" required />
            </Field>
            <Field label="Lugar">
              <Input name="lugar" required placeholder="Ej. Sala multiuso" />
            </Field>
            <Button type="submit">Convocar</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
