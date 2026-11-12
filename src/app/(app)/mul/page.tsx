import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { fechaHora, money } from "@/lib/money";

const ESTADO_TONE = { cursada: "warn", apelada: "info", confirmada: "danger", anulada: "neutral" } as const;

async function cursar(formData: FormData) {
  "use server";
  const perfil = await requireVista("mul");
  const unidad_id = String(formData.get("unidad_id") ?? "");
  const infraccion = String(formData.get("infraccion") ?? "").trim();
  const detalle = String(formData.get("detalle") ?? "").trim() || null;
  const monto = Number(formData.get("monto") ?? 0);

  if (!unidad_id || !infraccion || monto <= 0) {
    redirect("/mul?error=" + encodeURIComponent("Completa unidad, infracción y monto."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("multas").insert({
    condominio_id: perfil.condominioId,
    unidad_id,
    folio: `MU-${Date.now()}`,
    infraccion,
    detalle,
    monto,
    cursada_por: perfil.userId,
  });

  if (error) redirect("/mul?error=" + encodeURIComponent("No se pudo cursar la multa."));
  revalidatePath("/mul");
  redirect("/mul");
}

async function apelar(formData: FormData) {
  "use server";
  await requireVista("mul");
  const id = String(formData.get("id"));
  const apelacion = String(formData.get("apelacion") ?? "").trim();
  if (!apelacion) redirect("/mul?error=" + encodeURIComponent("Indica el motivo de la apelación."));

  const supabase = await createClient();
  const { error } = await supabase.from("multas").update({ estado: "apelada", apelacion }).eq("id", id);
  if (error) redirect("/mul?error=" + encodeURIComponent("No se pudo apelar la multa."));
  revalidatePath("/mul");
  redirect("/mul");
}

async function resolver(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const estado = String(formData.get("estado")) as "confirmada" | "anulada";
  const resolucion = String(formData.get("resolucion") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.rpc("multa_resolver", { m: id, p_estado: estado, p_resolucion: resolucion });
  if (error) redirect("/mul?error=" + encodeURIComponent(error.message));
  revalidatePath("/mul");
  redirect("/mul");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("mul");
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: multas }, { data: unidades }] = await Promise.all([
    supabase
      .from("multas")
      .select("id, folio, infraccion, detalle, monto, estado, apelacion, resolucion, ts, unidades(codigo)")
      .eq("condominio_id", perfil.condominioId)
      .order("ts", { ascending: false }),
    supabase.from("unidades").select("id, codigo").eq("condominio_id", perfil.condominioId).order("codigo"),
  ]);

  const puedeCursar = perfil.rol === "administrador" || perfil.rol === "conserje";
  const esComite = perfil.rol === "comite";
  const esCoprop = perfil.rol === "copropietario";

  return (
    <>
      <PageHeader
        title="Multas"
        subtitle="Multas cursadas, apeladas y resueltas. Una multa anulada no es exigible y aparece tachada en el estado de cuenta."
        nota={esComite ? "resuelves apelaciones." : esCoprop ? "puedes apelar tus multas." : "cursas multas por infracciones."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Multas</div>
          {!multas || multas.length === 0 ? (
            <Empty>No hay multas registradas.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Folio</Th>
                  <Th>Unidad</Th>
                  <Th>Infracción</Th>
                  <Th>Monto</Th>
                  <Th>Estado</Th>
                  <Th>Acción</Th>
                </tr>
              </thead>
              <tbody>
                {multas.map((m) => (
                  <tr key={m.id}>
                    <Td className="font-medium text-ink-2">{m.folio}</Td>
                    <Td>{(m.unidades as unknown as { codigo: string } | null)?.codigo ?? "—"}</Td>
                    <Td>
                      <div className={m.estado === "anulada" ? "line-through" : ""}>{m.infraccion}</div>
                      {m.detalle && <div className="text-[11px] text-ink-5">{m.detalle}</div>}
                    </Td>
                    <Td>{money(m.monto)}</Td>
                    <Td>
                      <Badge tone={ESTADO_TONE[m.estado as keyof typeof ESTADO_TONE]}>{m.estado}</Badge>
                    </Td>
                    <Td>
                      {esCoprop && m.estado === "cursada" && (
                        <details>
                          <summary className="cursor-pointer list-none text-[12px] font-semibold text-blue-text">Apelar</summary>
                          <form action={apelar} className="absolute z-20 mt-2 flex w-[260px] flex-col gap-2 rounded-card border border-border-strong bg-surface p-3 shadow-[0_18px_44px_-16px_rgba(24,27,31,.3)]">
                            <input type="hidden" name="id" value={m.id} />
                            <Textarea name="apelacion" rows={3} placeholder="Motivo de la apelación" required />
                            <Button type="submit" className="text-[11px]">Enviar apelación</Button>
                          </form>
                        </details>
                      )}
                      {esComite && m.estado === "apelada" && (
                        <details>
                          <summary className="cursor-pointer list-none text-[12px] font-semibold text-blue-text">Resolver</summary>
                          <form action={resolver} className="absolute z-20 mt-2 flex w-[260px] flex-col gap-2 rounded-card border border-border-strong bg-surface p-3 shadow-[0_18px_44px_-16px_rgba(24,27,31,.3)]">
                            <input type="hidden" name="id" value={m.id} />
                            <div className="text-[11px] text-ink-5">Apelación: {m.apelacion}</div>
                            <Textarea name="resolucion" rows={2} placeholder="Resolución" required />
                            <div className="flex gap-2">
                              <Button type="submit" name="estado" value="confirmada" className="flex-1 text-[11px]">
                                Confirmar
                              </Button>
                              <Button type="submit" name="estado" value="anulada" variant="danger" className="flex-1 text-[11px]">
                                Anular
                              </Button>
                            </div>
                          </form>
                        </details>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {puedeCursar && (
          <Card>
            <div className="mb-4 text-[13px] font-semibold text-ink-2">Cursar multa</div>
            <form action={cursar} className="flex flex-col gap-4">
              <Field label="Unidad">
                <Select name="unidad_id" required>
                  <option value="">Selecciona…</option>
                  {(unidades ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.codigo}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Infracción">
                <Input name="infraccion" required placeholder="Ej. Ruidos molestos" />
              </Field>
              <Field label="Detalle (opcional)">
                <Textarea name="detalle" rows={2} />
              </Field>
              <Field label="Monto">
                <Input name="monto" type="number" min={1} required />
              </Field>
              <Button type="submit">Cursar multa</Button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
