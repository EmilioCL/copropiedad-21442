-- ═══════════════════════════════════════════════════════════════════
-- Grupo de Ignacio: las multas deben expresarse en UTM (tope 1-3, 1-6 si hay
-- reincidencia en los últimos 12 meses) y lo recaudado debe ingresar al Fondo
-- de Reserva al pagarse. Hoy `multas` solo tenía un monto en pesos libre, sin
-- tope, y no existía forma de pagarlas ni de que afectaran el Fondo.
-- ═══════════════════════════════════════════════════════════════════

alter table condominios add column if not exists valor_utm numeric not null default 68000;
alter table multas add column if not exists monto_utm numeric;
alter table multas add column if not exists pagada boolean not null default false;
alter table multas add column if not exists pagada_en timestamptz;

create or replace function cursar_multa(c uuid, u uuid, p_infraccion text, p_detalle text, p_monto_utm numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_valor_utm numeric; v_tope numeric; v_reincidente boolean; v_monto numeric; m uuid;
begin
  if rol_en(c) not in ('administrador', 'conserje') then raise exception 'Solo administración o conserjería cursan multas'; end if;
  if p_monto_utm is null or p_monto_utm <= 0 then raise exception 'Indica el monto de la multa en UTM'; end if;
  select valor_utm into v_valor_utm from condominios where id = c;

  select exists (
    select 1 from multas where unidad_id = u and estado in ('cursada', 'confirmada') and ts > now() - interval '12 months'
  ) into v_reincidente;
  v_tope := case when v_reincidente then 6 else 3 end;
  if p_monto_utm < 1 or p_monto_utm > v_tope then
    raise exception 'La multa debe estar entre 1 y % UTM', v_tope;
  end if;

  v_monto := round(p_monto_utm * v_valor_utm);
  insert into multas (condominio_id, unidad_id, folio, infraccion, detalle, monto, monto_utm, cursada_por)
  values (c, u, 'MU-' || to_char(now(), 'YYYYMMDDHH24MISS'), p_infraccion, p_detalle, v_monto, p_monto_utm, auth.uid())
  returning id into m;
  return m;
end $$;

create or replace function pagar_multa(m uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid; v_monto numeric; v_estado multa_estado_t; v_pagada boolean; v_folio text;
begin
  select condominio_id, monto, estado, pagada, folio into c, v_monto, v_estado, v_pagada, v_folio from multas where id = m;
  if c is null then raise exception 'Multa inexistente'; end if;
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador registra el pago de multas'; end if;
  if v_estado = 'anulada' then raise exception 'La multa fue anulada; no es exigible'; end if;
  if v_estado = 'apelada' then raise exception 'La multa está en apelación'; end if;
  if v_pagada then raise exception 'La multa ya fue pagada'; end if;

  update multas set pagada = true, pagada_en = now() where id = m;
  insert into fondo_movimientos (condominio_id, folio, tipo, concepto, monto, autoriza)
  values (c, 'FR-' || to_char(now(), 'YYYYMMDDHH24MISS'), 'Aporte', 'Multa ' || v_folio || ' pagada', v_monto, 'Administración');
end $$;

-- Regla 15 ampliada: tampoco resuelve el comité la apelación de su propia unidad
create or replace function multa_resolver(m uuid, p_estado multa_estado_t, p_resolucion text)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid; est multa_estado_t; v_unidad uuid;
begin
  select condominio_id, estado, unidad_id into c, est, v_unidad from multas where id = m;
  if c is null then raise exception 'Multa inexistente'; end if;
  if rol_en(c) <> 'comite' then raise exception 'Solo el comité resuelve apelaciones'; end if;
  if mi_unidad(c) = v_unidad then raise exception 'No puedes resolver la apelación de tu propia unidad'; end if;
  if est <> 'apelada' then raise exception 'Solo se resuelven multas apeladas'; end if;
  if p_estado not in ('confirmada', 'anulada') then raise exception 'Resolución inválida'; end if;
  update multas set estado = p_estado, resolucion = p_resolucion where id = m;
end $$;
