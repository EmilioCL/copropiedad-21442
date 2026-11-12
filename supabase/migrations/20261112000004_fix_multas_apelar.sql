-- Bug: la política "apelar" no tenía WITH CHECK propio, así que heredaba el USING
-- completo (incluyendo estado = 'cursada') también para la fila nueva, y la
-- apelación (que cambia estado a 'apelada') quedaba siempre rechazada.
drop policy if exists apelar on multas;

create policy apelar on multas for update
  using (
    (rol_en(condominio_id) = 'copropietario' and unidad_id = mi_unidad(condominio_id) and estado = 'cursada')
    or (rol_en(condominio_id) = 'comite' and estado = 'apelada'))
  with check (
    (rol_en(condominio_id) = 'copropietario' and unidad_id = mi_unidad(condominio_id))
    or (rol_en(condominio_id) = 'comite'));
