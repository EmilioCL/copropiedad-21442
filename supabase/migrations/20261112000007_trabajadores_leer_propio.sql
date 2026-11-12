-- Bug: "trabajadores" solo permitía leer al administrador, así que un conserje con
-- su cuenta ya vinculada (trabajadores.user_id) no podía encontrar su propia ficha
-- para abrir turno — la vista mostraba "no vinculado" aunque sí lo estaba.
create policy leer_propio on trabajadores for select using (user_id = auth.uid());
