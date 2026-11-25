import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Table, Td, Textarea, Th } from "@/components/ui";
import { NOMBRE_ROL } from "@/lib/permisos";
import { fechaHora } from "@/lib/money";

async function crear(formData: FormData) {
  "use server";
  const perfil = await requireVista("soporte");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const pagina = String(formData.get("pagina") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.rpc("crear_reporte", {
    c: perfil.condominioId,
    p_titulo: titulo,
    p_descripcion: descripcion,
    p_pagina: pagina,
  });

  if (error) redirect("/soporte?error=" + encodeURIComponent(error.message));
  revalidatePath("/soporte");
  redirect("/soporte?ok=1");
}

async function resolver(formData: FormData) {
  "use server";
  await requireVista("soporte");
  const id = String(formData.get("id"));
  const respuesta = String(formData.get("respuesta") ?? "").trim() || undefined;

  const supabase = await createClient();
  const { error } = await supabase.rpc("reporte_resolver", { p_id: id, p_respuesta: respuesta });
  if (error) redirect("/soporte?error=" + encodeURIComponent(error.message));
  revalidatePath("/soporte");
  redirect("/soporte");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const perfil = await requireVista("soporte");
  const { error, ok } = await searchParams;
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";

  const { data: reportes } = await supabase
    .from("reportes")
    .select("id, rol_creador, titulo, descripcion, pagina, resuelto, respuesta, creado_en")
    .eq("condominio_id", perfil.condominioId)
    .order("creado_en", { ascending: false });

  return (
    <>
      <PageHeader
        title="Reportar un error"
        subtitle="Si encuentras algo que no funciona bien, cuéntalo acá. Queda registrado para que el administrador lo revise."
        nota={esAdmin ? "ves los reportes de todos y puedes marcarlos como resueltos." : "ves el estado de tus propios reportes."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}
      {ok && <div className="mb-5 text-[12.5px] font-medium text-success">Reporte enviado — gracias por avisar.</div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Nuevo reporte</div>
          <form action={crear} className="flex flex-col gap-4">
            <Field label="¿Qué encontraste? (título breve)">
              <Input name="titulo" required placeholder="Ej. El botón de pagar multa no hace nada" />
            </Field>
            <Field label="¿Dónde pasó? (opcional)">
              <Input name="pagina" placeholder="Ej. Multas, Convenio de pago, Votaciones" />
            </Field>
            <Field label="Describe qué pasó">
              <Textarea name="descripcion" rows={5} required placeholder="Qué hiciste, qué esperabas que pasara, y qué pasó en vez de eso" />
            </Field>
            <Button type="submit">Enviar reporte</Button>
          </form>
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">{esAdmin ? "Reportes de todos" : "Mis reportes"}</div>
          {!reportes || reportes.length === 0 ? (
            <Empty>{esAdmin ? "Aún no hay reportes." : "No has enviado ningún reporte."}</Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {reportes.map((r) => (
                <div key={r.id} className="rounded-card border border-border-soft p-3.5">
                  <div className="mb-1.5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink-2">{r.titulo}</span>
                      {esAdmin && <Badge tone="neutral">{NOMBRE_ROL[r.rol_creador as keyof typeof NOMBRE_ROL]}</Badge>}
                    </div>
                    <Badge tone={r.resuelto ? "success" : "warn"}>{r.resuelto ? "Resuelto" : "Abierto"}</Badge>
                  </div>
                  {r.pagina && <div className="mb-1 text-[11px] text-ink-5">Sección: {r.pagina}</div>}
                  <p className="mb-2 text-[12.5px] text-ink-4">{r.descripcion}</p>
                  <div className="text-[11px] text-ink-6">{fechaHora(r.creado_en)}</div>

                  {r.respuesta && (
                    <div className="mt-2.5 rounded-[10px] bg-surface-2 px-3 py-2 text-[12px] text-ink-3">
                      <b className="text-ink-2">Respuesta del administrador:</b> {r.respuesta}
                    </div>
                  )}

                  {esAdmin && !r.resuelto && (
                    <details className="mt-2.5">
                      <summary className="cursor-pointer list-none text-[11px] font-semibold text-blue-text">Marcar resuelto</summary>
                      <form action={resolver} className="mt-2 flex flex-col gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <Textarea name="respuesta" rows={2} placeholder="Respuesta para quien reportó (opcional)" />
                        <Button type="submit" variant="secondary" className="self-start text-[11px]">
                          Marcar como resuelto
                        </Button>
                      </form>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
