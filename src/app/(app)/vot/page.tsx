import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { fecha, porcentaje } from "@/lib/money";

async function crear(formData: FormData) {
  "use server";
  const perfil = await requireVista("vot");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const quorum = String(formData.get("quorum") ?? "Mayoría simple");
  const cierre = String(formData.get("cierre") ?? "");

  if (!titulo || !cierre) redirect("/vot?error=" + encodeURIComponent("Completa el título y la fecha de cierre."));

  const supabase = await createClient();
  const { error } = await supabase.rpc("crear_votacion", {
    c: perfil.condominioId,
    p_titulo: titulo,
    p_descripcion: descripcion,
    p_quorum: quorum as "Mayoría simple" | "Mayoría absoluta de los derechos",
    p_cierre: cierre,
  });

  if (error) redirect("/vot?error=" + encodeURIComponent(error.message));
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

const QUORUM_EXPLICACION: Record<string, string> = {
  "Mayoría simple": "gana el lado con más derechos a favor que en contra.",
  "Mayoría absoluta de los derechos": "necesita más del 50% del total de derechos del condominio a favor.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("vot");
  const { error } = await searchParams;
  const supabase = await createClient();
  const gestion = perfil.rol === "administrador" || perfil.rol === "comite";
  const esCoprop = perfil.rol === "copropietario";

  const [{ data: votaciones }, { data: unidades }] = await Promise.all([
    supabase
      .from("votaciones")
      .select("id, folio, titulo, descripcion, quorum, cierre, abierta, resultado")
      .eq("condominio_id", perfil.condominioId)
      .order("cierre", { ascending: false }),
    supabase.from("v_unidades").select("id, derechos").eq("condominio_id", perfil.condominioId),
  ]);

  const unidadesValidas = (unidades ?? []).filter((u): u is typeof u & { id: string } => u.id !== null);
  const derechosPorUnidad = new Map(unidadesValidas.map((u) => [u.id, u.derechos ?? 0]));
  const todasLasUnidades = unidadesValidas.map((u) => u.id);
  const votacionIds = (votaciones ?? []).map((v) => v.id);

  let avancePorVotacion: Record<string, ReturnType<typeof calcularAvance>> = {};
  if (gestion && votacionIds.length > 0) {
    const [{ data: elegiblesRows }, { data: votosRows }] = await Promise.all([
      supabase.from("votacion_elegibles").select("votacion_id, unidad_id").in("votacion_id", votacionIds),
      supabase.from("votos").select("votacion_id, unidad_id, sentido").in("votacion_id", votacionIds),
    ]);

    avancePorVotacion = Object.fromEntries(
      votacionIds.map((id) => {
        const propias = (elegiblesRows ?? []).filter((e) => e.votacion_id === id).map((e) => e.unidad_id);
        const universo = propias.length > 0 ? propias : todasLasUnidades;
        const votos = (votosRows ?? []).filter((v) => v.votacion_id === id);
        return [id, calcularAvance(universo, votos, derechosPorUnidad)];
      }),
    );
  }

  let misVotos: Record<string, string> = {};
  if (esCoprop && perfil.unidadId) {
    const { data: votos } = await supabase.from("votos").select("votacion_id, sentido").eq("unidad_id", perfil.unidadId);
    misVotos = Object.fromEntries((votos ?? []).map((v) => [v.votacion_id, v.sentido]));
  }

  const totalDerechos = (unidades ?? []).reduce((a, u) => a + (u.derechos ?? 0), 0);

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
                {votaciones.map((v) => {
                  const avance = avancePorVotacion[v.id];
                  return (
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
                        {gestion && v.abierta && avance && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer list-none text-[11px] font-semibold text-blue-text">Ver avance</summary>
                            <div className="mt-2 flex flex-col gap-1 text-[11px] text-ink-5">
                              <span>
                                <b className="text-ink-2">{avance.votantes}</b> de {avance.universo} unidades ya votaron
                                ({porcentaje(avance.derechosVotados)} de los derechos)
                              </span>
                              <span>A favor: {avance.tally.favor} ({porcentaje(avance.tallyDerechos.favor)})</span>
                              <span>En contra: {avance.tally.contra} ({porcentaje(avance.tallyDerechos.contra)})</span>
                              <span>Abstención: {avance.tally.abst} ({porcentaje(avance.tallyDerechos.abst)})</span>
                              <span>Faltan: {avance.faltan} ({porcentaje(avance.derechosFaltan)})</span>
                            </div>
                          </details>
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
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        {gestion && (
          <Card>
            <div className="mb-4 text-[13px] font-semibold text-ink-2">Nueva votación</div>
            <div className="mb-4 rounded-[10px] bg-surface-2 px-3.5 py-2.5 text-[12px] text-ink-4">
              Hoy hay <b className="text-ink-2">{todasLasUnidades.length}</b> unidades registradas, representando{" "}
              <b className="text-ink-2">{porcentaje(totalDerechos)}</b> de los derechos. Quedarán habilitadas para esta
              votación — si se agrega una unidad después, no podrá participar en ella.
            </div>
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
              <p className="text-[11px] text-ink-5">
                Mayoría simple: {QUORUM_EXPLICACION["Mayoría simple"]} Mayoría absoluta: {QUORUM_EXPLICACION["Mayoría absoluta de los derechos"]}
              </p>
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

function calcularAvance(
  universo: string[],
  votos: { unidad_id: string; sentido: string }[],
  derechosPorUnidad: Map<string, number>,
) {
  const tally = { favor: 0, contra: 0, abst: 0 };
  const tallyDerechos = { favor: 0, contra: 0, abst: 0 };
  for (const voto of votos) {
    const sentido = voto.sentido as "favor" | "contra" | "abst";
    tally[sentido] += 1;
    tallyDerechos[sentido] += derechosPorUnidad.get(voto.unidad_id) ?? 0;
  }
  const votantes = new Set(votos.map((v) => v.unidad_id));
  const faltanIds = universo.filter((id) => !votantes.has(id));
  const derechosVotados = universo.reduce((a, id) => (votantes.has(id) ? a + (derechosPorUnidad.get(id) ?? 0) : a), 0);
  const derechosFaltan = faltanIds.reduce((a, id) => a + (derechosPorUnidad.get(id) ?? 0), 0);

  return {
    universo: universo.length,
    votantes: votantes.size,
    faltan: faltanIds.length,
    derechosVotados,
    derechosFaltan,
    tally,
    tallyDerechos,
  };
}
