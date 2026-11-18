-- Bug encontrado en pruebas: el CASE que decide a qué rol de gestión avisar
-- (comité si convoca el administrador, y viceversa) resuelve a `text`, y
-- Postgres no lo castea implícitamente al enum `rol_t` de destino_rol.
create or replace function fn_notif_asamblea() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
  values (new.condominio_id, 'copropietario', 'Convocatoria a asamblea ' || new.tipo,
    'Folio ' || new.folio || ' · ' || to_char(new.fecha, 'DD/MM/YYYY') || ' ' || new.hora || ' en ' || new.lugar || '.');
  insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
  values (new.condominio_id, (case when new.convocante = 'administrador' then 'comite' else 'administrador' end)::rol_t,
    'Convocatoria a asamblea ' || new.tipo,
    'Folio ' || new.folio || ' · ' || to_char(new.fecha, 'DD/MM/YYYY') || ' ' || new.hora || ' en ' || new.lugar || '.');
  return new;
end $$;
