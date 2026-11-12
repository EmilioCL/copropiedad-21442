import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, DetailsModal, Empty, Field, FormError, Input, Select, Table, Td, Th } from "@/components/ui";
import { fechaHora } from "@/lib/money";

async function recibir(formData: FormData) {
  "use server";
  await requireVista("enc");
  const turno_id = String(formData.get("turno_id"));
  const unidad_id = String(formData.get("unidad_id"));
  const tipo = String(formData.get("tipo") ?? "Paquete");
  const remitente = String(formData.get("remitente") ?? "").trim() || null;
  const detalle = String(formData.get("detalle") ?? "").trim() || null;

  if (!unidad_id) redirect("/enc?error=" + encodeURIComponent("Selecciona la unidad destino."));

  const supabase = await createClient();
  await supabase.from("encomiendas").insert({
    turno_id,
    folio: `EN-${Date.now()}`,
    tipo,
    unidad_id,
    remitente,
    detalle,
  });
  revalidatePath("/enc");
  redirect("/enc");
}

async function entregar(formData: FormData) {
  "use server";
  await requireVista("enc");
  const id = String(formData.get("id"));
  const retirada_por = String(formData.get("retirada_por") ?? "").trim() || null;
  const supabase = await createClient();
  await supabase.from("encomiendas").update({ entregada: new Date().toISOString(), retirada_por }).eq("id", id);
  revalidatePath("/enc");
  redirect("/enc");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("enc");
  const { error } = await searchParams;
  const supabase = await createClient();
  const esConserje = perfil.rol === "conserje";

  const [{ data: turno }, { data: unidades }] = await Promise.all([
    supabase.from("turnos").select("id").eq("condominio_id", perfil.condominioId).is("fin", null).maybeSingle(),
    esConserje ? supabase.from("unidades").select("id, codigo").eq("condominio_id", perfil.condominioId).order("codigo") : Promise.resolve({ data: [] }),
  ]);

  const { data: encomiendas } = await supabase
    .from("encomiendas")
    .select("id, folio, tipo, remitente, detalle, recibida, entregada, retirada_por, unidades(codigo)")
    .order("recibida", { ascending: false })
    .limit(30);

  return (
    <>
      <PageHeader
        title="Encomiendas"
        subtitle="Encomiendas recibidas y entregadas por unidad."
        nota={esConserje ? "registras recepción y entrega." : perfil.rol === "copropietario" ? "ves tus encomiendas." : "vista de solo lectura."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Encomiendas</div>
          {!encomiendas || encomiendas.length === 0 ? (
            <Empty>No hay encomiendas registradas.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Unidad</Th>
                  <Th>Tipo</Th>
                  <Th>Recibida</Th>
                  <Th>Estado</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {encomiendas.map((e) => (
                  <tr key={e.id}>
                    <Td className="font-medium text-ink-2">{(e.unidades as unknown as { codigo: string } | null)?.codigo}</Td>
                    <Td>{e.tipo}</Td>
                    <Td>{fechaHora(e.recibida)}</Td>
                    <Td>
                      <Badge tone={e.entregada ? "success" : "warn"}>{e.entregada ? "Entregada" : "Pendiente"}</Badge>
                    </Td>
                    <Td>
                      {esConserje && !e.entregada && (
                        <details>
                          <summary className="cursor-pointer list-none text-[12px] font-semibold text-blue-text">Entregar</summary>
                          <DetailsModal width="260px">
                            <form action={entregar} className="flex flex-col gap-2">
                              <input type="hidden" name="id" value={e.id} />
                              <Input name="retirada_por" placeholder="Retirada por" />
                              <Button type="submit" className="text-[11px]">Confirmar entrega</Button>
                            </form>
                          </DetailsModal>
                        </details>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {esConserje && (
          <Card>
            <div className="mb-4 text-[13px] font-semibold text-ink-2">Recibir encomienda</div>
            {!turno ? (
              <Empty>Abre un turno para registrar encomiendas.</Empty>
            ) : (
              <form action={recibir} className="flex flex-col gap-4">
                <input type="hidden" name="turno_id" value={turno.id} />
                <Field label="Unidad destino">
                  <Select name="unidad_id" required>
                    <option value="">Selecciona…</option>
                    {(unidades ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.codigo}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Tipo">
                  <Select name="tipo" defaultValue="Paquete">
                    <option>Paquete</option>
                    <option>Correspondencia</option>
                    <option>Comida</option>
                    <option>Otro</option>
                  </Select>
                </Field>
                <Field label="Remitente (opcional)">
                  <Input name="remitente" />
                </Field>
                <Field label="Detalle (opcional)">
                  <Input name="detalle" />
                </Field>
                <Button type="submit">Registrar recepción</Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
