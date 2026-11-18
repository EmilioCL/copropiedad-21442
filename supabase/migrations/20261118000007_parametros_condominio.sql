-- ═══════════════════════════════════════════════════════════════════
-- Grupo de Julián/Ignacio: el aporte al Fondo de Reserva (Ley 21.442, art. 13)
-- es un mínimo legal de 5%, pero cada condominio puede fijarlo más alto en
-- su reglamento; hoy estaba fijo en 5% y no existía ninguna pantalla para
-- ajustar ningún parámetro del condominio (tampoco el valor UTM que usan
-- las multas). Se agrega una función con el piso legal aplicado en servidor.
-- ═══════════════════════════════════════════════════════════════════

create or replace function actualizar_parametros(
  c uuid, p_tolerancia int, p_dia int, p_aporte_reserva numeric, p_valor_utm numeric
) returns void language plpgsql security definer set search_path = public as $$
begin
  if rol_en(c) <> 'administrador' then raise exception 'Solo el administrador ajusta los parámetros del condominio'; end if;
  if p_aporte_reserva < 0.05 then raise exception 'El aporte al Fondo de Reserva no puede ser menor al 5%% legal'; end if;
  if p_dia < 1 or p_dia > 28 then raise exception 'El día de vencimiento debe estar entre 1 y 28'; end if;
  if p_tolerancia < 0 then raise exception 'La tolerancia no puede ser negativa'; end if;
  if p_valor_utm <= 0 then raise exception 'El valor de la UTM debe ser positivo'; end if;
  update condominios
  set tolerancia_cuotas = p_tolerancia, dia_vencimiento = p_dia, aporte_reserva = p_aporte_reserva, valor_utm = p_valor_utm
  where id = c;
end $$;
