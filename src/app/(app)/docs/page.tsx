import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { fecha } from "@/lib/money";

async function publicar(formData: FormData) {
  "use server";
  const perfil = await requireVista("docs");
  const supabase = await createClient();
  await supabase.from("documentos").insert({
    condominio_id: perfil.condominioId,
    titulo: String(formData.get("titulo") ?? "").trim(),
    tipo: String(formData.get("tipo") ?? "").trim(),
    nota: String(formData.get("nota") ?? "").trim() || null,
    publico: formData.get("publico") === "on",
  });
  revalidatePath("/docs");
  redirect("/docs");
}

export default async function Page() {
  const perfil = await requireVista("docs");
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, titulo, tipo, nota, publico, fecha")
    .eq("condominio_id", perfil.condominioId)
    .order("fecha", { ascending: false });

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle="Documentos públicos (todos los roles) y reservados (solo administración y comité)."
        nota={esAdmin ? "puedes publicar nuevos documentos." : "ves los documentos que tu perfil permite."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

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
              <Field label="Nota (opcional)">
                <Textarea name="nota" rows={2} />
              </Field>
              <label className="flex items-center gap-2 text-[12.5px] text-ink-4">
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
