import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Th } from "@/components/ui";
import { fechaHora } from "@/lib/money";

async function registrarAcceso(formData: FormData) {
  "use server";
  await requireVista("acc");
  const turno_id = String(formData.get("turno_id"));
  const puerta = String(formData.get("puerta"));
  const supabase = await createClient();
  await supabase.from("accesos").insert({ turno_id, folio: `AC-${Date.now()}`, puerta });
  revalidatePath("/acc");
  redirect("/acc");
}

async function ingresoVehiculo(formData: FormData) {
  "use server";
  await requireVista("acc");
  const turno_id = String(formData.get("turno_id"));
  const patente = String(formData.get("patente") ?? "").trim().toUpperCase();
  const tipo = String(formData.get("tipo") ?? "Visita");
  const detalle = String(formData.get("detalle") ?? "").trim() || null;
  if (!patente) redirect("/acc?error=" + encodeURIComponent("Ingresa la patente."));
  const supabase = await createClient();
  await supabase.from("vehiculos").insert({ turno_id, folio: `VH-${Date.now()}`, patente, tipo, detalle });
  revalidatePath("/acc");
  redirect("/acc");
}

async function salidaVehiculo(formData: FormData) {
  "use server";
  await requireVista("acc");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("vehiculos").update({ salida: new Date().toISOString() }).eq("id", id);
  revalidatePath("/acc");
  redirect("/acc");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("acc");
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: turno } = await supabase
    .from("turnos")
    .select("id")
    .eq("condominio_id", perfil.condominioId)
    .is("fin", null)
    .maybeSingle();

  const [{ data: accesos }, { data: vehiculos }] = turno
    ? await Promise.all([
        supabase.from("accesos").select("id, puerta, ts").eq("turno_id", turno.id).order("ts", { ascending: false }).limit(20),
        supabase.from("vehiculos").select("id, patente, tipo, detalle, entrada, salida").eq("turno_id", turno.id).order("entrada", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <>
      <PageHeader
        title="Control de acceso"
        subtitle="Registro de accesos al portón vehicular, puerta peatonal y bodegas, y de vehículos en turno."
        nota={perfil.rol === "conserje" ? "registras tú los accesos." : "vista de solo lectura."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      {!turno ? (
        <Empty>No hay un turno abierto. Los accesos se registran durante un turno de conserjería.</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-5">
            {perfil.rol === "conserje" && (
              <Card>
                <div className="mb-4 text-[13px] font-semibold text-ink-2">Registrar acceso</div>
                <div className="flex flex-col gap-2">
                  {["Portón vehicular", "Puerta peatonal", "Bodegas"].map((p) => (
                    <form action={registrarAcceso} key={p}>
                      <input type="hidden" name="turno_id" value={turno.id} />
                      <input type="hidden" name="puerta" value={p} />
                      <Button type="submit" variant="secondary" className="w-full justify-start">
                        {p}
                      </Button>
                    </form>
                  ))}
                </div>
              </Card>
            )}

            {perfil.rol === "conserje" && (
              <Card>
                <div className="mb-4 text-[13px] font-semibold text-ink-2">Ingreso de vehículo</div>
                <form action={ingresoVehiculo} className="flex flex-col gap-3">
                  <input type="hidden" name="turno_id" value={turno.id} />
                  <Field label="Patente">
                    <Input name="patente" required />
                  </Field>
                  <Field label="Tipo">
                    <Select name="tipo" defaultValue="Visita">
                      <option>Residente</option>
                      <option>Visita</option>
                      <option>Proveedor</option>
                    </Select>
                  </Field>
                  <Field label="Detalle (opcional)">
                    <Input name="detalle" />
                  </Field>
                  <Button type="submit">Registrar ingreso</Button>
                </form>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <Card>
              <div className="mb-4 text-[13px] font-semibold text-ink-2">Últimos accesos</div>
              {!accesos || accesos.length === 0 ? (
                <Empty>Sin accesos registrados en este turno.</Empty>
              ) : (
                <ul className="flex flex-col gap-2">
                  {accesos.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-[12.5px]">
                      <span className="text-ink-2">{a.puerta}</span>
                      <span className="text-ink-5">{fechaHora(a.ts)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="mb-4 text-[13px] font-semibold text-ink-2">Vehículos en el condominio</div>
              {!vehiculos || vehiculos.length === 0 ? (
                <Empty>Sin vehículos registrados en este turno.</Empty>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Patente</Th>
                      <Th>Tipo</Th>
                      <Th>Entrada</Th>
                      <Th>Salida</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculos.map((v) => (
                      <tr key={v.id}>
                        <Td className="font-medium text-ink-2">{v.patente}</Td>
                        <Td>{v.tipo}</Td>
                        <Td>{fechaHora(v.entrada)}</Td>
                        <Td>
                          {v.salida ? (
                            fechaHora(v.salida)
                          ) : perfil.rol === "conserje" ? (
                            <form action={salidaVehiculo}>
                              <input type="hidden" name="id" value={v.id} />
                              <Button type="submit" variant="secondary" className="text-[11px]">
                                Marcar salida
                              </Button>
                            </form>
                          ) : (
                            "—"
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
