import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Table, Td, Th } from "@/components/ui";
import { fecha, money } from "@/lib/money";

const N_PARTIDAS = 6;

async function emitir(formData: FormData) {
  "use server";
  const perfil = await requireVista("gc");
  const periodo = String(formData.get("periodo") ?? "");
  if (!periodo) redirect("/gc?error=" + encodeURIComponent("Selecciona el período a emitir."));

  const partidas: { concepto: string; monto: number }[] = [];
  for (let i = 0; i < N_PARTIDAS; i++) {
    const concepto = String(formData.get(`concepto_${i}`) ?? "").trim();
    const monto = Number(formData.get(`monto_${i}`) ?? 0);
    if (concepto && monto > 0) partidas.push({ concepto, monto });
  }
  if (partidas.length === 0) {
    redirect("/gc?error=" + encodeURIComponent("Agrega al menos una partida de gasto."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("emitir_gastos", {
    c: perfil.condominioId,
    p_periodo: `${periodo}-01`,
    p_partidas: partidas,
  });

  if (error) {
    redirect("/gc?error=" + encodeURIComponent(error.message.includes("duplicate") ? "Ese período ya fue emitido." : error.message));
  }
  revalidatePath("/gc");
  revalidatePath("/panel");
  revalidatePath("/mi");
  redirect("/gc");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("gc");
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: emisiones } = await supabase
    .from("emisiones")
    .select("id, folio, periodo, total, emitida_en")
    .eq("condominio_id", perfil.condominioId)
    .order("periodo", { ascending: false });

  const ahora = new Date();
  const mesDefault = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <PageHeader
        title="Emitir gastos comunes"
        subtitle="Prorratea el gasto del período según los derechos de cada unidad. El 5% se abona automáticamente al fondo de reserva."
        nota="no se puede emitir dos veces el mismo período."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Nueva emisión</div>
          <form action={emitir} className="flex flex-col gap-4">
            <Field label="Período">
              <Input type="month" name="periodo" defaultValue={mesDefault} required />
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-ink-5">Partidas de gasto</span>
              {Array.from({ length: N_PARTIDAS }).map((_, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px] gap-2">
                  <Input name={`concepto_${i}`} placeholder="Concepto (ej. Mantención ascensores)" />
                  <Input name={`monto_${i}`} type="number" placeholder="Monto" min={0} />
                </div>
              ))}
            </div>
            <Button type="submit">Emitir gastos comunes</Button>
          </form>
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Emisiones anteriores</div>
          {!emisiones || emisiones.length === 0 ? (
            <Empty>Aún no se ha emitido ningún período.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Folio</Th>
                  <Th>Período</Th>
                  <Th>Total</Th>
                  <Th>Emitida</Th>
                </tr>
              </thead>
              <tbody>
                {emisiones.map((e) => (
                  <tr key={e.id}>
                    <Td className="font-medium text-ink-2">{e.folio}</Td>
                    <Td>{fecha(e.periodo)}</Td>
                    <Td>{money(e.total)}</Td>
                    <Td>
                      <Badge tone="success">{fecha(e.emitida_en)}</Badge>
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
