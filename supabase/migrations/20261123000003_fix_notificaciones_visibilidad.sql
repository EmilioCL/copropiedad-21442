-- Bug encontrado en pruebas (visible recién ahora que hay notificaciones que se
-- reparten a distintos roles para el mismo evento, como gastos comunes):
-- la política de lectura dejaba ver a administrador y comité absolutamente
-- TODAS las notificaciones del condominio ("es_gestion"), sin importar para
-- quién fueran. Por eso el comité veía su propio aviso Y el de los
-- copropietarios, como si estuviera duplicado. Ahora cada quien ve solo lo
-- dirigido a su rol o a su unidad.
drop policy if exists leer on notificaciones;
create policy leer on notificaciones for select using (
  destino_unidad = mi_unidad(condominio_id) or destino_rol = rol_en(condominio_id));

drop policy if exists marcar_leida on notificaciones;
create policy marcar_leida on notificaciones for update using (
  destino_unidad = mi_unidad(condominio_id) or destino_rol = rol_en(condominio_id));
