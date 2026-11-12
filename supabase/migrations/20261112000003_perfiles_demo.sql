-- Vincula los 4 usuarios de demostración (creados en Supabase Auth) con su rol y unidad.
insert into perfiles (user_id, condominio_id, rol, unidad_id, nombre)
select u.id, '00000000-0000-0000-0000-000000000001', x.rol::rol_t,
       (select id from unidades where codigo = x.unidad),
       x.nombre
from auth.users u join (values
  ('admin@demo.cl', 'administrador', null, 'Patricio Navarrete'),
  ('comite@demo.cl', 'comite', 'B-301', 'Sofía Lagos Riquelme'),
  ('copropietario@demo.cl', 'copropietario', 'B-202', 'Ana Torres Quezada'),
  ('conserje@demo.cl', 'conserje', null, 'Héctor Salazar Muñoz')
) as x(email, rol, unidad, nombre) on u.email = x.email
on conflict (user_id, condominio_id) do nothing;

-- Vincula al conserje de demostración con su ficha de trabajador, para que pueda abrir turno.
update trabajadores set user_id = (select id from auth.users where email = 'conserje@demo.cl')
where nombre = 'Héctor Salazar Muñoz' and condominio_id = '00000000-0000-0000-0000-000000000001';
