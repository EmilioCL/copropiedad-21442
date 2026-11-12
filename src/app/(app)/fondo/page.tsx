import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Kpi, Table, Td, Th } from "@/components/ui";
import { fechaHora, money } from "@/lib/money";

async function girar(formData: FormData) {
  "use server";
  const perfil = await requireVista("fondo");
  const concepto = String(formData.get("concepto") ?? "").trim();
  const monto = Number(formData.get("monto") ?? 0);

  if (!concepto || monto <= 0) {
    redirect("/fondo?error=" + encodeURIComponent("Ingresa el concepto y un monto válido."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fondo_girar", {
    c: perfil.condominioId,
    p_concepto: concepto,
    p_monto: monto,
    p_autoriza: "autorizado por asamblea",
  });

  if (error) {
    redirect("/fondo?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/fondo");
  revalidatePath("/panel");
  redirect("/fondo");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("fondo");
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: saldo }, { data: movs }] = await Promise.all([
    supabase.from("v_fondo_saldo").select("saldo, aportes, giros").eq("condominio_id", perfil.condominioId).maybeSingle(),
    supabase
      .from("fondo_movimientos")
      .select("id, folio, tipo, concepto, monto, autoriza, ts")
      .eq("condominio_id", perfil.condominioId)
      .order("ts", { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <PageHeader
        title="Fondo común de reserva"
        subtitle="Cada emisión abona automáticamente el 5% del total. Los giros exigen concepto y no pueden exceder el saldo."
        nota="el saldo se deriva de los movimientos, no se guarda."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Kpi label="Saldo actual" value={money(saldo?.saldo ?? 0)} accent="var(--color-copper)" />
        <Kpi label="Aportes totales" value={money(saldo?.aportes ?? 0)} accent="var(--color-success)" />
        <Kpi label="Giros totales" value={money(saldo?.giros ?? 0)} accent="var(--color-warn-accent)" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Movimientos</div>
          {!movs || movs.length === 0 ? (
            <Empty>Sin movimientos del fondo.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Folio</Th>
                  <Th>Tipo</Th>
                  <Th>Concepto</Th>
                  <Th>Monto</Th>
                  <Th>Fecha</Th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id}>
                    <Td className="font-medium text-ink-2">{m.folio}</Td>
                    <Td>
                      <Badge tone={m.tipo === "Aporte" ? "success" : "warn"}>{m.tipo}</Badge>
                    </Td>
                    <Td>{m.concepto}</Td>
                    <Td className={m.monto < 0 ? "text-[#A8432F]" : ""}>{money(m.monto)}</Td>
                    <Td>{fechaHora(m.ts)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Girar del fondo</div>
          <form action={girar} className="flex flex-col gap-4">
            <Field label="Concepto (autorizado por asamblea)">
              <Input name="concepto" required />
            </Field>
            <Field label="Monto">
              <Input name="monto" type="number" min={1} required />
            </Field>
            <Button type="submit">Girar</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
