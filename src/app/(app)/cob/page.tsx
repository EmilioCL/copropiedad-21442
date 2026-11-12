import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { fechaHora, money } from "@/lib/money";

async function abrir(formData: FormData) {
  "use server";
  const perfil = await requireVista("cob");
  const unidad_id = String(formData.get("unidad_id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!unidad_id) redirect("/cob?error=" + encodeURIComponent("Selecciona la unidad."));

  const supabase = await createClient();
  const { error } = await supabase.rpc("cobranza_abrir", { c: perfil.condominioId, u: unidad_id, p_motivo: motivo });

  if (error) redirect("/cob?error=" + encodeURIComponent(error.message));
  revalidatePath("/cob");
  redirect("/cob");
}

const ESTADO_TONE = { Prejudicial: "warn", Judicial: "danger", Cerrada: "success" } as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("cob");
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: cobranzas }, { data: candidatas }] = await Promise.all([
    supabase
      .from("cobranzas")
      .select("id, folio, monto, estado, motivo, abierta_en, unidades(codigo), cobranza_hitos(texto, ts)")
      .eq("condominio_id", perfil.condominioId)
      .order("abierta_en", { ascending: false }),
    supabase
      .from("v_unidades")
      .select("id, codigo, mora, convenio_id")
      .eq("condominio_id", perfil.condominioId)
      .gt("mora", 0)
      .is("convenio_id", null),
  ]);

  return (
    <>
      <PageHeader
        title="Cobranza"
        subtitle="Expedientes de cobranza de unidades morosas sin convenio vigente. Etapas: Prejudicial → Judicial → Cerrada."
        nota="solo aplica a unidades con mora y sin convenio."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Expedientes</div>
          {!cobranzas || cobranzas.length === 0 ? (
            <Empty>No hay expedientes de cobranza abiertos.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Folio</Th>
                  <Th>Unidad</Th>
                  <Th>Monto</Th>
                  <Th>Estado</Th>
                  <Th>Abierta</Th>
                </tr>
              </thead>
              <tbody>
                {cobranzas.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium text-ink-2">{c.folio}</Td>
                    <Td>{(c.unidades as unknown as { codigo: string } | null)?.codigo ?? "—"}</Td>
                    <Td>{money(c.monto)}</Td>
                    <Td>
                      <Badge tone={ESTADO_TONE[c.estado as keyof typeof ESTADO_TONE]}>{c.estado}</Badge>
                    </Td>
                    <Td>{fechaHora(c.abierta_en)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Abrir cobranza</div>
          {!candidatas || candidatas.length === 0 ? (
            <Empty>No hay unidades morosas sin convenio.</Empty>
          ) : (
            <form action={abrir} className="flex flex-col gap-4">
              <Field label="Unidad">
                <Select name="unidad_id" required>
                  <option value="">Selecciona…</option>
                  {candidatas.map((u) => (
                    <option key={u.id} value={u.id ?? ""}>
                      {u.codigo} — {money(u.mora)} en mora
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Motivo">
                <Textarea name="motivo" rows={3} />
              </Field>
              <Button type="submit" variant="danger">
                Abrir cobranza
              </Button>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
