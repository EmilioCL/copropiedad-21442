-- ═══════════════════════════════════════════════════════════════════
-- Dos pedidos sobre votaciones, encontrados al probar en vivo:
--
-- 1) El administrador no tenía ninguna forma de ver cómo iba una votación
--    mientras estaba abierta (cuántos a favor, en contra, abstención, y
--    cuántos faltan por votar) — solo se enteraba del resultado al cerrarla.
--
-- 2) Si se agregaba una unidad nueva DESPUÉS de crear una votación, esa
--    unidad nueva igual podía votarla — no correspondía, porque no era parte
--    del condominio cuando se convocó esa materia.
--
-- Se agrega una "foto" de qué unidades existían al crear la votación
-- (votacion_elegibles), igual que ya se hace con la habilidad al validar una
-- asamblea. Las votaciones creadas ANTES de esta migración no tienen foto
-- guardada; para esas se sigue permitiendo votar a cualquier unidad actual
-- (no se le quita el derecho a nadie retroactivamente).
-- ═══════════════════════════════════════════════════════════════════

create table votacion_elegibles (
  votacion_id uuid not null references votaciones on delete cascade,
  unidad_id uuid not null references unidades on delete cascade,
  primary key (votacion_id, unidad_id)
);
alter table votacion_elegibles enable row level security;
create policy leer on votacion_elegibles for select using (
  exists (select 1 from votaciones vt where vt.id = votacion_id and es_miembro(vt.condominio_id)));
-- sin insert/update/delete: la foto solo se toma dentro de crear_votacion()

create or replace function crear_votacion(c uuid, p_titulo text, p_descripcion text, p_quorum quorum_t, p_cierre date)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not es_gestion(c) then raise exception 'Solo administración o comité crean votaciones'; end if;
  if p_titulo is null or btrim(p_titulo) = '' then raise exception 'Indica el título de la votación'; end if;

  insert into votaciones (condominio_id, folio, titulo, descripcion, quorum, cierre, creada_por)
  values (c, 'VT-' || to_char(now(), 'YYYYMMDDHH24MISS'), p_titulo, p_descripcion, p_quorum, p_cierre, rol_en(c))
  returning id into v;

  insert into votacion_elegibles (votacion_id, unidad_id)
  select v, id from unidades where condominio_id = c;

  return v;
end $$;

create or replace function emitir_voto(v uuid, s voto_t)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid; a uuid; u uuid; ok boolean; a_validada boolean; tiene_foto boolean;
begin
  select condominio_id, asamblea_id into c, a from votaciones where id = v and abierta;
  if c is null then raise exception 'Votación cerrada o inexistente'; end if;
  if rol_en(c) <> 'copropietario' then raise exception 'Solo vota el copropietario'; end if;
  u := mi_unidad(c);

  select exists (select 1 from votacion_elegibles where votacion_id = v) into tiene_foto;
  if tiene_foto and not exists (select 1 from votacion_elegibles where votacion_id = v and unidad_id = u) then
    raise exception 'Tu unidad se incorporó después de crear esta votación; no te corresponde participar en ella';
  end if;

  if a is not null then
    select validada into a_validada from asambleas where id = a;
  end if;

  if a is not null and a_validada then
    ok := exists (select 1 from asamblea_habiles where asamblea_id = a and unidad_id = u);
  else
    select habil into ok from v_unidades where id = u;
  end if;

  if not ok then raise exception 'Unidad inhábil por gastos comunes impagos'; end if;
  insert into votos (votacion_id, unidad_id, sentido) values (v, u, s);   -- PK impide votar dos veces
end $$;
