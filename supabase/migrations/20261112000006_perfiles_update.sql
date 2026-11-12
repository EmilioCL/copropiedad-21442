-- Bug: "perfiles" solo tenía política de lectura. El administrador necesita poder
-- vincular una unidad (unidad_id) a la cuenta de un copropietario desde "Registro
-- de residentes" — sin esta política la actualización no fallaba con error, pero
-- RLS filtraba la fila objetivo y el UPDATE no tocaba ninguna fila.
create policy vincular on perfiles for update
  using (rol_en(condominio_id) = 'administrador')
  with check (rol_en(condominio_id) = 'administrador');
