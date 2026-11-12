import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, FormError, Table, Td, Th } from "@/components/ui";
import { fechaHora, money } from "@/lib/money";

async function autorizar(formData: FormData) {
  "use server";
  const perfil = await requireVista("prop");
  const id = String(formData.get("id"));
  const unidad_id = String(formData.get("unidad_id"));
  const pie = Number(formData.get("pie"));
  const cuotas = Number(formData.get("cuotas"));
  const origen = String(formData.get("origen"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("celebrar_convenio", {
    c: perfil.condominioId,
    u: unidad_id,
    p_pie: pie,
    p_cuotas: cuotas,
    p_origen: `Propuesta de ${origen}`,
  });

  if (error) redirect("/prop?error=" + encodeURIComponent(error.message));

  await supabase.from("propuestas_convenio").delete().eq("id", id);
  revalidatePath("/prop");
  revalidatePath("/conv");
  revalidatePath("/rec");
  redirect("/prop");
}

async function rechazar(formData: FormData) {
  "use server";
  await requireVista("prop");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("propuestas_convenio").delete().eq("id", id);
  revalidatePath("/prop");
  redirect("/prop");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("prop");
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: propuestas } = await supabase
    .from("propuestas_convenio")
    .select("id, folio, origen, deuda, pie, cuotas, valor_cuota, motivo, creada_en, unidad_id, unidades(codigo)")
    .eq("condominio_id", perfil.condominioId)
    .order("creada_en", { ascending: false });

  return (
    <>
      <PageHeader
        title="Convenios propuestos"
        subtitle="Propuestas del comité o de copropietarios, a la espera de autorización."
        nota="solo el administrador autoriza o rechaza."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      {!propuestas || propuestas.length === 0 ? (
        <Empty>No hay propuestas pendientes.</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {propuestas.map((p) => (
            <Card key={p.id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink-2">
                    {(p.unidades as unknown as { codigo: string } | null)?.codigo} · {p.folio}
                  </span>
                  <Badge tone="info">Propuesta de {p.origen}</Badge>
                </div>
                <span className="text-[11px] text-ink-5">{fechaHora(p.creada_en)}</span>
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>Deuda</Th>
                    <Th>Pie</Th>
                    <Th>Cuotas</Th>
                    <Th>Valor cuota</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td>{money(p.deuda)}</Td>
                    <Td>{money(p.pie)}</Td>
                    <Td>{p.cuotas}</Td>
                    <Td>{money(p.valor_cuota)}</Td>
                  </tr>
                </tbody>
              </Table>
              {p.motivo && <div className="mt-2 text-[12.5px] text-ink-5">{p.motivo}</div>}
              <div className="mt-3 flex gap-2">
                <form action={autorizar}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="unidad_id" value={p.unidad_id} />
                  <input type="hidden" name="pie" value={p.pie} />
                  <input type="hidden" name="cuotas" value={p.cuotas} />
                  <input type="hidden" name="origen" value={p.origen} />
                  <Button type="submit">Autorizar</Button>
                </form>
                <form action={rechazar}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" variant="secondary">
                    Rechazar
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
