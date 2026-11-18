-- ═══════════════════════════════════════════════════════════════════
-- Grupo de Felipe (CA9): la habilidad para votar debe fijarse al momento de
-- validar/ingresar a la asamblea, no reevaluarse en vivo cada vez que se
-- emite un voto (hoy, si una unidad pagaba a mitad de la asamblea, pasaba
-- de inhábil a hábil y podía votar algo que no debía).
-- ═══════════════════════════════════════════════════════════════════

create table asamblea_habiles (
  asamblea_id uuid not null references asambleas on delete cascade,
  unidad_id uuid not null references unidades on delete cascade,
  primary key (asamblea_id, unidad_id)
);
alter table asamblea_habiles enable row level security;
create policy leer on asamblea_habiles for select using (
  exists (select 1 from asambleas a where a.id = asamblea_id and es_miembro(a.condominio_id)));
-- sin políticas de insert/update/delete: la foto solo se toma dentro de asamblea_validar()

create or replace function asamblea_validar(a uuid) returns void
language plpgsql security definer set search_path = public as $$
declare c uuid; hab numeric;
begin
  select condominio_id into c from asambleas where id = a;
  if c is null then raise exception 'Asamblea inexistente'; end if;
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador valida la convocatoria'; end if;
  select coalesce(sum(derechos), 0) into hab from v_unidades where condominio_id = c and habil;
  update asambleas set validada = true, derechos_habiles = hab where id = a;
  delete from asamblea_habiles where asamblea_id = a;
  insert into asamblea_habiles (asamblea_id, unidad_id)
  select a, id from v_unidades where condominio_id = c and habil;
end $$;

create or replace function emitir_voto(v uuid, s voto_t)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid; a uuid; u uuid; ok boolean; a_validada boolean;
begin
  select condominio_id, asamblea_id into c, a from votaciones where id = v and abierta;
  if c is null then raise exception 'Votación cerrada o inexistente'; end if;
  if rol_en(c) <> 'copropietario' then raise exception 'Solo vota el copropietario'; end if;
  u := mi_unidad(c);

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
