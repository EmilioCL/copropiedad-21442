import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Table, Td, Th } from "@/components/ui";
import { fechaHora, money } from "@/lib/money";

async function cerrar(formData: FormData) {
  "use server";
  const perfil = await requireVista("rend");
  const periodo = String(formData.get("periodo") ?? "").trim();
  const ingresos = Number(formData.get("ingresos") ?? 0);
  const egresos = Number(formData.get("egresos") ?? 0);
  const notificada = formData.get("notificada") === "on";

  if (!periodo) redirect("/rend?error=" + encodeURIComponent("Indica el período a rendir."));

  const supabase = await createClient();
  const { error } = await supabase.from("rendiciones").insert({
    condominio_id: perfil.condominioId,
    folio: `RC-${Date.now()}`,
    periodo,
    ingresos,
    egresos,
    notificada,
  });

  if (error) redirect("/rend?error=" + encodeURIComponent("No se pudo cerrar la rendición."));
  revalidatePath("/rend");
  redirect("/rend");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("rend");
  const { error } = await searchParams;
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";

  const { data: rendiciones } = await supabase
    .from("rendiciones")
    .select("id, folio, periodo, ingresos, egresos, notificada, cerrada_en")
    .eq("condominio_id", perfil.condominioId)
    .order("cerrada_en", { ascending: false });

  const { data: sugerido } = await supabase
    .from("pagos")
    .select("monto")
    .eq("condominio_id", perfil.condominioId);
  const ingresosSugeridos = (sugerido ?? []).reduce((a, p) => a + p.monto, 0);

  return (
    <>
      <PageHeader
        title="Rendición de cuentas"
        subtitle="Al cerrar el período el balance queda inmutable; la notificación de transparencia es opcional."
        nota={esAdmin ? "solo tú cierras la rendición." : "observas y visas la rendición."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      {!rendiciones || rendiciones.length === 0 ? (
        <Empty>No hay rendiciones cerradas.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Folio</Th>
              <Th>Período</Th>
              <Th>Ingresos</Th>
              <Th>Egresos</Th>
              <Th>Balance</Th>
              <Th>Transparencia</Th>
            </tr>
          </thead>
          <tbody>
            {rendiciones.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium text-ink-2">{r.folio}</Td>
                <Td>{r.periodo}</Td>
                <Td>{money(r.ingresos)}</Td>
                <Td>{money(r.egresos)}</Td>
                <Td>{money(r.ingresos - r.egresos)}</Td>
                <Td>
                  <Badge tone={r.notificada ? "success" : "neutral"}>{r.notificada ? "Notificada" : "No notificada"}</Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {esAdmin && (
        <Card className="mt-6">
          <details>
            <summary className="cursor-pointer list-none text-[13px] font-semibold text-blue-text">+ Cerrar período</summary>
            <form action={cerrar} className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Período (ej. Octubre 2026)">
                <Input name="periodo" required />
              </Field>
              <Field label="Ingresos">
                <Input name="ingresos" type="number" defaultValue={ingresosSugeridos} required />
              </Field>
              <Field label="Egresos">
                <Input name="egresos" type="number" defaultValue={0} required />
              </Field>
              <label className="flex items-center gap-2 text-[12.5px] text-ink-4">
                <input type="checkbox" name="notificada" /> Notificar transparencia a la comunidad
              </label>
              <div className="col-span-2">
                <Button type="submit">Cerrar rendición</Button>
              </div>
            </form>
          </details>
        </Card>
      )}
    </>
  );
}
