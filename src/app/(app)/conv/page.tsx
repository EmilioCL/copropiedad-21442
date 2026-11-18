import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { fecha, money } from "@/lib/money";

async function proponer(formData: FormData) {
  "use server";
  const perfil = await requireVista("conv");
  const unidad_id = String(formData.get("unidad_id") ?? "");
  const pie = Number(formData.get("pie") ?? 0);
  const cuotas = Number(formData.get("cuotas") ?? 6);
  const motivo = String(formData.get("motivo") ?? "").trim() || undefined;

  if (!unidad_id) redirect("/conv?error=" + encodeURIComponent("Selecciona la unidad."));

  const supabase = await createClient();
  const { error } = await supabase.rpc("proponer_convenio", {
    c: perfil.condominioId,
    u: unidad_id,
    p_pie: pie,
    p_cuotas: cuotas,
    p_motivo: motivo,
  });

  if (error) redirect("/conv?error=" + encodeURIComponent(error.message));
  revalidatePath("/conv");
  revalidatePath("/prop");
  redirect("/conv");
}

async function pagarCuota(formData: FormData) {
  "use server";
  await requireVista("conv");
  const convenio_id = String(formData.get("convenio_id"));
  const n = Number(formData.get("n"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("pagar_cuota_convenio", { p_convenio_id: convenio_id, p_n: n });
  if (error) redirect("/conv?error=" + encodeURIComponent(error.message));
  revalidatePath("/conv");
  revalidatePath("/rec");
  revalidatePath("/mi");
  redirect("/conv");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("conv");
  const { error } = await searchParams;
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";

  const [{ data: unidades }, { data: convenios }] = await Promise.all([
    supabase.from("v_unidades").select("id, codigo, deuda, convenio_id").eq("condominio_id", perfil.condominioId).gt("deuda", 0).order("deuda", { ascending: false }),
    supabase
      .from("convenios")
      .select("id, folio, deuda, pie, cuotas, valor_cuota, caducado, suscrito, origen, unidades(codigo), convenio_cuotas(n, vence, monto, pagada)")
      .eq("condominio_id", perfil.condominioId)
      .order("suscrito", { ascending: false }),
  ]);

  const unidadesSinConvenio = (unidades ?? []).filter((u) => !u.convenio_id);

  return (
    <>
      <PageHeader
        title="Convenio de pago"
        subtitle="Cuotas = redondeo((deuda − pie) / n / 1000) × 1000. Toda propuesta queda pendiente de aprobación del comité antes de quedar vigente."
        nota={esAdmin ? "puedes proponer un convenio y registrar el pago de sus cuotas." : "puedes proponer un convenio; el comité lo aprueba en “Propuestas”."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Convenios vigentes</div>
          {!convenios || convenios.length === 0 ? (
            <Empty>No hay convenios aprobados.</Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {convenios.map((c) => {
                const cuotas = ((c.convenio_cuotas ?? []) as { n: number; vence: string; monto: number; pagada: boolean }[]).sort((a, b) => a.n - b.n);
                const siguiente = cuotas.find((q) => !q.pagada);
                return (
                  <div key={c.id} className="rounded-card border border-border-soft p-3.5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink-2">
                          {(c.unidades as unknown as { codigo: string } | null)?.codigo} · {c.folio}
                        </span>
                        <Badge tone={c.caducado ? "danger" : "success"}>{c.caducado ? "Caducado" : "Vigente"}</Badge>
                      </div>
                      <span className="text-[11px] text-ink-5">{c.cuotas} × {money(c.valor_cuota)}</span>
                    </div>
                    <div className="text-[11px] text-ink-6">{c.origen}</div>
                    {!c.caducado && siguiente && (
                      <div className="mt-2.5 flex items-center justify-between gap-3 rounded-[10px] bg-surface-2 px-3 py-2">
                        <span className="text-[12px] text-ink-4">
                          Cuota {siguiente.n}/{c.cuotas} · vence {fecha(siguiente.vence)} · {money(siguiente.monto)}
                        </span>
                        {esAdmin && (
                          <form action={pagarCuota}>
                            <input type="hidden" name="convenio_id" value={c.id} />
                            <input type="hidden" name="n" value={siguiente.n} />
                            <Button type="submit" variant="secondary" className="text-[11px]">
                              Registrar pago
                            </Button>
                          </form>
                        )}
                      </div>
                    )}
                    {!c.caducado && !siguiente && <Badge tone="success">Todas las cuotas pagadas</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Proponer convenio</div>
          {unidadesSinConvenio.length === 0 ? (
            <Empty>No hay unidades con deuda vigente sin convenio.</Empty>
          ) : (
            <form action={proponer} className="flex flex-col gap-4">
              <Field label="Unidad">
                <Select name="unidad_id" required>
                  <option value="">Selecciona…</option>
                  {unidadesSinConvenio.map((u) => (
                    <option key={u.id} value={u.id ?? ""}>
                      {u.codigo} — {money(u.deuda)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Pie">
                <Input name="pie" type="number" min={0} defaultValue={0} required />
              </Field>
              <Field label="Número de cuotas (2 a 18)">
                <Input name="cuotas" type="number" min={2} max={18} defaultValue={6} required />
              </Field>
              <Field label="Motivo (opcional)">
                <Textarea name="motivo" rows={2} />
              </Field>
              <Button type="submit">Enviar propuesta</Button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
