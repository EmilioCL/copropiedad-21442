import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, Input, Select, Table, Td, Th } from "@/components/ui";
import { fecha } from "@/lib/money";

async function crear(formData: FormData) {
  "use server";
  const perfil = await requireVista("mant");
  const supabase = await createClient();
  await supabase.from("mantenciones").insert({
    condominio_id: perfil.condominioId,
    equipo: String(formData.get("equipo") ?? "").trim(),
    proveedor: String(formData.get("proveedor") ?? "").trim() || null,
    periodicidad: String(formData.get("periodicidad") ?? "Mensual") as "Mensual" | "Trimestral" | "Semestral" | "Anual",
    proxima: String(formData.get("proxima") ?? new Date().toISOString().slice(0, 10)),
    critico: formData.get("critico") === "on",
  });
  revalidatePath("/mant");
  redirect("/mant");
}

async function certificar(formData: FormData) {
  "use server";
  await requireVista("mant");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.rpc("mantencion_certificar", { m: id });
  revalidatePath("/mant");
  redirect("/mant");
}

export default async function Page() {
  const perfil = await requireVista("mant");
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";
  const puedeCertificar = perfil.rol === "administrador" || perfil.rol === "conserje";

  const { data: mantenciones } = await supabase
    .from("mantenciones")
    .select("id, equipo, proveedor, periodicidad, ultima, proxima, critico")
    .eq("condominio_id", perfil.condominioId)
    .order("proxima");

  const hoy = new Date();

  return (
    <>
      <PageHeader
        title="Mantenciones"
        subtitle="Plan de mantenciones críticas. Certificar reprograma la próxima fecha según la periodicidad."
        nota={puedeCertificar ? "puedes certificar una mantención." : "vista de fiscalización."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {!mantenciones || mantenciones.length === 0 ? (
        <Empty>No hay mantenciones registradas.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Equipo</Th>
              <Th>Proveedor</Th>
              <Th>Periodicidad</Th>
              <Th>Última</Th>
              <Th>Próxima</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {mantenciones.map((m) => {
              const vencida = new Date(m.proxima) <= hoy;
              return (
                <tr key={m.id}>
                  <Td className="font-medium text-ink-2">
                    {m.equipo}
                    {m.critico && (
                      <span className="ml-2">
                        <Badge tone="danger">Crítico</Badge>
                      </span>
                    )}
                  </Td>
                  <Td>{m.proveedor ?? "—"}</Td>
                  <Td>{m.periodicidad}</Td>
                  <Td>{fecha(m.ultima)}</Td>
                  <Td>
                    <Badge tone={vencida ? "warn" : "neutral"}>{fecha(m.proxima)}</Badge>
                  </Td>
                  <Td>
                    {puedeCertificar && (
                      <form action={certificar}>
                        <input type="hidden" name="id" value={m.id} />
                        <Button type="submit" variant="secondary" className="text-[11px]">
                          Certificar
                        </Button>
                      </form>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {esAdmin && (
        <Card className="mt-6">
          <details>
            <summary className="cursor-pointer list-none text-[13px] font-semibold text-blue-text">+ Nueva mantención</summary>
            <form action={crear} className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Equipo">
                <Input name="equipo" required />
              </Field>
              <Field label="Proveedor">
                <Input name="proveedor" />
              </Field>
              <Field label="Periodicidad">
                <Select name="periodicidad" defaultValue="Mensual">
                  <option>Mensual</option>
                  <option>Trimestral</option>
                  <option>Semestral</option>
                  <option>Anual</option>
                </Select>
              </Field>
              <Field label="Próxima fecha">
                <Input name="proxima" type="date" required />
              </Field>
              <label className="col-span-2 flex items-center gap-2 text-[12.5px] text-ink-4">
                <input type="checkbox" name="critico" /> Equipo crítico
              </label>
              <div className="col-span-2">
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </details>
        </Card>
      )}
    </>
  );
}
