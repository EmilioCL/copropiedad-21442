import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, DetailsModal, Empty, Field, FormError, Input, Kpi, Select, Table, Td, Th } from "@/components/ui";
import { money, porcentaje } from "@/lib/money";

type OcupanteT = "Propietario residente" | "Arrendatario" | "Propietario no residente";

type Unidad = {
  id: string;
  codigo: string;
  m2: number;
  propietario: string;
  ocupante: string;
  ocupante_nombre: string | null;
  email: string | null;
  derechos: number;
  deuda: number;
  mora: number;
  habil: boolean;
};

async function crearUnidad(formData: FormData) {
  "use server";
  const perfil = await requireVista("res");
  const codigo = String(formData.get("codigo") ?? "").trim();
  const m2 = Number(formData.get("m2"));
  const propietario = String(formData.get("propietario") ?? "").trim();
  const ocupante = String(formData.get("ocupante") ?? "Propietario residente") as OcupanteT;
  const ocupante_nombre = String(formData.get("ocupante_nombre") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;

  if (!codigo || !propietario || !m2 || m2 <= 0) {
    redirect("/res?error=" + encodeURIComponent("Completa código, m² y propietario."));
  }

  const copropietarioUserId = String(formData.get("copropietario_user_id") ?? "").trim() || null;

  const supabase = await createClient();
  const { data: nueva, error } = await supabase
    .from("unidades")
    .insert({ condominio_id: perfil.condominioId, codigo, m2, propietario, ocupante, ocupante_nombre, email })
    .select("id")
    .single();

  if (error || !nueva) {
    redirect("/res?error=" + encodeURIComponent(error?.message.includes("duplicate") ? `Ya existe la unidad ${codigo}.` : "No se pudo crear la unidad."));
  }

  if (copropietarioUserId) {
    await supabase.from("perfiles").update({ unidad_id: nueva.id }).eq("user_id", copropietarioUserId).eq("condominio_id", perfil.condominioId);
  }

  revalidatePath("/res");
  redirect("/res");
}

async function editarUnidad(formData: FormData) {
  "use server";
  const perfil = await requireVista("res");
  const id = String(formData.get("id"));
  const codigo = String(formData.get("codigo") ?? "").trim();
  const m2 = Number(formData.get("m2"));
  const propietario = String(formData.get("propietario") ?? "").trim();
  const ocupante = String(formData.get("ocupante") ?? "Propietario residente") as OcupanteT;
  const ocupante_nombre = String(formData.get("ocupante_nombre") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const copropietarioUserId = String(formData.get("copropietario_user_id") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("unidades")
    .update({ codigo, m2, propietario, ocupante, ocupante_nombre, email })
    .eq("id", id);

  if (error) {
    redirect("/res?error=" + encodeURIComponent("No se pudo guardar la unidad."));
  }

  if (copropietarioUserId) {
    await supabase.from("perfiles").update({ unidad_id: id }).eq("user_id", copropietarioUserId).eq("condominio_id", perfil.condominioId);
  }

  revalidatePath("/res");
  redirect("/res");
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const perfil = await requireVista("res");
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: coprops } = await supabase
    .from("perfiles")
    .select("user_id, nombre, unidad_id")
    .eq("condominio_id", perfil.condominioId)
    .eq("rol", "copropietario");

  const { data } = await supabase
    .from("v_unidades")
    .select("id, codigo, m2, propietario, ocupante, ocupante_nombre, email, derechos, deuda, mora, habil")
    .eq("condominio_id", perfil.condominioId)
    .order("codigo");

  const unidades = (data ?? []) as Unidad[];
  const totalM2 = unidades.reduce((a, u) => a + u.m2, 0);
  const inhabiles = unidades.filter((u) => !u.habil).length;
  const esAdmin = perfil.rol === "administrador";

  return (
    <>
      <PageHeader
        title="Registro de residentes y unidades"
        subtitle="Unidades, propietarios y ocupantes del condominio. Los derechos se recalculan automáticamente al dar de alta unidades."
        nota={esAdmin ? "puedes crear y editar unidades." : "acceso de solo lectura."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Unidades" value={unidades.length} />
        <Kpi label="M² edificados" value={totalM2.toLocaleString("es-CL")} />
        <Kpi label="Unidades inhábiles" value={inhabiles} accent="var(--color-warn-accent)" />
        <Kpi label="Deuda total" value={money(unidades.reduce((a, u) => a + u.deuda, 0))} accent="var(--color-copper)" />
      </div>

      {error && <div className="mb-4"><FormError>{error}</FormError></div>}

      {unidades.length === 0 ? (
        <Empty>Aún no hay unidades registradas.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Unidad</Th>
              <Th>m²</Th>
              <Th>Derechos</Th>
              <Th>Propietario</Th>
              <Th>Ocupante</Th>
              <Th>Deuda</Th>
              <Th>Hábil</Th>
              {esAdmin && <Th></Th>}
            </tr>
          </thead>
          <tbody>
            {unidades.map((u) => (
              <tr key={u.id}>
                <Td className="font-semibold text-ink-2">{u.codigo}</Td>
                <Td>{u.m2}</Td>
                <Td>{porcentaje(u.derechos)}</Td>
                <Td>{u.propietario}</Td>
                <Td>
                  {u.ocupante}
                  {u.ocupante_nombre ? ` · ${u.ocupante_nombre}` : ""}
                </Td>
                <Td>{u.deuda > 0 ? money(u.deuda) : "—"}</Td>
                <Td>
                  <Badge tone={u.habil ? "success" : "danger"}>{u.habil ? "Hábil" : "Inhábil"}</Badge>
                </Td>
                {esAdmin && (
                  <Td>
                    <details>
                      <summary className="cursor-pointer list-none text-[12px] font-semibold text-blue-text">Editar</summary>
                      <DetailsModal>
                        <form action={editarUnidad} className="flex flex-col gap-3">
                          <input type="hidden" name="id" value={u.id} />
                          <Field label="Código">
                            <Input name="codigo" defaultValue={u.codigo} required />
                          </Field>
                          <Field label="m²">
                            <Input name="m2" type="number" step="0.1" defaultValue={u.m2} required />
                          </Field>
                          <Field label="Propietario">
                            <Input name="propietario" defaultValue={u.propietario} required />
                          </Field>
                          <Field label="Ocupante">
                            <Select name="ocupante" defaultValue={u.ocupante}>
                              <option>Propietario residente</option>
                              <option>Arrendatario</option>
                              <option>Propietario no residente</option>
                            </Select>
                          </Field>
                          <Field label="Nombre del ocupante (si no es el propietario)">
                            <Input name="ocupante_nombre" defaultValue={u.ocupante_nombre ?? ""} />
                          </Field>
                          <Field label="Correo">
                            <Input name="email" type="email" defaultValue={u.email ?? ""} />
                          </Field>
                          <Field label="Cuenta de copropietario vinculada">
                            <Select
                              name="copropietario_user_id"
                              defaultValue={coprops?.find((c) => c.unidad_id === u.id)?.user_id ?? ""}
                            >
                              <option value="">Sin vincular</option>
                              {(coprops ?? [])
                                .filter((c) => !c.unidad_id || c.unidad_id === u.id)
                                .map((c) => (
                                  <option key={c.user_id} value={c.user_id}>
                                    {c.nombre}
                                  </option>
                                ))}
                            </Select>
                          </Field>
                          <Button type="submit">Guardar</Button>
                        </form>
                      </DetailsModal>
                    </details>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {esAdmin && (
        <Card className="mt-6">
          <details>
            <summary className="cursor-pointer list-none text-[13px] font-semibold text-blue-text">+ Nueva unidad</summary>
            <form action={crearUnidad} className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Código (ej. A-101)">
                <Input name="codigo" required />
              </Field>
              <Field label="m²">
                <Input name="m2" type="number" step="0.1" required />
              </Field>
              <Field label="Propietario">
                <Input name="propietario" required />
              </Field>
              <Field label="Ocupante">
                <Select name="ocupante" defaultValue="Propietario residente">
                  <option>Propietario residente</option>
                  <option>Arrendatario</option>
                  <option>Propietario no residente</option>
                </Select>
              </Field>
              <Field label="Nombre del ocupante (si no es el propietario)">
                <Input name="ocupante_nombre" />
              </Field>
              <Field label="Correo">
                <Input name="email" type="email" />
              </Field>
              <Field label="Cuenta de copropietario vinculada (opcional)">
                <Select name="copropietario_user_id" defaultValue="">
                  <option value="">Sin vincular</option>
                  {(coprops ?? [])
                    .filter((c) => !c.unidad_id)
                    .map((c) => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.nombre}
                      </option>
                    ))}
                </Select>
              </Field>
              <div className="col-span-2">
                <Button type="submit">Crear unidad</Button>
              </div>
            </form>
          </details>
        </Card>
      )}
    </>
  );
}
