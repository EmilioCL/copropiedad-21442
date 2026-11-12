import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, Empty, Field, Input, Select, Table, Td, Textarea, Th } from "@/components/ui";
import { fecha, money } from "@/lib/money";

async function crear(formData: FormData) {
  "use server";
  const perfil = await requireVista("pers");
  const conserjeUserId = String(formData.get("conserje_user_id") ?? "").trim() || null;
  const supabase = await createClient();
  await supabase.from("trabajadores").insert({
    condominio_id: perfil.condominioId,
    nombre: String(formData.get("nombre") ?? "").trim(),
    rut: String(formData.get("rut") ?? "").trim() || null,
    telefono: String(formData.get("telefono") ?? "").trim() || null,
    cargo: String(formData.get("cargo") ?? "").trim(),
    jornada: String(formData.get("jornada") ?? "").trim() || null,
    sueldo: Number(formData.get("sueldo") ?? 0) || null,
    contrato: String(formData.get("contrato") ?? "").trim() || null,
    user_id: conserjeUserId,
  });
  revalidatePath("/pers");
  revalidatePath("/per");
  redirect("/pers");
}

async function alternarActivo(formData: FormData) {
  "use server";
  await requireVista("pers");
  const id = String(formData.get("id"));
  const activo = formData.get("activo") === "true";
  const supabase = await createClient();
  await supabase.from("trabajadores").update({ activo: !activo }).eq("id", id);
  revalidatePath("/pers");
  redirect("/pers");
}

export default async function Page() {
  const perfil = await requireVista("pers");
  const supabase = await createClient();

  const { data: trabajadores } = await supabase
    .from("trabajadores")
    .select("id, nombre, rut, telefono, cargo, jornada, sueldo, contrato, activo, desde, user_id")
    .eq("condominio_id", perfil.condominioId)
    .order("desde", { ascending: false });

  const { data: conserjes } = await supabase
    .from("perfiles")
    .select("user_id, nombre")
    .eq("condominio_id", perfil.condominioId)
    .eq("rol", "conserje");

  const yaVinculados = new Set((trabajadores ?? []).map((t) => t.user_id).filter(Boolean));
  const conserjesSinVincular = (conserjes ?? []).filter((c) => !yaVinculados.has(c.user_id));

  return (
    <>
      <PageHeader
        title="Trabajadores"
        subtitle="Personal contratado para la operación del condominio."
        nota="puedes agregar trabajadores y suspender/restituir su actividad."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {!trabajadores || trabajadores.length === 0 ? (
        <Empty>Aún no hay trabajadores registrados.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Cargo</Th>
              <Th>Jornada</Th>
              <Th>Sueldo</Th>
              <Th>Desde</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {trabajadores.map((t) => (
              <tr key={t.id}>
                <Td className="font-medium text-ink-2">{t.nombre}</Td>
                <Td>{t.cargo}</Td>
                <Td>{t.jornada ?? "—"}</Td>
                <Td>{t.sueldo ? money(t.sueldo) : "—"}</Td>
                <Td>{fecha(t.desde)}</Td>
                <Td>
                  <Badge tone={t.activo ? "success" : "neutral"}>{t.activo ? "Activo" : "Suspendido"}</Badge>
                  {t.user_id && (
                    <span className="ml-1.5">
                      <Badge tone="info">Con acceso</Badge>
                    </span>
                  )}
                </Td>
                <Td>
                  <form action={alternarActivo}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="activo" value={String(t.activo)} />
                    <Button type="submit" variant="secondary" className="text-[11px]">
                      {t.activo ? "Suspender" : "Restituir"}
                    </Button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Card className="mt-6">
        <details>
          <summary className="cursor-pointer list-none text-[13px] font-semibold text-blue-text">+ Nuevo trabajador</summary>
          <form action={crear} className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Nombre">
              <Input name="nombre" required />
            </Field>
            <Field label="Cargo">
              <Input name="cargo" required placeholder="Ej. Conserje" />
            </Field>
            <Field label="RUT">
              <Input name="rut" />
            </Field>
            <Field label="Teléfono">
              <Input name="telefono" />
            </Field>
            <Field label="Jornada">
              <Textarea name="jornada" rows={2} />
            </Field>
            <Field label="Sueldo">
              <Input name="sueldo" type="number" />
            </Field>
            <Field label="Contrato">
              <Input name="contrato" placeholder="Indefinido / Plazo fijo" />
            </Field>
            <Field label="Cuenta de conserje vinculada (opcional)">
              <Select name="conserje_user_id" defaultValue="">
                <option value="">Sin vincular</option>
                {conserjesSinVincular.map((c) => (
                  <option key={c.user_id} value={c.user_id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="col-span-2">
              <Button type="submit">Crear</Button>
            </div>
          </form>
        </details>
      </Card>
    </>
  );
}
