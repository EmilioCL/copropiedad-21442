import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Empty } from "@/components/ui";
import { fechaHora } from "@/lib/money";

async function marcarLeida(formData: FormData) {
  "use server";
  await requireVista("not");
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
  revalidatePath("/not");
  redirect("/not");
}

export default async function Page() {
  const perfil = await requireVista("not");
  const supabase = await createClient();

  const { data: notifs } = await supabase
    .from("notificaciones")
    .select("id, titulo, cuerpo, leida, ts")
    .eq("condominio_id", perfil.condominioId)
    .order("ts", { ascending: false })
    .limit(50);

  return (
    <>
      <PageHeader
        title="Notificaciones"
        subtitle="Avisos del sistema para tu perfil."
        nota="las notificaciones no leídas aparecen destacadas."
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      {!notifs || notifs.length === 0 ? (
        <Empty>No tienes notificaciones.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifs.map((n) => (
            <li
              key={n.id}
              className="flex items-start justify-between gap-4 rounded-card border border-border-soft bg-surface p-4"
              style={!n.leida ? { borderColor: "var(--color-blue)" } : undefined}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {!n.leida && <span className="h-1.5 w-1.5 rounded-full bg-blue-text" />}
                  <span className="text-[13px] font-semibold text-ink-2">{n.titulo}</span>
                </div>
                {n.cuerpo && <span className="text-[12.5px] text-ink-5">{n.cuerpo}</span>}
                <span className="text-[11px] text-ink-6">{fechaHora(n.ts)}</span>
              </div>
              {!n.leida && (
                <form action={marcarLeida}>
                  <input type="hidden" name="id" value={n.id} />
                  <Button type="submit" variant="ghost" className="text-[11px]">
                    Marcar leída
                  </Button>
                </form>
              )}
              {n.leida && <Badge tone="neutral">Leída</Badge>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
