import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { fecha, money } from "@/lib/money";

async function celebrar(formData: FormData) {
  "use server";
  const perfil = await requireVista("conv");
  const unidad_id = String(formData.get("unidad_id") ?? "");
  const pie = Number(formData.get("pie") ?? 0);
  const cuotas = Number(formData.get("cuotas") ?? 6);

  if (!unidad_id) redirect("/conv?error=" + encodeURIComponent("Selecciona la unidad."));

  const supabase = await createClient();
  const { error } = await supabase.rpc("celebrar_convenio", {
    c: perfil.condominioId,
    u: unidad_id,
    p_pie: pie,
    p_cuotas: cuotas,
    p_origen: "Simulador de convenio",
  });

  if (error) redirect("/conv?error=" + encodeURIComponent(error.message));
  revalidatePath("/conv");
  revalidatePath("/rec");
  revalidatePath("/mi");
  redirect("/conv");
}

async function proponer(formData: FormData) {
  "use server";
  const perfil = await requireVista("conv");
  const unidad_id = String(formData.get("unidad_id") ?? "");
  const pie = Number(formData.get("pie") ?? 0);
  const cuotas = Number(formData.get("cuotas") ?? 6);
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (!unidad_id) redirect("/conv?error=" + encodeURIComponent("Selecciona la unidad."));

  const supabase = await createClient();
  const { data: unidad } = await supabase.from("v_unidades").select("deuda").eq("id", unidad_id).single();
  const deuda = unidad?.deuda ?? 0;
  const valor_cuota = Math.ceil((deuda - pie) / cuotas / 1000) * 1000;

  const { error } = await supabase.from("propuestas_convenio").insert({
    condominio_id: perfil.condominioId,
    unidad_id,
    folio: `PC-${Date.now()}`,
    origen: "Comité",
    deuda,
    pie,
    cuotas,
    valor_cuota,
    motivo,
  });

  if (error) redirect("/conv?error=" + encodeURIComponent("No se pudo enviar la propuesta."));
  revalidatePath("/conv");
  revalidatePath("/prop");
  redirect("/conv");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("conv");
  const { error } = await searchParams;
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";

  const [{ data: unidades }, { data: convenios }] = await Promise.all([
    supabase.from("v_unidades").select("id, codigo, deuda").eq("condominio_id", perfil.condominioId).gt("deuda", 0).order("deuda", { ascending: false }),
    supabase
      .from("convenios")
      .select("id, folio, deuda, pie, cuotas, valor_cuota, caducado, suscrito, unidades(codigo)")
      .eq("condominio_id", perfil.condominioId)
      .order("suscrito", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="Convenio de pago"
        subtitle="Cuotas = redondeo((deuda − pie) / n / 1000) × 1000. La primera cuota vence el día 5 del mes siguiente a la suscripción."
        nota={esAdmin ? "solo tú puedes autorizar un convenio." : "puedes proponer un convenio; el administrador lo autoriza."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Convenios vigentes</div>
          {!convenios || convenios.length === 0 ? (
            <Empty>No hay convenios celebrados.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Folio</Th>
                  <Th>Unidad</Th>
                  <Th>Deuda</Th>
                  <Th>Cuotas</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {convenios.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium text-ink-2">{c.folio}</Td>
                    <Td>{(c.unidades as unknown as { codigo: string } | null)?.codigo}</Td>
                    <Td>{money(c.deuda)}</Td>
                    <Td>
                      {c.cuotas} × {money(c.valor_cuota)}
                    </Td>
                    <Td>{c.caducado ? "Caducado" : "Vigente"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">{esAdmin ? "Celebrar convenio" : "Proponer convenio"}</div>
          {!unidades || unidades.length === 0 ? (
            <Empty>No hay unidades con deuda vigente.</Empty>
          ) : (
            <form action={esAdmin ? celebrar : proponer} className="flex flex-col gap-4">
              <Field label="Unidad">
                <Select name="unidad_id" required>
                  <option value="">Selecciona…</option>
                  {unidades.map((u) => (
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
              {!esAdmin && (
                <Field label="Motivo (opcional)">
                  <Textarea name="motivo" rows={2} />
                </Field>
              )}
              <Button type="submit">{esAdmin ? "Celebrar convenio" : "Enviar propuesta"}</Button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
