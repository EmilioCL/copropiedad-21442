-- ═══════════════════════════════════════════════════════════════════
-- "Documentos" solo guardaba el título/tipo/nota — la columna storage_path
-- existía en el esquema desde el inicio pero nunca se usaba, así que no
-- había ningún archivo real: los 6 documentos de la demo eran ficticios,
-- sin nada que ver ni descargar. Se agrega el bucket y las políticas para
-- subir y leer el archivo real, respetando la misma regla de visibilidad
-- (público = cualquier miembro; reservado = solo administración y comité).
-- ═══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Solo el administrador sube o elimina archivos; la ruta empieza con el id del condominio
-- (<condominio_id>/<archivo>), así que se verifica el rol sobre ese condominio.
create policy "documentos_subir" on storage.objects for insert with check (
  bucket_id = 'documentos' and rol_en((split_part(name, '/', 1))::uuid) = 'administrador'
);
create policy "documentos_eliminar" on storage.objects for delete using (
  bucket_id = 'documentos' and rol_en((split_part(name, '/', 1))::uuid) = 'administrador'
);

-- Se puede leer (y generar un link de descarga) si hay un documento visible que apunte a ese archivo.
create policy "documentos_leer" on storage.objects for select using (
  bucket_id = 'documentos' and exists (
    select 1 from documentos d
    where d.storage_path = storage.objects.name
      and es_miembro(d.condominio_id)
      and (d.publico or es_gestion(d.condominio_id))
  )
);

-- Se vacían los documentos ficticios de la demo (nunca tuvieron un archivo real adjunto).
delete from documentos where storage_path is null;
