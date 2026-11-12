import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { fecha } from "@/lib/money";

async function crear(formData: FormData) {
  "use server";
  const perfil = await requireVista("vot");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const quorum = String(formData.get("quorum") ?? "Mayoría simple");
  const cierre = String(formData.get("cierre") ?? "");

  if (!titulo || !cierre) redirect("/vot?error=" + encodeURIComponent("Completa el título y la fecha de cierre."));

  const supabase = await createClient();
  const { error } = await supabase.from("votaciones").insert({
    condominio_id: perfil.condominioId,
    folio: `VT-${Date.now()}`,
    titulo,
    descripcion,
    quorum: quorum as "Mayoría simple" | "Mayoría absoluta de los derechos",
    cierre,
    creada_por: perfil.rol as "administrador" | "comite",
  });

  if (error) redirect("/vot?error=" + encodeURIComponent("No se pudo crear la votación."));
  revalidatePath("/vot");
  redirect("/vot");
}

async function cerrar(formData: FormData) {
  "use server";
  await requireVista("vot");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("votacion_cerrar", { v: id });
  if (error) redirect("/vot?error=" + encodeURIComponent(error.message));
  revalidatePath("/vot");
  redirect("/vot");
}

async function votar(formData: FormData) {
  "use server";
  await requireVista("vot");
  const id = String(formData.get("id"));
  const sentido = String(formData.get("sentido")) as "favor" | "contra" | "abst";
  const supabase = await createClient();
  const { error } = await supabase.rpc("emitir_voto", { v: id, s: sentido });
  if (error) redirect("/vot?error=" + encodeURIComponent(error.message));
  revalidatePath("/vot");
  redirect("/vot");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("vot");
  const { error } = await searchParams;
  const supabase = await createClient();
  const gestion = perfil.rol === "administrador" || perfil.rol === "comite";
  const esCoprop = perfil.rol === "copropietario";

  const { data: votaciones } = await supabase
    .from("votaciones")
    .select("id, folio, titulo, descripcion, quorum, cierre, abierta, resultado")
    .eq("condominio_id", perfil.condominioId)
    .order("cierre", { ascending: false });

  let misVotos: Record<string, string> = {};
  if (esCoprop && perfil.unidadId) {
    const { data: votos } = await supabase.from("votos").select("votacion_id, sentido").eq("unidad_id", perfil.unidadId);
    misVotos = Object.fromEntries((votos ?? []).map((v) => [v.votacion_id, v.sentido]));
  }

  return (
    <>
      <PageHeader
        title="Votaciones"
        subtitle="Materias en votación y su resultado, ponderado por los derechos de cada unidad."
        nota={esCoprop ? "solo vota si estás hábil; el voto es irrevocable." : "puedes crear y cerrar votaciones."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Votaciones</div>
          {!votaciones || votaciones.length === 0 ? (
            <Empty>No hay votaciones.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Materia</Th>
                  <Th>Quórum</Th>
                  <Th>Cierre</Th>
                  <Th>Estado</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {votaciones.map((v) => (
                  <tr key={v.id}>
                    <Td className="font-medium text-ink-2">
                      {v.titulo}
                      {v.descripcion && <div className="text-[11px] font-normal text-ink-5">{v.descripcion}</div>}
                    </Td>
                    <Td>{v.quorum}</Td>
                    <Td>{fecha(v.cierre)}</Td>
                    <Td>
                      {v.abierta ? (
                        <Badge tone="info">Abierta</Badge>
                      ) : (
                        <Badge tone={v.resultado === "APROBADA" ? "success" : v.resultado === "RECHAZADA" ? "danger" : "neutral"}>
                          {v.resultado}
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      {gestion && v.abierta && (
                        <form action={cerrar}>
                          <input type="hidden" name="id" value={v.id} />
                          <Button type="submit" variant="secondary" className="text-[11px]">
                            Cerrar
                          </Button>
                        </form>
                      )}
                      {esCoprop && v.abierta && !misVotos[v.id] && (
                        <details>
                          <summary className="cursor-pointer list-none text-[12px] font-semibold text-blue-text">Votar</summary>
                          <form action={votar} className="absolute z-20 mt-2 flex w-[220px] flex-col gap-2 rounded-card border border-border-strong bg-surface p-3 shadow-[0_18px_44px_-16px_rgba(24,27,31,.3)]">
                            <input type="hidden" name="id" value={v.id} />
                            <div className="text-[11px] text-ink-5">Tu voto no podrá revertirse.</div>
                            <div className="flex gap-1.5">
                              <Button type="submit" name="sentido" value="favor" className="flex-1 text-[11px]">
                                A favor
                              </Button>
                              <Button type="submit" name="sentido" value="contra" variant="danger" className="flex-1 text-[11px]">
                                En contra
                              </Button>
                            </div>
                            <Button type="submit" name="sentido" value="abst" variant="secondary" className="text-[11px]">
                              Abstención
                            </Button>
                          </form>
                        </details>
                      )}
                      {esCoprop && misVotos[v.id] && <Badge tone="neutral">Votaste: {misVotos[v.id]}</Badge>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {gestion && (
          <Card>
            <div className="mb-4 text-[13px] font-semibold text-ink-2">Nueva votación</div>
            <form action={crear} className="flex flex-col gap-4">
              <Field label="Título">
                <Input name="titulo" required />
              </Field>
              <Field label="Descripción (opcional)">
                <Textarea name="descripcion" rows={2} />
              </Field>
              <Field label="Mayoría requerida">
                <Select name="quorum" defaultValue="Mayoría simple">
                  <option>Mayoría simple</option>
                  <option>Mayoría absoluta de los derechos</option>
                </Select>
              </Field>
              <Field label="Cierre">
                <Input name="cierre" type="date" required />
              </Field>
              <Button type="submit">Crear votación</Button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
