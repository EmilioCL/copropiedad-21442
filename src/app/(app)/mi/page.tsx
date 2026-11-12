import { requireVista } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, Empty, Kpi, Table, Td, Th } from "@/components/ui";
import { fecha, money, porcentaje } from "@/lib/money";

export default async function Page() {
  const perfil = await requireVista("mi");
  const supabase = await createClient();

  if (!perfil.unidadId) {
    return (
      <>
        <PageHeader
          title="Mi unidad"
          subtitle="Tu estado de cuenta, tu convenio de pago y las próximas citaciones."
          nota="tu perfil no tiene una unidad asignada."
          rol={perfil.rol}
          nombre={perfil.nombre}
        />
        <Empty>Tu cuenta no tiene una unidad asociada. Contacta al administrador.</Empty>
      </>
    );
  }

  const [{ data: unidad }, { data: cargos }, { data: convenio }, { data: asambleas }] = await Promise.all([
    supabase.from("v_unidades").select("*").eq("id", perfil.unidadId).single(),
    supabase
      .from("cargos")
      .select("id, periodo, monto, vence, pagado, anulado, origen")
      .eq("unidad_id", perfil.unidadId)
      .eq("pagado", false)
      .eq("anulado", false)
      .order("vence"),
    supabase
      .from("convenios")
      .select("id, folio, deuda, cuotas, valor_cuota, caducado, convenio_cuotas(n, vence, monto, pagada)")
      .eq("unidad_id", perfil.unidadId)
      .eq("caducado", false)
      .order("suscrito", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("asambleas")
      .select("id, folio, tipo, citacion, fecha, hora, lugar, validada")
      .eq("condominio_id", perfil.condominioId)
      .gte("fecha", new Date().toISOString().slice(0, 10))
      .order("fecha"),
  ]);

  return (
    <>
      <PageHeader
        title="Mi unidad"
        subtitle={`Unidad ${unidad?.codigo ?? ""} · ${unidad?.propietario ?? ""}`}
        nota={unidad?.habil ? "estás hábil para votar." : "estás inhábil por gastos comunes impagos."}
        rol={perfil.rol}
        nombre={perfil.nombre}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Derechos" value={porcentaje(unidad?.derechos)} />
        <Kpi label="Deuda vigente" value={money(unidad?.deuda)} accent={unidad?.deuda ? "var(--color-warn-accent)" : undefined} />
        <Kpi label="Mora" value={money(unidad?.mora)} accent={unidad?.mora ? "var(--color-danger, #A8432F)" : undefined} />
        <Kpi label="Habilidad" value={unidad?.habil ? "Hábil" : "Inhábil"} accent={unidad?.habil ? "var(--color-success)" : "var(--color-warn-accent)"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Cargos pendientes</div>
          {!cargos || cargos.length === 0 ? (
            <Empty>No tienes cargos pendientes.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Período</Th>
                  <Th>Vence</Th>
                  <Th>Monto</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {cargos.map((c) => {
                  const vencido = new Date(c.vence) <= new Date();
                  return (
                    <tr key={c.id}>
                      <Td>{c.periodo}</Td>
                      <Td>{fecha(c.vence)}</Td>
                      <Td>{money(c.monto)}</Td>
                      <Td>
                        <Badge tone={vencido ? "danger" : "warn"}>{vencido ? "En mora" : "Por vencer"}</Badge>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <div className="mb-4 text-[13px] font-semibold text-ink-2">Convenio de pago</div>
          {!convenio ? (
            <Empty>
              No tienes un convenio vigente.
              {unidad?.deuda ? " Puedes proponer uno en “Repactar mi deuda”." : ""}
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-[12.5px] text-ink-5">
                Folio <b className="text-ink-2">{convenio.folio}</b> · {convenio.cuotas} cuotas de {money(convenio.valor_cuota)}
              </div>
              <Table>
                <thead>
                  <tr>
                    <Th>Cuota</Th>
                    <Th>Vence</Th>
                    <Th>Monto</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody>
                  {(convenio.convenio_cuotas ?? [])
                    .sort((a, b) => a.n - b.n)
                    .map((c) => (
                      <tr key={c.n}>
                        <Td>{c.n}</Td>
                        <Td>{fecha(c.vence)}</Td>
                        <Td>{money(c.monto)}</Td>
                        <Td>
                          <Badge tone={c.pagada ? "success" : "neutral"}>{c.pagada ? "Pagada" : "Pendiente"}</Badge>
                        </Td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <div className="mb-4 text-[13px] font-semibold text-ink-2">Próximas citaciones</div>
        {!asambleas || asambleas.length === 0 ? (
          <Empty>No hay asambleas citadas.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {asambleas.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 border-b border-[#F0EEE9] pb-3 last:border-b-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12.5px] font-medium text-ink-2">
                    {a.tipo} · {a.citacion} citación — {a.folio}
                  </span>
                  <span className="text-[11.5px] text-ink-5">
                    {fecha(a.fecha)} {a.hora} · {a.lugar}
                  </span>
                </div>
                <Badge tone={a.validada ? "success" : "neutral"}>{a.validada ? "Validada" : "Por validar"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
