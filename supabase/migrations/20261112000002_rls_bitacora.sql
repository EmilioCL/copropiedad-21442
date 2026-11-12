-- ═══════════════════════════════════════════════════════════════════
-- Copropiedad 21442 · Políticas RLS restantes + funciones de negocio + bitácora
-- Completa el TODO dejado en 0001_schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- ── condominios: el administrador ajusta parámetros (tolerancia, día, % fondo) ──
create policy actualizar on condominios for update using (rol_en(id) = 'administrador');

-- ── convenios / convenio_cuotas (regla 7: solo el administrador celebra) ──
create policy escribir on convenios for insert with check (rol_en(condominio_id) = 'administrador');
create policy actualizar on convenios for update using (rol_en(condominio_id) = 'administrador');

create policy leer on convenio_cuotas for select using (
  exists (select 1 from convenios cv where cv.id = convenio_id
    and (es_gestion(cv.condominio_id) or cv.unidad_id = mi_unidad(cv.condominio_id))));
create policy escribir on convenio_cuotas for all using (
  exists (select 1 from convenios cv where cv.id = convenio_id and rol_en(cv.condominio_id) = 'administrador'));

create policy leer on emision_partidas for select using (
  exists (select 1 from emisiones e where e.id = emision_id and es_gestion(e.condominio_id)));
create policy leer on pago_imputaciones for select using (
  exists (select 1 from pagos p where p.id = pago_id and (es_gestion(p.condominio_id) or p.unidad_id = mi_unidad(p.condominio_id))));

-- ── cobranzas (regla 9: solo administrador) ──
create policy escribir on cobranzas for insert with check (rol_en(condominio_id) = 'administrador');
create policy actualizar on cobranzas for update using (rol_en(condominio_id) = 'administrador');
create policy leer on cobranza_hitos for select using (
  exists (select 1 from cobranzas cb where cb.id = cobranza_id and rol_en(cb.condominio_id) = 'administrador'));
create policy escribir on cobranza_hitos for insert with check (
  exists (select 1 from cobranzas cb where cb.id = cobranza_id and rol_en(cb.condominio_id) = 'administrador'));

-- ── asambleas (regla 11: solo administrador valida habilidad) ──
create policy validar on asambleas for update using (rol_en(condominio_id) = 'administrador');

-- ── votaciones (cerrar: administración o comité, regla 10/12) ──
create policy cerrar on votaciones for update using (es_gestion(condominio_id));

-- ── actas (regla 13) ──
create policy leer on actas for select using (
  exists (select 1 from asambleas a where a.id = asamblea_id and es_miembro(a.condominio_id) and rol_en(a.condominio_id) <> 'conserje'));
create policy crear on actas for insert with check (
  exists (select 1 from asambleas a where a.id = asamblea_id and rol_en(a.condominio_id) = 'administrador'));

-- ── rendiciones (regla 14: sin update → inmutable una vez cerrada) ──
create policy leer on rendiciones for select using (es_gestion(condominio_id));
create policy crear on rendiciones for insert with check (rol_en(condominio_id) = 'administrador');

-- ── presupuestos / presupuesto_partidas ──
create policy escribir on presupuestos for insert with check (rol_en(condominio_id) = 'administrador');
create policy actualizar on presupuestos for update using (rol_en(condominio_id) = 'administrador');
create policy leer on presupuesto_partidas for select using (
  exists (select 1 from presupuestos p where p.id = presupuesto_id and es_gestion(p.condominio_id)));
create policy escribir on presupuesto_partidas for all using (
  exists (select 1 from presupuestos p where p.id = presupuesto_id and rol_en(p.condominio_id) = 'administrador'));

-- ── fondo (regla 3: giros manuales por administrador; aportes via emitir_gastos) ──
create policy escribir on fondo_movimientos for insert with check (rol_en(condominio_id) = 'administrador');

-- ── espacios / reservas (regla 16: inhábil no reserva) ──
create policy leer on espacios for select using (es_miembro(condominio_id));
create policy escribir on espacios for all using (rol_en(condominio_id) = 'administrador');

create policy leer on reservas for select using (
  exists (select 1 from espacios e where e.id = espacio_id
    and (es_gestion(e.condominio_id) or rol_en(e.condominio_id) = 'conserje' or unidad_id = mi_unidad(e.condominio_id))));
create policy reservar on reservas for insert with check (
  exists (select 1 from espacios e join v_unidades v on v.id = unidad_id
    where e.id = espacio_id and v.condominio_id = e.condominio_id
    and unidad_id = mi_unidad(e.condominio_id) and v.habil));

-- ── trabajadores ──
create policy leer on trabajadores for select using (rol_en(condominio_id) = 'administrador');
create policy escribir on trabajadores for all using (rol_en(condominio_id) = 'administrador');

-- ── documentos: administrador edita/elimina lo que publica ──
create policy actualizar on documentos for update using (rol_en(condominio_id) = 'administrador');
create policy eliminar on documentos for delete using (rol_en(condominio_id) = 'administrador');

-- ── conserjería: novedades, accesos, vehículos, visitas, encomiendas ──
create policy leer on novedades for select using (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) in ('administrador', 'conserje')));
create policy escribir on novedades for insert with check (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) = 'conserje' and t.fin is null));

create policy leer on accesos for select using (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) in ('administrador', 'conserje')));
create policy escribir on accesos for insert with check (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) = 'conserje' and t.fin is null));

create policy leer on vehiculos for select using (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) in ('administrador', 'conserje')));
create policy escribir on vehiculos for insert with check (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) = 'conserje' and t.fin is null));
create policy salida on vehiculos for update using (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) = 'conserje'));

create policy leer on visitas for select using (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) in ('administrador', 'conserje')));
create policy escribir on visitas for insert with check (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) = 'conserje' and t.fin is null));
create policy salida on visitas for update using (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) = 'conserje'));

create policy escribir on encomiendas for insert with check (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) = 'conserje' and t.fin is null));
create policy entregar on encomiendas for update using (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) = 'conserje'));

-- ── notificaciones ──
create policy leer on notificaciones for select using (
  es_gestion(condominio_id) or destino_unidad = mi_unidad(condominio_id) or destino_rol = rol_en(condominio_id));
create policy escribir on notificaciones for insert with check (rol_en(condominio_id) = 'administrador');
create policy marcar_leida on notificaciones for update using (
  es_gestion(condominio_id) or destino_unidad = mi_unidad(condominio_id) or destino_rol = rol_en(condominio_id));

-- ═══ FUNCIONES DE NEGOCIO (reglas que no se expresan como simple filtro de fila) ═══

-- Regla 7: cuotas = ceil((deuda-pie)/n/1000)*1000, última ajusta el saldo; 1ª vence el día 5 del mes siguiente
create or replace function celebrar_convenio(c uuid, u uuid, p_pie numeric, p_cuotas int, p_origen text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cv uuid; v_deuda numeric; valor numeric; resto numeric; i int; venc date;
begin
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador celebra convenios'; end if;
  select deuda into v_deuda from v_unidades where id = u;
  if v_deuda is null or v_deuda <= 0 then raise exception 'La unidad no tiene deuda vigente'; end if;
  if p_pie > v_deuda then raise exception 'El pie no puede superar la deuda'; end if;
  if p_cuotas < 2 or p_cuotas > 18 then raise exception 'Las cuotas deben ser entre 2 y 18'; end if;
  valor := ceil((v_deuda - p_pie) / p_cuotas / 1000) * 1000;
  insert into convenios (condominio_id, unidad_id, folio, deuda, pie, cuotas, valor_cuota, origen)
  values (c, u, 'CV-' || to_char(now(), 'YYYYMMDDHH24MISS'), v_deuda, p_pie, p_cuotas, valor, p_origen)
  returning id into cv;
  resto := v_deuda - p_pie;
  for i in 1..p_cuotas loop
    venc := ((date_trunc('month', current_date) + interval '1 month')::date + 4) + ((i - 1) || ' months')::interval;
    insert into convenio_cuotas (convenio_id, n, vence, monto)
    values (cv, i, venc, case when i = p_cuotas then resto else valor end);
    resto := resto - valor;
  end loop;
  return cv;
end $$;

-- Regla 8: incumplimiento si hay más cuotas vencidas que pagadas → caduca y la unidad vuelve a inhábil
create or replace function convenios_revisar_vencidos() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with venc as (
    select cv.id,
      count(*) filter (where cc.vence <= current_date and not cc.pagada) as vencidas,
      count(*) filter (where cc.pagada) as pagadas
    from convenios cv join convenio_cuotas cc on cc.convenio_id = cv.id
    where not cv.caducado group by cv.id
  )
  update convenios set caducado = true, caducado_en = current_date
  where id in (select id from venc where vencidas > pagadas);
  get diagnostics n = row_count;
  return n;
end $$;

-- Regla 3: giro del fondo, exige concepto y no puede exceder el saldo derivado
create or replace function fondo_girar(c uuid, p_concepto text, p_monto numeric, p_autoriza text)
returns uuid language plpgsql security definer set search_path = public as $$
declare f uuid; saldo numeric;
begin
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador gira el fondo'; end if;
  if p_monto <= 0 then raise exception 'El monto del giro debe ser positivo'; end if;
  if p_concepto is null or btrim(p_concepto) = '' then raise exception 'El giro requiere un concepto'; end if;
  select coalesce(sum(monto), 0) into saldo from fondo_movimientos where condominio_id = c;
  if p_monto > saldo then raise exception 'El giro supera el saldo del fondo'; end if;
  insert into fondo_movimientos (condominio_id, folio, tipo, concepto, monto, autoriza)
  values (c, 'FR-' || to_char(now(), 'YYYYMMDDHH24MISS'), 'Giro', p_concepto, -p_monto, p_autoriza)
  returning id into f;
  return f;
end $$;

-- Regla 11: el administrador valida habilidad (toma la foto de derechos hábiles) antes de emitir la citación
create or replace function asamblea_validar(a uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c uuid; hab numeric;
begin
  select condominio_id into c from asambleas where id = a;
  if c is null then raise exception 'Asamblea inexistente'; end if;
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador valida la convocatoria'; end if;
  select coalesce(sum(derechos), 0) into hab from v_unidades where condominio_id = c and habil;
  update asambleas set validada = true, derechos_habiles = hab where id = a;
end $$;

-- Regla 10/12: cierra la votación y determina el resultado por derechos ponderados
create or replace function votacion_cerrar(v uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c uuid; q quorum_t; favor numeric; contra numeric; res text;
begin
  select condominio_id, quorum into c, q from votaciones where id = v and abierta;
  if c is null then raise exception 'Votación cerrada o inexistente'; end if;
  if not es_gestion(c) then raise exception 'Solo administración o comité cierran la votación'; end if;
  select coalesce(sum(vu.derechos) filter (where vt.sentido = 'favor'), 0),
         coalesce(sum(vu.derechos) filter (where vt.sentido = 'contra'), 0)
    into favor, contra
  from votos vt join v_unidades vu on vu.id = vt.unidad_id where vt.votacion_id = v;
  if q = 'Mayoría absoluta de los derechos' then
    res := case when favor > 50 then 'APROBADA' when contra >= favor then 'RECHAZADA' else 'SIN MAYORÍA' end;
  else
    res := case when favor > contra then 'APROBADA' when contra > favor then 'RECHAZADA' else 'SIN MAYORÍA' end;
  end if;
  update votaciones set abierta = false, resultado = res where id = v;
  return res;
end $$;

-- Regla 15: solo el comité resuelve apelaciones (confirma o anula)
create or replace function multa_resolver(m uuid, p_estado multa_estado_t, p_resolucion text)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid; est multa_estado_t;
begin
  select condominio_id, estado into c, est from multas where id = m;
  if c is null then raise exception 'Multa inexistente'; end if;
  if rol_en(c) <> 'comite' then raise exception 'Solo el comité resuelve apelaciones'; end if;
  if est <> 'apelada' then raise exception 'Solo se resuelven multas apeladas'; end if;
  if p_estado not in ('confirmada', 'anulada') then raise exception 'Resolución inválida'; end if;
  update multas set estado = p_estado, resolucion = p_resolucion where id = m;
end $$;

-- Regla 18: certificar reprograma la próxima fecha según periodicidad
create or replace function mantencion_certificar(m uuid, p_fecha date default current_date)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid; per periodicidad_t; meses int;
begin
  select condominio_id, periodicidad into c, per from mantenciones where id = m;
  if c is null then raise exception 'Mantención inexistente'; end if;
  if rol_en(c) not in ('administrador', 'conserje') then raise exception 'Solo administración o conserjería certifican'; end if;
  meses := case per when 'Mensual' then 1 when 'Trimestral' then 3 when 'Semestral' then 6 else 12 end;
  update mantenciones set ultima = p_fecha, proxima = (p_fecha + (meses || ' months')::interval)::date where id = m;
end $$;

-- Regla 9: cobranza aplicable a unidades con mora y sin convenio vigente
create or replace function cobranza_abrir(c uuid, u uuid, p_motivo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cb uuid; v_mora numeric; v_convenio uuid;
begin
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador abre cobranzas'; end if;
  select mora, convenio_id into v_mora, v_convenio from v_unidades where id = u;
  if coalesce(v_mora, 0) <= 0 then raise exception 'La unidad no está en mora'; end if;
  if v_convenio is not null then raise exception 'La unidad tiene un convenio vigente'; end if;
  insert into cobranzas (condominio_id, unidad_id, folio, monto, motivo)
  values (c, u, 'CB-' || to_char(now(), 'YYYYMMDDHH24MISS'), v_mora, p_motivo) returning id into cb;
  insert into cobranza_hitos (cobranza_id, texto) values (cb, 'Apertura de cobranza — Etapa Prejudicial');
  return cb;
end $$;

-- ═══ REGLA 5: TODA OPERACIÓN DE NEGOCIO QUEDA EN LA BITÁCORA ═══
create or replace function fn_bitacora() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_actor text;
begin
  begin
    v_actor := rol_en(coalesce(new.condominio_id, old.condominio_id))::text;
  exception when others then
    v_actor := null;
  end;
  insert into bitacora (condominio_id, cu, actor, accion, detalle)
  values (coalesce(new.condominio_id, old.condominio_id), '—', coalesce(v_actor, 'sistema'),
    TG_OP || ' ' || TG_TABLE_NAME, row_to_json(coalesce(new, old))::text);
  return coalesce(new, old);
end $$;

create trigger bit_emisiones after insert on emisiones for each row execute function fn_bitacora();
create trigger bit_pagos after insert on pagos for each row execute function fn_bitacora();
create trigger bit_convenios after insert or update on convenios for each row execute function fn_bitacora();
create trigger bit_propuestas after insert on propuestas_convenio for each row execute function fn_bitacora();
create trigger bit_cobranzas after insert or update on cobranzas for each row execute function fn_bitacora();
create trigger bit_asambleas after insert or update on asambleas for each row execute function fn_bitacora();
create trigger bit_votaciones after insert or update on votaciones for each row execute function fn_bitacora();
create trigger bit_rendiciones after insert on rendiciones for each row execute function fn_bitacora();
create trigger bit_fondo after insert on fondo_movimientos for each row execute function fn_bitacora();
create trigger bit_multas after insert or update on multas for each row execute function fn_bitacora();
create trigger bit_documentos after insert or update or delete on documentos for each row execute function fn_bitacora();
create trigger bit_trabajadores after insert or update on trabajadores for each row execute function fn_bitacora();
create trigger bit_turnos after insert or update on turnos for each row execute function fn_bitacora();
create trigger bit_mantenciones after update on mantenciones for each row execute function fn_bitacora();

-- actas no tiene condominio_id directo: trigger dedicado que lo resuelve via la asamblea
create or replace function fn_bitacora_actas() returns trigger
language plpgsql security definer set search_path = public as $$
declare c uuid;
begin
  select condominio_id into c from asambleas where id = new.asamblea_id;
  insert into bitacora (condominio_id, cu, actor, accion, detalle)
  values (c, '—', coalesce(rol_en(c)::text, 'sistema'), 'INSERT acta', row_to_json(new)::text);
  return new;
end $$;
create trigger bit_actas after insert on actas for each row execute function fn_bitacora_actas();
