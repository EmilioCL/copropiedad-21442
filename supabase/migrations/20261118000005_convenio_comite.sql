-- ═══════════════════════════════════════════════════════════════════
-- Grupo de Julián (código real) e Ignacio (PRD): un convenio de pago no debe
-- quedar vigente por la sola decisión del administrador; el comité debe
-- aprobarlo. Hoy el administrador "celebraba" el convenio directo (tabla
-- propuestas_convenio solo la usaban comité/copropietario, y el propio
-- administrador la "resolvía"). Se unifica todo en un solo camino:
--   proponer_convenio()  → Pendiente (cualquier rol la puede originar)
--   aprobar/rechazar_propuesta_convenio()  → solo el comité decide
-- Se agregan también las dos reglas que ambos grupos exigían y que no
-- existían: bloqueo de 12 meses tras un incumplimiento, y no permitir una
-- segunda propuesta/convenio mientras ya hay uno pendiente o vigente.
-- ═══════════════════════════════════════════════════════════════════

drop function if exists celebrar_convenio(uuid, uuid, numeric, int, text);

create or replace function proponer_convenio(c uuid, u uuid, p_pie numeric, p_cuotas int, p_motivo text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_rol rol_t;
  v_origen propuesta_origen_t;
  v_deuda numeric;
  v_convenio_id uuid;
  v_cuota numeric;
  v_ult_caducado date;
  v_pendientes int;
  v_id uuid;
begin
  v_rol := rol_en(c);
  if v_rol = 'comite' then v_origen := 'Comité';
  elsif v_rol = 'administrador' then v_origen := 'Administrador';
  elsif v_rol = 'copropietario' and u = mi_unidad(c) then v_origen := 'Copropietario';
  else raise exception 'No autorizado para proponer un convenio para esta unidad'; end if;

  if p_cuotas < 2 or p_cuotas > 18 then raise exception 'Las cuotas deben ser entre 2 y 18'; end if;

  select deuda, convenio_id into v_deuda, v_convenio_id from v_unidades where id = u;
  if v_deuda is null or v_deuda <= 0 then raise exception 'La unidad no tiene deuda vigente'; end if;
  if p_pie > v_deuda then raise exception 'El pie no puede superar la deuda'; end if;
  if v_convenio_id is not null then raise exception 'La unidad ya tiene un convenio vigente'; end if;

  select count(*) into v_pendientes from propuestas_convenio where unidad_id = u;
  if v_pendientes > 0 then raise exception 'La unidad ya tiene una propuesta de convenio pendiente'; end if;

  select max(caducado_en) into v_ult_caducado from convenios where unidad_id = u and caducado;
  if v_ult_caducado is not null and v_ult_caducado > (current_date - interval '12 months') then
    raise exception 'La unidad incumplió un convenio el %; no puede repactar hasta los 12 meses', to_char(v_ult_caducado, 'DD/MM/YYYY');
  end if;

  v_cuota := ceil((v_deuda - p_pie) / p_cuotas / 1000) * 1000;
  insert into propuestas_convenio (condominio_id, unidad_id, folio, origen, deuda, pie, cuotas, valor_cuota, motivo)
  values (c, u, 'PC-' || to_char(now(), 'YYYYMMDDHH24MISS'), v_origen, v_deuda, p_pie, p_cuotas, v_cuota, p_motivo)
  returning id into v_id;
  return v_id;
end $$;

create or replace function aprobar_propuesta_convenio(p_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare p record; cv uuid; resto numeric; valor numeric; i int; venc date;
begin
  select * into p from propuestas_convenio where id = p_id;
  if p.id is null then raise exception 'Propuesta inexistente'; end if;
  if rol_en(p.condominio_id) <> 'comite' then raise exception 'Solo el comité aprueba convenios'; end if;

  insert into convenios (condominio_id, unidad_id, folio, deuda, pie, cuotas, valor_cuota, origen)
  values (p.condominio_id, p.unidad_id, 'CV-' || to_char(now(), 'YYYYMMDDHH24MISS'), p.deuda, p.pie, p.cuotas, p.valor_cuota,
          'Propuesta de ' || p.origen || ' · aprobada por el comité')
  returning id into cv;

  resto := p.deuda - p.pie;
  valor := p.valor_cuota;
  for i in 1..p.cuotas loop
    venc := ((date_trunc('month', current_date) + interval '1 month')::date + 4) + ((i - 1) || ' months')::interval;
    insert into convenio_cuotas (convenio_id, n, vence, monto)
    values (cv, i, venc, case when i = p.cuotas then resto else valor end);
    resto := resto - valor;
  end loop;

  insert into notificaciones (condominio_id, destino_unidad, titulo, cuerpo)
  values (p.condominio_id, p.unidad_id, 'Convenio de pago aprobado',
    'El comité aprobó tu convenio en ' || p.cuotas || ' cuotas de ' || to_char(p.valor_cuota, 'FM999G999G999') || '.');

  delete from propuestas_convenio where id = p_id;
  return cv;
end $$;

create or replace function rechazar_propuesta_convenio(p_id uuid, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select * into p from propuestas_convenio where id = p_id;
  if p.id is null then raise exception 'Propuesta inexistente'; end if;
  if rol_en(p.condominio_id) <> 'comite' then raise exception 'Solo el comité rechaza convenios'; end if;

  insert into notificaciones (condominio_id, destino_unidad, titulo, cuerpo)
  values (p.condominio_id, p.unidad_id, 'Convenio de pago rechazado',
    case when p_motivo is not null and btrim(p_motivo) <> '' then 'Motivo: ' || p_motivo else 'El comité rechazó tu propuesta de convenio.' end);

  delete from propuestas_convenio where id = p_id;
end $$;

-- las propuestas ahora las decide el comité (antes las "resolvía" borrándolas el administrador)
drop policy if exists resolver on propuestas_convenio;
create policy resolver on propuestas_convenio for delete using (rol_en(condominio_id) = 'comite');

-- el administrador también puede originar una propuesta (antes solo comité/copropietario)
drop policy if exists crear on propuestas_convenio;
create policy crear on propuestas_convenio for insert with check (
  rol_en(condominio_id) in ('comite', 'administrador')
  or (rol_en(condominio_id) = 'copropietario' and unidad_id = mi_unidad(condominio_id)));
