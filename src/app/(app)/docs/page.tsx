import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { fecha } from "@/lib/money";

async function publicar(formData: FormData) {
  "use server";
  const perfil = await requireVista("docs");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "").trim();
  const nota = String(formData.get("nota") ?? "").trim() || null;
  const publico = formData.get("publico") === "on";
  const archivo = formData.get("archivo") as File | null;

  if (!titulo) redirect("/docs?error=" + encodeURIComponent("Indica un título."));
  if (!archivo || archivo.size === 0) {
    redirect("/docs?error=" + encodeURIComponent("Adjunta el archivo (PDF o Word) del documento."));
  }

  const supabase = await createClient();
  const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${perfil.condominioId}/${Date.now()}-${nombreLimpio}`;

  const { error: errorSubida } = await supabase.storage.from("documentos").upload(path, archivo, {
    contentType: archivo.type || undefined,
  });
  if (errorSubida) redirect("/docs?error=" + encodeURIComponent("No se pudo subir el archivo."));

  const { error } = await supabase.from("documentos").insert({
    condominio_id: perfil.condominioId,
    titulo,
    tipo,
    nota,
    publico,
    storage_path: path,
  });
  if (error) redirect("/docs?error=" + encodeURIComponent("No se pudo publicar el documento."));

  revalidatePath("/docs");
  redirect("/docs");
}

async function eliminar(formData: FormData) {
  "use server";
  await requireVista("docs");
  const id = String(formData.get("id"));
  const storagePath = String(formData.get("storage_path") ?? "");

  const supabase = await createClient();
  if (storagePath) {
    await supabase.storage.from("documentos").remove([storagePath]);
  }
  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) redirect("/docs?error=" + encodeURIComponent("No se pudo eliminar el documento."));

  revalidatePath("/docs");
  redirect("/docs");
}

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("docs");
  const { error } = await searchParams;
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";

  const { data: documentosBase } = await supabase
    .from("documentos")
    .select("id, titulo, tipo, nota, publico, fecha, storage_path")
    .eq("condominio_id", perfil.condominioId)
    .order("fecha", { ascending: false });

  const documentos = await Promise.all(
    (documentosBase ?? []).map(async (d) => {
      if (!d.storage_path) return { ...d, url: null as string | null };
      const { data } = await supabase.storage.from("documentos").createSignedUrl(d.storage_path, 60 * 10);
      return { ...d, url: data?.signedUrl ?? null };
    }),
  );

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle="Documentos públicos (todos los roles) y reservados (solo administración y comité)."
        nota={esAdmin ? "puedes publicar nuevos documentos." : "ves los documentos que tu perfil permite."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      {!documentos || documentos.length === 0 ? (
        <Empty>No hay documentos publicados.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Documento</Th>
              <Th>Tipo</Th>
              <Th>Fecha</Th>
              <Th>Visibilidad</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((d) => (
              <tr key={d.id}>
                <Td className="font-medium text-ink-2">
                  {d.titulo}
                  {d.nota && <div className="text-[11px] font-normal text-ink-5">{d.nota}</div>}
                </Td>
                <Td>{d.tipo}</Td>
                <Td>{fecha(d.fecha)}</Td>
                <Td>
                  <Badge tone={d.publico ? "success" : "neutral"}>{d.publico ? "Público" : "Reservado"}</Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-blue-text hover:underline">
                        Ver / descargar
                      </a>
                    )}
                    {esAdmin && (
                      <form action={eliminar}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="storage_path" value={d.storage_path ?? ""} />
                        <ConfirmButton
                          mensaje={`¿Seguro que quieres eliminar "${d.titulo}"? Esta acción no se puede deshacer.`}
                          className="px-2.5 py-1 text-[11px]"
                        >
                          Eliminar
                        </ConfirmButton>
                      </form>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {esAdmin && (
        <Card className="mt-6">
          <details>
            <summary className="cursor-pointer list-none text-[13px] font-semibold text-blue-text">+ Publicar documento</summary>
            <form action={publicar} className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Título">
                <Input name="titulo" required />
              </Field>
              <Field label="Tipo">
                <Select name="tipo" defaultValue="Reglamento">
                  <option>Reglamento</option>
                  <option>Acta</option>
                  <option>Circular</option>
                  <option>Comprobante</option>
                  <option>Certificado</option>
                  <option>Otro</option>
                </Select>
              </Field>
              <Field label="Archivo (PDF o Word)">
                <Input
                  type="file"
                  name="archivo"
                  accept=".pdf,.doc,.docx"
                  required
                  className="file:mr-3 file:rounded-control file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
                />
              </Field>
              <Field label="Nota (opcional)">
                <Textarea name="nota" rows={2} />
              </Field>
              <label className="col-span-2 flex items-center gap-2 text-[12.5px] text-ink-4">
                <input type="checkbox" name="publico" defaultChecked /> Visible para todos los roles
              </label>
              <div className="col-span-2">
                <Button type="submit">Publicar</Button>
              </div>
            </form>
          </details>
        </Card>
      )}
    </>
  );
}
