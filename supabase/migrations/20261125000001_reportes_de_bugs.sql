-- ═══════════════════════════════════════════════════════════════════
-- Canal de reporte de errores: mientras los compañeros de curso prueban la
-- aplicación con distintos roles, cualquiera puede dejar un reporte de un
-- bug que encuentre. Solo el administrador ve la lista completa de todos
-- los reportes del condominio; cada persona además puede ver el estado de
-- los suyos propios (si ya se marcó como resuelto).
-- ═══════════════════════════════════════════════════════════════════

create table reportes (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  creado_por uuid references auth.users,
  rol_creador rol_t not null,
  titulo text not null,
  descripcion text not null,
  pagina text,
  resuelto boolean not null default false,
  respuesta text,
  creado_en timestamptz not null default now(),
  resuelto_en timestamptz
);
alter table reportes enable row level security;

-- el administrador ve todo; cualquiera ve los reportes que él mismo creó
create policy leer on reportes for select using (
  rol_en(condominio_id) = 'administrador' or creado_por = auth.uid());

-- sin policy de insert/update directa: todo pasa por las funciones de abajo

create or replace function crear_reporte(c uuid, p_titulo text, p_descripcion text, p_pagina text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare r uuid;
begin
  if not es_miembro(c) then raise exception 'No tienes acceso a este condominio'; end if;
  if p_titulo is null or btrim(p_titulo) = '' then raise exception 'Indica un título breve del problema'; end if;
  if p_descripcion is null or btrim(p_descripcion) = '' then raise exception 'Describe qué pasó'; end if;

  insert into reportes (condominio_id, creado_por, rol_creador, titulo, descripcion, pagina)
  values (c, auth.uid(), rol_en(c), p_titulo, p_descripcion, nullif(btrim(coalesce(p_pagina, '')), ''))
  returning id into r;

  return r;
end $$;

create or replace function reporte_resolver(p_id uuid, p_respuesta text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid;
begin
  select condominio_id into c from reportes where id = p_id;
  if c is null then raise exception 'Reporte inexistente'; end if;
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador marca un reporte como resuelto'; end if;

  update reportes set resuelto = true, respuesta = p_respuesta, resuelto_en = now() where id = p_id;
end $$;
