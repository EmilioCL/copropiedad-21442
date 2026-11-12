import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Th } from "@/components/ui";
import { fechaHora, money } from "@/lib/money";

async function pagar(formData: FormData) {
  "use server";
  const perfil = await requireVista("rec");
  const unidad_id = String(formData.get("unidad_id") ?? "");
  const monto = Number(formData.get("monto") ?? 0);
  const medio = String(formData.get("medio") ?? "Efectivo");

  if (!unidad_id || monto <= 0) {
    redirect("/rec?error=" + encodeURIComponent("Selecciona la unidad e ingresa un monto válido."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_pago", {
    c: perfil.condominioId,
    u: unidad_id,
    p_monto: monto,
    p_medio: medio,
  });

  if (error) {
    redirect("/rec?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/rec");
  revalidatePath("/panel");
  revalidatePath("/mi");
  redirect("/rec");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("rec");
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: unidades }, { data: pagos }] = await Promise.all([
    supabase
      .from("v_unidades")
      .select("id, codigo, propietario, deuda, mora, habil, convenio_id")
      .eq("condominio_id", perfil.condominioId)
      .gt("deuda", 0)
      .order("mora", { ascending: false }),
    supabase
      .from("pagos")
      .select("id, folio, monto, medio, registrado_en, unidades(codigo)")
      .eq("condominio_id", perfil.condominioId)
      .order("registrado_en", { ascending: false })
      .limit(10),
  ]);

  return (
    <>
      <PageHeader
        title="Recaudación"
        subtitle="Pagos recibidos y cumplimiento de los convenios vigentes. Los pagos se imputan a los cargos más antiguos."
        nota="los convenios caducados o incumplidos devuelven a la unidad a inhábil."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Unidades con deuda</div>
          {!unidades || unidades.length === 0 ? (
            <Empty>No hay unidades con deuda vigente.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Unidad</Th>
                  <Th>Propietario</Th>
                  <Th>Deuda</Th>
                  <Th>Mora</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((u) => (
                  <tr key={u.id}>
                    <Td className="font-medium text-ink-2">{u.codigo}</Td>
                    <Td>{u.propietario}</Td>
                    <Td>{money(u.deuda)}</Td>
                    <Td>{(u.mora ?? 0) > 0 ? money(u.mora) : "—"}</Td>
                    <Td>
                      <Badge tone={u.habil ? "success" : "danger"}>
                        {u.habil ? (u.convenio_id ? "Con convenio" : "Hábil") : "Inhábil"}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Registrar pago</div>
          <form action={pagar} className="flex flex-col gap-4">
            <Field label="Unidad">
              <Select name="unidad_id" required>
                <option value="">Selecciona…</option>
                {(unidades ?? []).map((u) => (
                  <option key={u.id} value={u.id ?? ""}>
                    {u.codigo} — {money(u.deuda)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Monto">
              <Input name="monto" type="number" min={1} required />
            </Field>
            <Field label="Medio de pago">
              <Select name="medio" defaultValue="Transferencia">
                <option>Efectivo</option>
                <option>Débito</option>
                <option>Crédito</option>
                <option>Transferencia</option>
              </Select>
            </Field>
            <Button type="submit">Registrar pago</Button>
          </form>

          <div className="mt-6 text-[12px] font-semibold uppercase tracking-[.5px] text-ink-5">Últimos pagos</div>
          {!pagos || pagos.length === 0 ? (
            <div className="mt-2 text-[12.5px] text-ink-5">Sin pagos registrados.</div>
          ) : (
            <ul className="mt-2 flex flex-col gap-2.5">
              {pagos.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-ink-3">
                    {(p.unidades as unknown as { codigo: string } | null)?.codigo ?? "—"} · {p.medio} · {fechaHora(p.registrado_en)}
                  </span>
                  <span className="font-semibold text-ink-2">{money(p.monto)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
