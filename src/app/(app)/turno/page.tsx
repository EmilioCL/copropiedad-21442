import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Select } from "@/components/ui";
import { fechaHora } from "@/lib/money";

async function abrirTurno(formData: FormData) {
  "use server";
  const perfil = await requireVista("turno");
  const trabajador_id = String(formData.get("trabajador_id") ?? "");
  if (!trabajador_id) redirect("/turno?error=" + encodeURIComponent("No se encontró tu ficha de trabajador."));

  const supabase = await createClient();
  const { error } = await supabase.from("turnos").insert({
    condominio_id: perfil.condominioId,
    trabajador_id,
    folio: `TU-${Date.now()}`,
  });
  if (error) redirect("/turno?error=" + encodeURIComponent("Ya hay un turno abierto en el condominio."));
  revalidatePath("/turno");
  redirect("/turno");
}

async function cerrarTurno(formData: FormData) {
  "use server";
  await requireVista("turno");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("turnos").update({ fin: new Date().toISOString() }).eq("id", id);
  revalidatePath("/turno");
  redirect("/turno");
}

async function agregarNovedad(formData: FormData) {
  "use server";
  await requireVista("turno");
  const turno_id = String(formData.get("turno_id"));
  const tipo = String(formData.get("tipo") ?? "General");
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) redirect("/turno?error=" + encodeURIComponent("Describe la novedad."));

  const supabase = await createClient();
  await supabase.from("novedades").insert({ turno_id, folio: `NV-${Date.now()}`, tipo, texto });
  revalidatePath("/turno");
  redirect("/turno");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("turno");
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: trabajador }, { data: turno }] = await Promise.all([
    supabase.from("trabajadores").select("id, nombre").eq("user_id", perfil.userId).maybeSingle(),
    supabase
      .from("turnos")
      .select("id, folio, inicio, trabajadores(nombre)")
      .eq("condominio_id", perfil.condominioId)
      .is("fin", null)
      .maybeSingle(),
  ]);

  const { data: novedades } = turno
    ? await supabase.from("novedades").select("id, tipo, texto, ts").eq("turno_id", turno.id).order("ts", { ascending: false })
    : { data: [] };

  const ultimaNovedad = novedades?.[0];
  const novedadVencida = ultimaNovedad
    ? Date.now() - new Date(ultimaNovedad.ts).getTime() > 60 * 60 * 1000
    : turno
      ? Date.now() - new Date(turno.inicio).getTime() > 60 * 60 * 1000
      : false;

  return (
    <>
      <PageHeader
        title="Mi turno"
        subtitle="Apertura y cierre de turno, con novedades horarias obligatorias."
        nota="solo puede haber un turno abierto por condominio."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      {!turno ? (
        <Card>
          <div className="mb-3 text-[13px] font-semibold text-ink-2">No hay un turno abierto</div>
          {!trabajador ? (
            <Empty>Tu usuario no está vinculado a una ficha de trabajador. Pide al administrador que te agregue en “Trabajadores”.</Empty>
          ) : (
            <form action={abrirTurno}>
              <input type="hidden" name="trabajador_id" value={trabajador.id} />
              <Button type="submit">Abrir turno</Button>
            </form>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" style={{ animation: "pulseDot 2.2s ease-out infinite" }} />
                  <span className="text-[13px] font-semibold text-ink-2">Turno {turno.folio} abierto</span>
                </div>
                <span className="text-[12px] text-ink-5">
                  {(turno.trabajadores as unknown as { nombre: string } | null)?.nombre} · desde {fechaHora(turno.inicio)}
                </span>
              </div>
              {novedadVencida && <Badge tone="warn">Novedad vencida — registra una ahora</Badge>}
              <form action={cerrarTurno}>
                <input type="hidden" name="id" value={turno.id} />
                <Button type="submit" variant="danger">
                  Cerrar turno
                </Button>
              </form>
            </div>
          </Card>

          <Card>
            <div className="mb-4 text-[13px] font-semibold text-ink-2">Registrar novedad</div>
            <form action={agregarNovedad} className="flex flex-col gap-3">
              <input type="hidden" name="turno_id" value={turno.id} />
              <div className="grid grid-cols-[160px_1fr] gap-3">
                <Field label="Tipo">
                  <Select name="tipo" defaultValue="General">
                    <option>General</option>
                    <option>Incidente</option>
                    <option>Mantención</option>
                    <option>Seguridad</option>
                  </Select>
                </Field>
                <Field label="Descripción">
                  <Input name="texto" required />
                </Field>
              </div>
              <Button type="submit" className="self-start">Agregar novedad</Button>
            </form>

            <div className="mt-5 flex flex-col gap-3">
              {!novedades || novedades.length === 0 ? (
                <Empty>Sin novedades registradas en este turno.</Empty>
              ) : (
                novedades.map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-3 border-b border-[#F0EEE9] pb-3 last:border-b-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12.5px] font-medium text-ink-2">{n.texto}</span>
                      <span className="text-[11px] text-ink-5">{fechaHora(n.ts)}</span>
                    </div>
                    <Badge tone="neutral">{n.tipo}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
