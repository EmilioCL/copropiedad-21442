import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button, Card, Empty, Field, FormError, Input, Select, Table, Td, Th } from "@/components/ui";
import { fecha } from "@/lib/money";

async function crearEspacio(formData: FormData) {
  "use server";
  const perfil = await requireVista("esp");
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) redirect("/esp?error=" + encodeURIComponent("Indica el nombre del espacio."));
  const supabase = await createClient();
  const { error } = await supabase.from("espacios").insert({ condominio_id: perfil.condominioId, nombre });
  if (error) redirect("/esp?error=" + encodeURIComponent("No se pudo crear el espacio."));
  revalidatePath("/esp");
  redirect("/esp");
}

async function reservar(formData: FormData) {
  "use server";
  const perfil = await requireVista("esp");
  if (!perfil.unidadId) redirect("/esp?error=" + encodeURIComponent("Tu perfil no tiene una unidad asociada."));

  const espacio_id = String(formData.get("espacio_id") ?? "");
  const fecha_r = String(formData.get("fecha") ?? "");
  const bloque = String(formData.get("bloque") ?? "");
  if (!espacio_id || !fecha_r || !bloque) {
    redirect("/esp?error=" + encodeURIComponent("Completa espacio, fecha y bloque."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reservas").insert({
    espacio_id,
    unidad_id: perfil.unidadId,
    folio: `RS-${Date.now()}`,
    fecha: fecha_r,
    bloque,
  });

  if (error) {
    redirect(
      "/esp?error=" +
        encodeURIComponent(
          error.message.includes("duplicate") ? "Ese espacio ya está reservado en esa fecha y bloque." : "No se pudo reservar (¿estás inhábil?).",
        ),
    );
  }
  revalidatePath("/esp");
  redirect("/esp");
}

const BLOQUES = ["09:00–12:00", "12:00–15:00", "15:00–18:00", "18:00–21:00"];

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const perfil = await requireVista("esp");
  const { error } = await searchParams;
  const supabase = await createClient();
  const esAdmin = perfil.rol === "administrador";
  const esCoprop = perfil.rol === "copropietario";

  const [{ data: espacios }, { data: reservas }] = await Promise.all([
    supabase.from("espacios").select("id, nombre").eq("condominio_id", perfil.condominioId).order("nombre"),
    supabase
      .from("reservas")
      .select("id, folio, fecha, bloque, espacios(nombre), unidades(codigo)")
      .gte("fecha", new Date().toISOString().slice(0, 10))
      .order("fecha")
      .limit(30),
  ]);

  return (
    <>
      <PageHeader
        title="Espacios comunes"
        subtitle="Reserva de espacios comunes por fecha y bloque horario. Un bloque por espacio y fecha; la unidad inhábil no puede reservar."
        nota={esCoprop ? "puedes reservar un bloque disponible." : "vista de las próximas reservas."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {error && <div className="mb-5"><FormError>{error}</FormError></div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Próximas reservas</div>
          {!reservas || reservas.length === 0 ? (
            <Empty>No hay reservas próximas.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Espacio</Th>
                  <Th>Unidad</Th>
                  <Th>Fecha</Th>
                  <Th>Bloque</Th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr key={r.id}>
                    <Td className="font-medium text-ink-2">{(r.espacios as unknown as { nombre: string } | null)?.nombre}</Td>
                    <Td>{(r.unidades as unknown as { codigo: string } | null)?.codigo}</Td>
                    <Td>{fecha(r.fecha)}</Td>
                    <Td>{r.bloque}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          {esCoprop && (
            <Card>
              <div className="mb-4 text-[13px] font-semibold text-ink-2">Reservar</div>
              <form action={reservar} className="flex flex-col gap-4">
                <Field label="Espacio">
                  <Select name="espacio_id" required>
                    <option value="">Selecciona…</option>
                    {(espacios ?? []).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Fecha">
                  <Input name="fecha" type="date" required min={new Date().toISOString().slice(0, 10)} />
                </Field>
                <Field label="Bloque">
                  <Select name="bloque" required>
                    {BLOQUES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit">Reservar</Button>
              </form>
            </Card>
          )}

          {esAdmin && (
            <Card>
              <details>
                <summary className="cursor-pointer list-none text-[13px] font-semibold text-blue-text">+ Nuevo espacio</summary>
                <form action={crearEspacio} className="mt-4 flex flex-col gap-4">
                  <Field label="Nombre">
                    <Input name="nombre" required placeholder="Ej. Quincho" />
                  </Field>
                  <Button type="submit">Crear</Button>
                </form>
              </details>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
