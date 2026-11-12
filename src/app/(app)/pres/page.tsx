import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button, Card, Empty, Field, FormError, Input, Kpi, Table, Td, Th } from "@/components/ui";
import { money } from "@/lib/money";

const N_PARTIDAS = 8;

async function crear(formData: FormData) {
  "use server";
  const perfil = await requireVista("pres");
  const anio = Number(formData.get("anio"));
  if (!anio) redirect("/pres?error=" + encodeURIComponent("Indica el año."));

  const partidas: { concepto: string; anual: number }[] = [];
  for (let i = 0; i < N_PARTIDAS; i++) {
    const concepto = String(formData.get(`concepto_${i}`) ?? "").trim();
    const anual = Number(formData.get(`anual_${i}`) ?? 0);
    if (concepto && anual > 0) partidas.push({ concepto, anual });
  }
  if (partidas.length === 0) redirect("/pres?error=" + encodeURIComponent("Agrega al menos una partida."));

  const supabase = await createClient();
  const { data: presupuesto, error } = await supabase
    .from("presupuestos")
    .insert({ condominio_id: perfil.condominioId, anio, folio: `PR-${anio}`, aprobado_en: new Date().toISOString() })
    .select("id")
    .single();

  if (error || !presupuesto) {
    redirect("/pres?error=" + encodeURIComponent(error?.message.includes("duplicate") ? `Ya existe un presupuesto para ${anio}.` : "No se pudo crear el presupuesto."));
  }

  const { error: errPartidas } = await supabase
    .from("presupuesto_partidas")
    .insert(partidas.map((p) => ({ presupuesto_id: presupuesto.id, concepto: p.concepto, anual: p.anual })));

  if (errPartidas) redirect("/pres?error=" + encodeURIComponent("No se pudieron guardar las partidas."));

  revalidatePath("/pres");
  redirect("/pres");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("pres");
  const { error } = await searchParams;
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";

  const { data: presupuestos } = await supabase
    .from("presupuestos")
    .select("id, anio, folio, aprobado_en, presupuesto_partidas(concepto, anual)")
    .eq("condominio_id", perfil.condominioId)
    .order("anio", { ascending: false });

  const { data: emisiones } = await supabase
    .from("emisiones")
    .select("periodo, total")
    .eq("condominio_id", perfil.condominioId);

  const anioActual = new Date().getFullYear();

  return (
    <>
      <PageHeader
        title="Presupuesto anual"
        subtitle="Presupuesto aprobado frente al gasto real emitido en el año."
        nota={esAdmin ? "puedes aprobar el presupuesto del año." : "acceso de solo lectura."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      {!presupuestos || presupuestos.length === 0 ? (
        <Empty>Aún no hay presupuestos aprobados.</Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {presupuestos.map((p) => {
            const totalAnual = (p.presupuesto_partidas ?? []).reduce((a, x) => a + x.anual, 0);
            const gastoReal = (emisiones ?? [])
              .filter((e) => new Date(e.periodo).getUTCFullYear() === p.anio)
              .reduce((a, e) => a + e.total, 0);
            return (
              <Card key={p.id}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[15px] font-semibold text-ink-2">{p.folio} · {p.anio}</div>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                  <Kpi label="Presupuesto anual" value={money(totalAnual)} />
                  <Kpi label="Gasto real emitido" value={money(gastoReal)} accent="var(--color-copper)" />
                  <Kpi
                    label="Diferencia"
                    value={money(totalAnual - gastoReal)}
                    accent={totalAnual - gastoReal >= 0 ? "var(--color-success)" : "var(--color-warn-accent)"}
                  />
                </div>
                <Table>
                  <thead>
                    <tr>
                      <Th>Concepto</Th>
                      <Th>Monto anual</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(p.presupuesto_partidas ?? []).map((x, i) => (
                      <tr key={i}>
                        <Td>{x.concepto}</Td>
                        <Td>{money(x.anual)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            );
          })}
        </div>
      )}

      {esAdmin && (
        <Card className="mt-6">
          <details>
            <summary className="cursor-pointer list-none text-[13px] font-semibold text-blue-text">+ Aprobar nuevo presupuesto</summary>
            <form action={crear} className="mt-4 flex flex-col gap-4">
              <Field label="Año">
                <Input name="anio" type="number" defaultValue={anioActual} required />
              </Field>
              <div className="flex flex-col gap-2">
                <span className="text-[12px] text-ink-5">Partidas</span>
                {Array.from({ length: N_PARTIDAS }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1fr_160px] gap-2">
                    <Input name={`concepto_${i}`} placeholder="Concepto" />
                    <Input name={`anual_${i}`} type="number" placeholder="Monto anual" min={0} />
                  </div>
                ))}
              </div>
              <Button type="submit">Aprobar presupuesto</Button>
            </form>
          </details>
        </Card>
      )}
    </>
  );
}
