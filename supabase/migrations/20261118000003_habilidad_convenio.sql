-- ═══════════════════════════════════════════════════════════════════
-- Bug detectado al cruzar con el grupo de Julián/Ignacio: v_unidades marcaba
-- una unidad "hábil" en el momento en que se le celebraba el convenio, sin
-- exigir que pagara la primera cuota. Además nunca existió una forma de
-- marcar una cuota de convenio como pagada: `convenio_cuotas.pagada` se creó
-- en el esquema base pero nada la actualizaba.
-- ═══════════════════════════════════════════════════════════════════

create or replace view v_unidades with (security_invoker = true) as
with tot as (select condominio_id, sum(m2) m2_total from unidades group by condominio_id),
deu as (
  select unidad_id,
    sum(monto) filter (where not pagado and not anulado)                         as deuda,
    sum(monto) filter (where not pagado and not anulado and vence <= current_date) as mora,
    count(*)   filter (where not pagado and not anulado and vence <= current_date) as cargos_mora
  from cargos group by unidad_id
),
cv as (select distinct on (unidad_id) unidad_id, id convenio_id from convenios where not caducado order by unidad_id, suscrito desc),
cv_al_dia as (
  -- habilita por convenio solo si la cuota 1 ya está pagada (no basta con tenerlo celebrado)
  select cv.unidad_id from cv cv join convenio_cuotas cc on cc.convenio_id = cv.convenio_id and cc.n = 1 and cc.pagada
)
select u.*,
  round(u.m2 / t.m2_total * 100, 3)          as derechos,
  coalesce(d.deuda, 0)                       as deuda,
  coalesce(d.mora, 0)                        as mora,
  coalesce(d.cargos_mora, 0)                 as cargos_mora,
  cv.convenio_id,
  (coalesce(d.cargos_mora, 0) <= c.tolerancia_cuotas or u.id in (select unidad_id from cv_al_dia)) as habil
from unidades u
join tot t on t.condominio_id = u.condominio_id
join condominios c on c.id = u.condominio_id
left join deu d on d.unidad_id = u.id
left join cv on cv.unidad_id = u.id;

-- Solo el administrador registra el pago de una cuota de convenio (igual que registrar_pago)
create or replace function pagar_cuota_convenio(p_convenio_id uuid, p_n int)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid; v_pagada boolean;
begin
  select cv.condominio_id into c from convenios cv where cv.id = p_convenio_id;
  if c is null then raise exception 'Convenio inexistente'; end if;
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador registra el pago de cuotas'; end if;
  select pagada into v_pagada from convenio_cuotas where convenio_id = p_convenio_id and n = p_n;
  if v_pagada is null then raise exception 'La cuota indicada no existe'; end if;
  if v_pagada then raise exception 'La cuota ya está pagada'; end if;
  update convenio_cuotas set pagada = true where convenio_id = p_convenio_id and n = p_n;
end $$;
