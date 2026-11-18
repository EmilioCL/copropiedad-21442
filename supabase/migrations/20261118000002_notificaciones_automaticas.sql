-- ═══════════════════════════════════════════════════════════════════
-- Bug reportado en la prueba en vivo del profesor: convocar una asamblea o
-- cerrar una rendición de cuentas nunca escribía en `notificaciones`, aunque la
-- tabla y la vista /not ya existían. Se agrega el mismo patrón que `fn_bitacora`
-- (trigger SECURITY DEFINER) para que ninguna notificación dependa de que el
-- cliente se acuerde de insertarla.
-- Grupo de Felipe (CU asamblea) y grupo de Ignacio/Julián (convenios/multas)
-- proponían avisos equivalentes; se centralizan aquí para las 3 tablas que
-- antes no notificaban: asambleas, rendiciones, votaciones y multas.
-- ═══════════════════════════════════════════════════════════════════

create or replace function fn_notif_asamblea() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
  values (new.condominio_id, 'copropietario', 'Convocatoria a asamblea ' || new.tipo,
    'Folio ' || new.folio || ' · ' || to_char(new.fecha, 'DD/MM/YYYY') || ' ' || new.hora || ' en ' || new.lugar || '.');
  insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
  values (new.condominio_id, case when new.convocante = 'administrador' then 'comite' else 'administrador' end,
    'Convocatoria a asamblea ' || new.tipo,
    'Folio ' || new.folio || ' · ' || to_char(new.fecha, 'DD/MM/YYYY') || ' ' || new.hora || ' en ' || new.lugar || '.');
  return new;
end $$;
create trigger notif_asamblea after insert on asambleas for each row execute function fn_notif_asamblea();

create or replace function fn_notif_rendicion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.notificada then
    insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
    values (new.condominio_id, 'copropietario', 'Rendición de cuentas · ' || new.periodo,
      'Balance del período: ' || to_char(new.ingresos - new.egresos, 'FM999G999G999'));
    insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
    values (new.condominio_id, 'comite', 'Rendición de cuentas · ' || new.periodo,
      'Balance del período: ' || to_char(new.ingresos - new.egresos, 'FM999G999G999'));
  end if;
  return new;
end $$;
create trigger notif_rendicion after insert on rendiciones for each row execute function fn_notif_rendicion();

create or replace function fn_notif_votacion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
  values (new.condominio_id, 'copropietario', 'Nueva votación: ' || new.titulo,
    coalesce(new.descripcion, 'Cierra el ' || to_char(new.cierre, 'DD/MM/YYYY') || '.'));
  return new;
end $$;
create trigger notif_votacion after insert on votaciones for each row execute function fn_notif_votacion();

create or replace function fn_notif_multa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    insert into notificaciones (condominio_id, destino_unidad, titulo, cuerpo)
    values (new.condominio_id, new.unidad_id, 'Multa cursada: ' || new.infraccion,
      'Folio ' || new.folio || ' · ' || to_char(new.monto, 'FM999G999G999') || '. Puedes apelarla desde "Multas".');
  elsif TG_OP = 'UPDATE' and new.estado is distinct from old.estado and new.estado in ('confirmada', 'anulada') then
    insert into notificaciones (condominio_id, destino_unidad, titulo, cuerpo)
    values (new.condominio_id, new.unidad_id, 'Apelación resuelta: ' || new.folio,
      case when new.estado = 'anulada' then 'El comité anuló la multa.' else 'El comité confirmó la multa.' end
      || coalesce(' ' || new.resolucion, ''));
  end if;
  return new;
end $$;
create trigger notif_multa after insert or update on multas for each row execute function fn_notif_multa();
