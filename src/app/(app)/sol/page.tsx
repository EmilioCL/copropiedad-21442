import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Table, Td, Textarea, Th } from "@/components/ui";
import { fechaHora, money } from "@/lib/money";

async function proponer(formData: FormData) {
  "use server";
  const perfil = await requireVista("sol");
  if (!perfil.unidadId) redirect("/sol?error=" + encodeURIComponent("Tu perfil no tiene una unidad asociada."));

  const pie = Number(formData.get("pie") ?? 0);
  const cuotas = Number(formData.get("cuotas") ?? 6);
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  const supabase = await createClient();
  const { data: unidad } = await supabase.from("v_unidades").select("deuda").eq("id", perfil.unidadId).single();
  const deuda = unidad?.deuda ?? 0;

  if (deuda <= 0) redirect("/sol?error=" + encodeURIComponent("No tienes deuda vigente."));

  const valor_cuota = Math.ceil((deuda - pie) / cuotas / 1000) * 1000;

  const { error } = await supabase.from("propuestas_convenio").insert({
    condominio_id: perfil.condominioId,
    unidad_id: perfil.unidadId,
    folio: `PC-${Date.now()}`,
    origen: "Copropietario",
    deuda,
    pie,
    cuotas,
    valor_cuota,
    motivo,
  });

  if (error) redirect("/sol?error=" + encodeURIComponent("No se pudo enviar la propuesta."));
  revalidatePath("/sol");
  revalidatePath("/prop");
  redirect("/sol");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("sol");
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: unidad }, { data: propuestas }] = await Promise.all([
    perfil.unidadId ? supabase.from("v_unidades").select("deuda, convenio_id").eq("id", perfil.unidadId).single() : Promise.resolve({ data: null }),
    perfil.unidadId
      ? supabase
          .from("propuestas_convenio")
          .select("id, folio, pie, cuotas, valor_cuota, motivo, creada_en")
          .eq("unidad_id", perfil.unidadId)
          .order("creada_en", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <>
      <PageHeader
        title="Repactar mi deuda"
        subtitle="Propón un convenio de pago para la deuda de tu unidad. El administrador debe autorizarlo."
        nota="tu propuesta queda pendiente hasta que el administrador la autorice."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Tu deuda</div>
          {!unidad || (unidad.deuda ?? 0) <= 0 ? (
            <Empty>No tienes deuda vigente.</Empty>
          ) : unidad.convenio_id ? (
            <Empty>Ya tienes un convenio vigente. Revisa “Mi unidad”.</Empty>
          ) : (
            <form action={proponer} className="flex flex-col gap-4">
              <div className="text-[13px] text-ink-5">
                Deuda actual: <b className="text-ink-2">{money(unidad.deuda)}</b>
              </div>
              <Field label="Pie">
                <Input name="pie" type="number" min={0} defaultValue={0} required />
              </Field>
              <Field label="Número de cuotas (2 a 18)">
                <Input name="cuotas" type="number" min={2} max={18} defaultValue={6} required />
              </Field>
              <Field label="Motivo (opcional)">
                <Textarea name="motivo" rows={3} />
              </Field>
              <Button type="submit">Proponer convenio</Button>
            </form>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Tus propuestas</div>
          {!propuestas || propuestas.length === 0 ? (
            <Empty>No has enviado propuestas.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Folio</Th>
                  <Th>Cuotas</Th>
                  <Th>Enviada</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {propuestas.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-medium text-ink-2">{p.folio}</Td>
                    <Td>
                      {p.cuotas} × {money(p.valor_cuota)}
                    </Td>
                    <Td>{fechaHora(p.creada_en)}</Td>
                    <Td>
                      <Badge tone="neutral">Pendiente</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
