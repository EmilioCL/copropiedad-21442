-- Resumen agregado y sin datos sensibles para mostrar en la pantalla de acceso
-- (antes de iniciar sesión), de forma que las cifras reflejen el condominio real
-- en vez de un número fijo en el código.
create or replace function resumen_publico(c uuid default '00000000-0000-0000-0000-000000000001')
returns table(unidades bigint, m2 numeric)
language sql stable security definer set search_path = public as $$
  select count(*), coalesce(sum(m2), 0) from unidades where condominio_id = c
$$;

grant execute on function resumen_publico to anon, authenticated;
