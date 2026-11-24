-- Bug encontrado en pruebas: "with ordinality" convierte cada fila en un
-- record (valor, ordinalidad), así que `x->>'concepto'` fallaba porque x ya
-- no era directamente el jsonb del elemento. Se corrige dando alias a ambas
-- columnas por separado.
create or replace function emitir_gastos(c uuid, p_periodo date, p_partidas jsonb, p_publico boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare e uuid; total numeric; dia int; aporte numeric; desglose text; titulo text; cuerpo text;
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

  select string_agg(x->>'concepto' || ': ' || to_char((x->>'monto')::numeric, 'FM999G999G999'), ' · ' order by ord)
    into desglose
  from jsonb_array_elements(p_partidas) with ordinality as t(x, ord);

  titulo := 'Gastos comunes emitidos · ' || to_char(p_periodo, 'MM-YYYY');
  cuerpo := 'Total ' || to_char(total, 'FM999G999G999') || '. Desglose: ' || desglose || '.';

  insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
  values (c, 'comite', titulo, cuerpo);

  if p_publico then
    insert into notificaciones (condominio_id, destino_rol, titulo, cuerpo)
    values (c, 'copropietario', titulo, cuerpo);
  end if;

  return e;
end $$;
