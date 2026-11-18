-- Bug reportado: un copropietario podía abrir "Mantenciones" en el menú (ya corregido
-- el permiso de ruta), pero la política de seguridad de la tabla seguía sin incluirlo,
-- así que la página cargaba vacía ("No hay mantenciones registradas") aunque sí las había.
drop policy if exists leer on mantenciones;
create policy leer on mantenciones for select using (
  rol_en(condominio_id) in ('administrador', 'comite', 'copropietario', 'conserje'));
