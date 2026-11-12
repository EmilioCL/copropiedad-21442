import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, Empty, Kpi, Table, Td, Th } from "@/components/ui";
import { fechaHora, money, porcentaje } from "@/lib/money";

export default async function Page() {
  const perfil = await requireVista("panel");
  const supabase = await createClient();

  const [{ data: unidades }, { data: fondo }, { data: bitacora }, { data: condo }] = await Promise.all([
    supabase
      .from("v_unidades")
      .select("id, codigo, derechos, deuda, mora, habil")
      .eq("condominio_id", perfil.condominioId),
    supabase.from("v_fondo_saldo").select("saldo").eq("condominio_id", perfil.condominioId).maybeSingle(),
    supabase
      .from("bitacora")
      .select("ts, actor, accion, detalle")
      .eq("condominio_id", perfil.condominioId)
      .order("ts", { ascending: false })
      .limit(10),
    supabase.from("condominios").select("nombre, direccion").eq("id", perfil.condominioId).single(),
  ]);

  const total = unidades?.length ?? 0;
  const habiles = unidades?.filter((u) => u.habil).length ?? 0;
  const morosas = unidades?.filter((u) => (u.mora ?? 0) > 0).length ?? 0;
  const deudaTotal = unidades?.reduce((a, u) => a + (u.mora ?? 0), 0) ?? 0;
  const pctHabiles = total ? (habiles / total) * 100 : 0;
  const derechosHabiles = unidades?.filter((u) => u.habil).reduce((a, u) => a + (u.derechos ?? 0), 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Panel general"
        subtitle={`Resumen normativo y financiero de ${condo?.nombre ?? "tu condominio"} bajo la Ley N° 21.442.`}
        nota={perfil.rol === "comite" ? "vista de fiscalización, sin edición financiera." : "control total del condominio."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Unidades registradas" value={total} hint="2 torres" />
        <Kpi
          label="Unidades hábiles"
          value={`${habiles}/${total}`}
          hint={`${porcentaje(pctHabiles)} de las unidades · ${porcentaje(derechosHabiles)} de los derechos`}
          accent="var(--color-success)"
        />
        <Kpi
          label="Morosidad"
          value={morosas}
          hint={morosas ? `${money(deudaTotal)} en mora` : "Sin unidades morosas"}
          accent="var(--color-warn-accent)"
        />
        <Kpi label="Fondo de reserva" value={money(fondo?.saldo ?? 0)} accent="var(--color-copper)" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Actividad reciente</div>
          {!bitacora || bitacora.length === 0 ? (
            <Empty>Aún no hay operaciones registradas en la bitácora.</Empty>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {bitacora.map((b, i) => (
                <li key={i} className="flex items-start gap-3 border-b border-[#F0EEE9] pb-3.5 last:border-b-0 last:pb-0">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-blue-text" />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[12.5px] font-medium text-ink-2">{b.accion}</span>
                    <span className="text-[11.5px] text-ink-5">
                      {b.actor} · {fechaHora(b.ts)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Composición de la cartera</div>
          {!unidades || unidades.length === 0 ? (
            <Empty>Sin unidades.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Unidad</Th>
                  <Th>Derechos</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {unidades
                  .slice()
                  .sort((a, b) => (b.derechos ?? 0) - (a.derechos ?? 0))
                  .slice(0, 8)
                  .map((u) => (
                    <tr key={u.id}>
                      <Td className="font-medium text-ink-2">{u.codigo}</Td>
                      <Td>{porcentaje(u.derechos)}</Td>
                      <Td>
                        <Badge tone={u.habil ? "success" : "danger"}>{u.habil ? "Hábil" : "Inhábil"}</Badge>
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
