-- ═══════════════════════════════════════════════════════════════════
-- Copropiedad 21442 · Esquema Postgres para Supabase
-- Multi-condominio, con RLS por rol. Las cifras derivadas viven en vistas.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Tipos ──────────────────────────────────────────────────────────
create type rol_t as enum ('administrador', 'comite', 'copropietario', 'conserje');
create type ocupante_t as enum ('Propietario residente', 'Arrendatario', 'Propietario no residente');
create type asamblea_tipo_t as enum ('Ordinaria', 'Extraordinaria');
create type citacion_t as enum ('Primera', 'Segunda');
create type voto_t as enum ('favor', 'contra', 'abst');
create type quorum_t as enum ('Mayoría simple', 'Mayoría absoluta de los derechos');
create type cobranza_estado_t as enum ('Prejudicial', 'Judicial', 'Cerrada');
create type multa_estado_t as enum ('cursada', 'apelada', 'confirmada', 'anulada');
create type propuesta_origen_t as enum ('Comité', 'Copropietario');
create type fondo_tipo_t as enum ('Aporte', 'Giro');
create type periodicidad_t as enum ('Mensual', 'Trimestral', 'Semestral', 'Anual');

-- ── Núcleo ─────────────────────────────────────────────────────────
create table condominios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  tolerancia_cuotas int not null default 0,   -- cargos en mora tolerados para votar
  dia_vencimiento int not null default 20,
  aporte_reserva numeric not null default 0.05,
  created_at timestamptz not null default now()
);

create table unidades (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  codigo text not null,                        -- 'A-101'
  m2 numeric not null check (m2 > 0),
  propietario text not null,
  ocupante ocupante_t not null default 'Propietario residente',
  ocupante_nombre text,
  email text,
  unique (condominio_id, codigo)
);

-- Vincula al usuario autenticado con su rol (y su unidad, si es copropietario)
create table perfiles (
  user_id uuid not null references auth.users on delete cascade,
  condominio_id uuid not null references condominios on delete cascade,
  rol rol_t not null,
  unidad_id uuid references unidades,
  nombre text not null,
  primary key (user_id, condominio_id)
);

-- ── Helpers de permisos (usados por las RLS) ───────────────────────
create or replace function rol_en(c uuid) returns rol_t
language sql stable security definer set search_path = public as $$
  select rol from perfiles where user_id = auth.uid() and condominio_id = c
$$;

create or replace function es_miembro(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where user_id = auth.uid() and condominio_id = c)
$$;

create or replace function mi_unidad(c uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select unidad_id from perfiles where user_id = auth.uid() and condominio_id = c
$$;

create or replace function es_gestion(c uuid) returns boolean
language sql stable as $$ select rol_en(c) in ('administrador', 'comite') $$;

-- ── Gastos comunes ─────────────────────────────────────────────────
create table emisiones (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  folio text not null,                         -- 'GC-2026-09'
  periodo date not null,                       -- primer día del mes
  total numeric not null check (total > 0),
  emitida_en timestamptz not null default now(),
  unique (condominio_id, periodo)              -- regla 2: no se emite dos veces
);

create table emision_partidas (
  id uuid primary key default gen_random_uuid(),
  emision_id uuid not null references emisiones on delete cascade,
  concepto text not null,
  monto numeric not null check (monto >= 0)
);

create table cargos (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  unidad_id uuid not null references unidades on delete cascade,
  emision_id uuid references emisiones on delete set null,
  origen text not null default 'gasto_comun',  -- 'gasto_comun' | 'multa'
  periodo text not null,                       -- 'Septiembre 2026'
  monto numeric not null check (monto >= 0),
  vence date not null,
  pagado boolean not null default false,
  anulado boolean not null default false
);
create index on cargos (unidad_id) where not pagado;

create table pagos (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  unidad_id uuid not null references unidades,
  folio text not null,
  monto numeric not null check (monto > 0),
  medio text not null,
  registrado_en timestamptz not null default now(),
  registrado_por uuid references auth.users
);

create table pago_imputaciones (
  pago_id uuid not null references pagos on delete cascade,
  cargo_id uuid not null references cargos on delete cascade,
  monto numeric not null,
  primary key (pago_id, cargo_id)
);

-- ── Convenios ──────────────────────────────────────────────────────
create table convenios (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  unidad_id uuid not null references unidades,
  folio text not null,
  deuda numeric not null,
  pie numeric not null default 0,
  cuotas int not null check (cuotas between 2 and 18),
  valor_cuota numeric not null,
  suscrito date not null default current_date,
  origen text not null,                        -- texto mostrado en comprobante
  caducado boolean not null default false,
  caducado_en date,
  comprobante_path text                        -- Storage
);

create table convenio_cuotas (
  convenio_id uuid not null references convenios on delete cascade,
  n int not null,
  vence date not null,
  monto numeric not null,
  pagada boolean not null default false,
  primary key (convenio_id, n)
);

create table propuestas_convenio (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  unidad_id uuid not null references unidades,
  folio text not null,
  origen propuesta_origen_t not null,
  deuda numeric not null, pie numeric not null default 0,
  cuotas int not null, valor_cuota numeric not null,
  motivo text,
  creada_en timestamptz not null default now()
);

-- ── Cobranza ───────────────────────────────────────────────────────
create table cobranzas (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  unidad_id uuid not null references unidades,
  folio text not null,
  monto numeric not null,
  estado cobranza_estado_t not null default 'Prejudicial',
  motivo text,
  abierta_en timestamptz not null default now()
);
create table cobranza_hitos (
  id uuid primary key default gen_random_uuid(),
  cobranza_id uuid not null references cobranzas on delete cascade,
  texto text not null,
  ts timestamptz not null default now()
);

-- ── Asambleas y votaciones ─────────────────────────────────────────
create table asambleas (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  folio text not null,                         -- 'AS-…' admin, 'AC-…' comité
  tipo asamblea_tipo_t not null,
  citacion citacion_t not null,
  fecha date not null, hora time not null, lugar text not null,
  convocante rol_t not null,
  quorum_requerido numeric not null,
  derechos_habiles numeric,                    -- foto al validar (null si convoca el comité)
  validada boolean not null default false,
  creada_en timestamptz not null default now()
);

create table votaciones (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  asamblea_id uuid references asambleas on delete cascade,
  folio text not null,
  titulo text not null, descripcion text,
  quorum quorum_t not null default 'Mayoría simple',
  cierre date not null,
  abierta boolean not null default true,
  resultado text,
  creada_por rol_t not null,
  creada_en timestamptz not null default now()
);

create table votos (
  votacion_id uuid not null references votaciones on delete cascade,
  unidad_id uuid not null references unidades,
  sentido voto_t not null,
  emitido_en timestamptz not null default now(),
  primary key (votacion_id, unidad_id)         -- regla 12: un voto, irrevocable (sin UPDATE)
);

create table actas (
  id uuid primary key default gen_random_uuid(),
  asamblea_id uuid not null unique references asambleas on delete cascade,
  folio text not null,
  levantada_en timestamptz not null default now(),
  pdf_path text
);

-- ── Rendición, presupuesto y fondo ─────────────────────────────────
create table rendiciones (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  folio text not null, periodo text not null,
  ingresos numeric not null, egresos numeric not null,
  notificada boolean not null default false,
  cerrada_en timestamptz not null default now()
);

create table presupuestos (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  anio int not null,
  folio text, aprobado_en timestamptz,
  unique (condominio_id, anio)
);
create table presupuesto_partidas (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references presupuestos on delete cascade,
  concepto text not null,
  anual numeric not null check (anual >= 0)
);

create table fondo_movimientos (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  folio text not null,
  tipo fondo_tipo_t not null,
  concepto text not null,
  monto numeric not null,                      -- positivo aporte, negativo giro
  autoriza text not null,
  emision_id uuid references emisiones,
  ts timestamptz not null default now()
);

-- ── Convivencia ────────────────────────────────────────────────────
create table multas (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  unidad_id uuid not null references unidades,
  folio text not null,
  infraccion text not null, detalle text,
  monto numeric not null check (monto > 0),
  estado multa_estado_t not null default 'cursada',
  apelacion text, resolucion text,
  cursada_por uuid references auth.users,
  ts timestamptz not null default now()
);

create table espacios (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  nombre text not null
);
create table reservas (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references espacios on delete cascade,
  unidad_id uuid not null references unidades,
  folio text not null,
  fecha date not null, bloque text not null,
  ts timestamptz not null default now(),
  unique (espacio_id, fecha, bloque)           -- regla 16
);

-- ── Operaciones ────────────────────────────────────────────────────
create table mantenciones (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  equipo text not null, proveedor text,
  periodicidad periodicidad_t not null,
  ultima date, proxima date not null,
  critico boolean not null default false
);

create table trabajadores (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  user_id uuid references auth.users,          -- si accede como conserje
  nombre text not null, rut text, telefono text,
  cargo text not null, jornada text,
  sueldo numeric, contrato text,
  activo boolean not null default true,
  desde date not null default current_date
);

create table documentos (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  titulo text not null, tipo text not null, nota text,
  publico boolean not null default true,
  fecha date not null default current_date,
  storage_path text
);

-- ── Conserjería ────────────────────────────────────────────────────
create table turnos (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  trabajador_id uuid not null references trabajadores,
  folio text not null,
  inicio timestamptz not null default now(),
  fin timestamptz
);
-- regla 17: un solo turno abierto por condominio
create unique index un_turno_abierto on turnos (condominio_id) where fin is null;

create table novedades (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references turnos on delete cascade,
  folio text not null, tipo text not null, texto text not null,
  ts timestamptz not null default now()
);
create table accesos (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references turnos on delete cascade,
  folio text not null,
  puerta text not null,                        -- 'Portón vehicular' | 'Puerta peatonal' | 'Bodegas'
  ts timestamptz not null default now()
);
create table vehiculos (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references turnos,
  folio text not null, patente text not null, tipo text not null,
  unidad_id uuid references unidades, detalle text,
  entrada timestamptz not null default now(), salida timestamptz
);
create table visitas (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references turnos,
  folio text not null, nombre text not null, rut text, motivo text not null,
  unidad_id uuid references unidades, patente text,
  ingreso timestamptz not null default now(), salida timestamptz
);
create table encomiendas (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references turnos,
  folio text not null, tipo text not null,
  unidad_id uuid not null references unidades,
  remitente text, detalle text,
  recibida timestamptz not null default now(),
  entregada timestamptz, retirada_por text
);

-- ── Trazabilidad ───────────────────────────────────────────────────
create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios on delete cascade,
  destino_rol rol_t, destino_unidad uuid references unidades,
  titulo text not null, cuerpo text, leida boolean not null default false,
  ts timestamptz not null default now()
);

create table bitacora (
  id bigint generated always as identity primary key,
  condominio_id uuid not null references condominios on delete cascade,
  cu text,                                     -- '3.2', '3.4', '3.5', '3.6' o '—'
  actor text not null,
  accion text not null, detalle text,
  ts timestamptz not null default now()
);

-- ═══ VISTAS DERIVADAS (reglas 1, 4, 5) ══════════════════════════════
create or replace view v_unidades with (security_invoker = true) as
with tot as (select condominio_id, sum(m2) m2_total from unidades group by condominio_id),
deu as (
  select unidad_id,
    sum(monto) filter (where not pagado and not anulado)                         as deuda,
    sum(monto) filter (where not pagado and not anulado and vence <= current_date) as mora,
    count(*)   filter (where not pagado and not anulado and vence <= current_date) as cargos_mora
  from cargos group by unidad_id
),
cv as (select distinct on (unidad_id) unidad_id, id convenio_id from convenios where not caducado order by unidad_id, suscrito desc)
select u.*,
  round(u.m2 / t.m2_total * 100, 3)          as derechos,
  coalesce(d.deuda, 0)                       as deuda,
  coalesce(d.mora, 0)                        as mora,
  coalesce(d.cargos_mora, 0)                 as cargos_mora,
  cv.convenio_id,
  (coalesce(d.cargos_mora, 0) <= c.tolerancia_cuotas or cv.convenio_id is not null) as habil
from unidades u
join tot t on t.condominio_id = u.condominio_id
join condominios c on c.id = u.condominio_id
left join deu d on d.unidad_id = u.id
left join cv on cv.unidad_id = u.id;

create or replace view v_fondo_saldo with (security_invoker = true) as
select condominio_id, sum(monto) saldo,
  sum(monto) filter (where monto > 0) aportes,
  -sum(monto) filter (where monto < 0) giros
from fondo_movimientos group by condominio_id;

-- ═══ REGLAS EN SERVIDOR ═════════════════════════════════════════════
-- Regla 2 y 3: emitir prorrateando y abonar 5 % al fondo, en una transacción
create or replace function emitir_gastos(c uuid, p_periodo date, p_partidas jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare e uuid; total numeric; dia int; aporte numeric;
begin
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador emite gastos comunes'; end if;
  select coalesce(sum((x->>'monto')::numeric), 0) into total from jsonb_array_elements(p_partidas) x;
  if total <= 0 then raise exception 'Sin gastos cargados'; end if;
  select dia_vencimiento, aporte_reserva into dia, aporte from condominios where id = c;

  insert into emisiones (condominio_id, folio, periodo, total)
  values (c, 'GC-' || to_char(p_periodo, 'YYYY-MM'), p_periodo, total) returning id into e;

  insert into emision_partidas (emision_id, concepto, monto)
  select e, x->>'concepto', (x->>'monto')::numeric from jsonb_array_elements(p_partidas) x;

  insert into cargos (condominio_id, unidad_id, emision_id, periodo, monto, vence)
  select c, v.id, e, initcap(to_char(p_periodo, 'TMMonth YYYY')),
         round(total * v.derechos / 100 / 10) * 10,
         make_date(extract(year from p_periodo)::int, extract(month from p_periodo)::int, dia)
  from v_unidades v where v.condominio_id = c;

  insert into fondo_movimientos (condominio_id, folio, tipo, concepto, monto, autoriza, emision_id)
  values (c, 'FR-' || to_char(now(), 'YYYYMMDDHH24MISS'), 'Aporte',
          'Aporte legal del período ' || to_char(p_periodo, 'MM-YYYY'), round(total * aporte), 'Administración', e);
  return e;
end $$;

-- Regla 6: imputar el pago a los cargos más antiguos
create or replace function registrar_pago(c uuid, u uuid, p_monto numeric, p_medio text)
returns uuid language plpgsql security definer set search_path = public as $$
declare pg uuid; resto numeric := p_monto; r record; deuda numeric;
begin
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador registra pagos'; end if;
  select coalesce(sum(monto), 0) into deuda from cargos where unidad_id = u and not pagado and not anulado;
  if p_monto > deuda then raise exception 'El monto supera la deuda vigente'; end if;
  insert into pagos (condominio_id, unidad_id, folio, monto, medio, registrado_por)
  values (c, u, 'PG-' || to_char(now(), 'YYYYMMDDHH24MISS'), p_monto, p_medio, auth.uid()) returning id into pg;
  for r in select * from cargos where unidad_id = u and not pagado and not anulado order by vence, id loop
    exit when resto <= 0;
    if resto >= r.monto then
      update cargos set pagado = true where id = r.id;
      insert into pago_imputaciones values (pg, r.id, r.monto); resto := resto - r.monto;
    else
      update cargos set monto = monto - resto where id = r.id;
      insert into pago_imputaciones values (pg, r.id, resto); resto := 0;
    end if;
  end loop;
  return pg;
end $$;

-- Regla 12: solo vota el hábil, solo su unidad, solo con la votación abierta
create or replace function emitir_voto(v uuid, s voto_t)
returns void language plpgsql security definer set search_path = public as $$
declare c uuid; u uuid; ok boolean;
begin
  select condominio_id into c from votaciones where id = v and abierta;
  if c is null then raise exception 'Votación cerrada o inexistente'; end if;
  if rol_en(c) <> 'copropietario' then raise exception 'Solo vota el copropietario'; end if;
  u := mi_unidad(c);
  select habil into ok from v_unidades where id = u;
  if not ok then raise exception 'Unidad inhábil por gastos comunes impagos'; end if;
  insert into votos (votacion_id, unidad_id, sentido) values (v, u, s);   -- PK impide votar dos veces
end $$;

-- ═══ RLS ════════════════════════════════════════════════════════════
do $$ declare t text; begin
  foreach t in array array['condominios','unidades','perfiles','emisiones','emision_partidas','cargos','pagos',
    'pago_imputaciones','convenios','convenio_cuotas','propuestas_convenio','cobranzas','cobranza_hitos',
    'asambleas','votaciones','votos','actas','rendiciones','presupuestos','presupuesto_partidas',
    'fondo_movimientos','multas','espacios','reservas','mantenciones','trabajadores','documentos',
    'turnos','novedades','accesos','vehiculos','visitas','encomiendas','notificaciones','bitacora']
  loop execute format('alter table %I enable row level security', t); end loop;
end $$;

-- Lectura general para miembros; escritura restringida por rol
create policy leer on condominios for select using (es_miembro(id));
create policy leer on perfiles for select using (user_id = auth.uid() or es_gestion(condominio_id));

-- Unidades: gestión ve todas; conserje ve todas (sin deuda: usar v_unidades solo en gestión); copropietario solo la suya
create policy leer on unidades for select using (
  es_gestion(condominio_id) or rol_en(condominio_id) = 'conserje' or id = mi_unidad(condominio_id));
create policy escribir on unidades for all using (rol_en(condominio_id) = 'administrador');

-- Finanzas: gestión completa; copropietario solo lo propio; conserje nada
create policy leer on cargos for select using (es_gestion(condominio_id) or unidad_id = mi_unidad(condominio_id));
create policy leer on pagos for select using (es_gestion(condominio_id) or unidad_id = mi_unidad(condominio_id));
create policy leer on convenios for select using (es_gestion(condominio_id) or unidad_id = mi_unidad(condominio_id));
create policy leer on emisiones for select using (es_gestion(condominio_id));
create policy leer on fondo_movimientos for select using (es_gestion(condominio_id));
create policy leer on cobranzas for select using (rol_en(condominio_id) = 'administrador');
create policy leer on presupuestos for select using (es_gestion(condominio_id));

-- Propuestas: el comité y el copropietario crean; solo el administrador resuelve (borra/convierte)
create policy leer on propuestas_convenio for select using (es_gestion(condominio_id) or unidad_id = mi_unidad(condominio_id));
create policy crear on propuestas_convenio for insert with check (
  rol_en(condominio_id) = 'comite' or (rol_en(condominio_id) = 'copropietario' and unidad_id = mi_unidad(condominio_id)));
create policy resolver on propuestas_convenio for delete using (rol_en(condominio_id) = 'administrador');

-- Asambleas y votaciones: visibles a la comunidad
create policy leer on asambleas for select using (es_miembro(condominio_id) and rol_en(condominio_id) <> 'conserje');
create policy crear on asambleas for insert with check (es_gestion(condominio_id));
create policy leer on votaciones for select using (es_miembro(condominio_id) and rol_en(condominio_id) <> 'conserje');
create policy crear on votaciones for insert with check (es_gestion(condominio_id));
create policy leer on votos for select using (exists (select 1 from votaciones v where v.id = votacion_id and es_gestion(v.condominio_id))
  or unidad_id = (select mi_unidad(v.condominio_id) from votaciones v where v.id = votacion_id));
-- votos: sin políticas de insert/update/delete → solo vía emitir_voto()

-- Multas
create policy leer on multas for select using (es_gestion(condominio_id) or unidad_id = mi_unidad(condominio_id));
create policy cursar on multas for insert with check (rol_en(condominio_id) in ('administrador', 'conserje'));
create policy apelar on multas for update using (
  (rol_en(condominio_id) = 'copropietario' and unidad_id = mi_unidad(condominio_id) and estado = 'cursada')
  or (rol_en(condominio_id) = 'comite' and estado = 'apelada'));

-- Documentos
create policy leer on documentos for select using (es_miembro(condominio_id) and (publico or es_gestion(condominio_id)));
create policy publicar on documentos for insert with check (rol_en(condominio_id) = 'administrador');

-- Conserjería: el conserje opera; gestión lee; copropietario solo sus encomiendas
create policy leer on turnos for select using (rol_en(condominio_id) in ('administrador', 'conserje'));
create policy operar on turnos for all using (rol_en(condominio_id) = 'conserje');
create policy leer on encomiendas for select using (
  exists (select 1 from turnos t where t.id = turno_id and rol_en(t.condominio_id) in ('administrador', 'conserje'))
  or unidad_id = (select mi_unidad(t.condominio_id) from turnos t where t.id = turno_id));

-- Mantenciones
create policy leer on mantenciones for select using (rol_en(condominio_id) in ('administrador', 'comite', 'conserje'));
create policy plan on mantenciones for insert with check (rol_en(condominio_id) = 'administrador');
create policy certificar on mantenciones for update using (rol_en(condominio_id) in ('administrador', 'conserje'));

-- Bitácora
create policy leer on bitacora for select using (es_gestion(condominio_id));

-- TODO para Claude Code: completar políticas de insert/update del resto de tablas
-- siguiendo la tabla “Permisos por vista” del README, y agregar triggers que
-- escriban en `bitacora` en cada operación de negocio.
