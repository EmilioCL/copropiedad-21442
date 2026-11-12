-- Datos de demostración: Condominio Parque Los Almendros (12 unidades, 2 torres)
-- Ejecutar después de 0001_schema.sql. Los perfiles se crean después de registrar
-- usuarios en Supabase Auth (ver docs/PASOS.md, paso 4).

insert into condominios (id, nombre, direccion)
values ('00000000-0000-0000-0000-000000000001', 'Parque Los Almendros', 'Av. Los Almendros 1450, Santiago');

insert into unidades (condominio_id, codigo, m2, propietario, ocupante, ocupante_nombre, email) values
('00000000-0000-0000-0000-000000000001','A-101',62,'María Contreras Bravo','Propietario residente',null,'m.contreras@correo.cl'),
('00000000-0000-0000-0000-000000000001','A-102',58,'Jorge Elgueta Faúndez','Propietario residente',null,'j.elgueta@correo.cl'),
('00000000-0000-0000-0000-000000000001','A-201',74,'Inmobiliaria Vertiente SpA','Arrendatario','Camila Rojas Peña','admin@vertiente.cl'),
('00000000-0000-0000-0000-000000000001','A-202',71,'Patricio Navarro Silva','Propietario residente',null,'p.navarro@correo.cl'),
('00000000-0000-0000-0000-000000000001','A-301',88,'Emilio Vargas Toro','Propietario residente',null,'e.vargas@correo.cl'),
('00000000-0000-0000-0000-000000000001','A-302',66,'Rosa Pinto Cárdenas','Propietario no residente',null,'r.pinto@correo.cl'),
('00000000-0000-0000-0000-000000000001','B-101',55,'Luis Sepúlveda Muñoz','Propietario residente',null,'l.sepulveda@correo.cl'),
('00000000-0000-0000-0000-000000000001','B-102',57,'Fernanda Díaz Aravena','Arrendatario','Iván Muñoz Leiva','f.diaz@correo.cl'),
('00000000-0000-0000-0000-000000000001','B-201',80,'Claudio Herrera Godoy','Propietario residente',null,'c.herrera@correo.cl'),
('00000000-0000-0000-0000-000000000001','B-202',78,'Ana Torres Quezada','Propietario residente',null,'a.torres@correo.cl'),
('00000000-0000-0000-0000-000000000001','B-301',92,'Sofía Lagos Riquelme','Propietario residente',null,'s.lagos@correo.cl'),
('00000000-0000-0000-0000-000000000001','B-302',90,'Marcelo Ríos Bustos','Propietario no residente',null,'m.rios@correo.cl');

insert into espacios (condominio_id, nombre) values
('00000000-0000-0000-0000-000000000001','Quincho'),
('00000000-0000-0000-0000-000000000001','Sala multiuso'),
('00000000-0000-0000-0000-000000000001','Terraza');

insert into mantenciones (condominio_id, equipo, proveedor, periodicidad, ultima, proxima, critico) values
('00000000-0000-0000-0000-000000000001','Ascensores Torre A y B','Ascensores Andes SpA','Mensual','2026-08-12','2026-09-12',true),
('00000000-0000-0000-0000-000000000001','Extintores y red húmeda','Segurex Ltda.','Anual','2025-11-20','2026-11-20',true),
('00000000-0000-0000-0000-000000000001','Bomba de agua y estanque','Hidráulica Sur','Trimestral','2026-06-05','2026-09-05',true),
('00000000-0000-0000-0000-000000000001','Grupo electrógeno','Energía Continua','Semestral','2026-03-18','2026-09-18',false),
('00000000-0000-0000-0000-000000000001','Portón vehicular automático','Accesos Pro','Trimestral','2026-05-22','2026-08-22',false),
('00000000-0000-0000-0000-000000000001','Detectores de humo áreas comunes','Segurex Ltda.','Anual','2026-01-15','2027-01-15',true);

insert into trabajadores (condominio_id, nombre, cargo, jornada, sueldo, contrato, desde) values
('00000000-0000-0000-0000-000000000001','Héctor Salazar Muñoz','Conserje','Turno día · 08:00 a 20:00',620000,'Indefinido','2024-03-01'),
('00000000-0000-0000-0000-000000000001','Rosa Cáceres Antúnez','Conserje','Turno noche · 20:00 a 08:00',645000,'Indefinido','2025-01-15'),
('00000000-0000-0000-0000-000000000001','Luis Peña Cortés','Auxiliar de aseo','Lunes a sábado · 07:00 a 15:00',540000,'Indefinido','2023-08-01'),
('00000000-0000-0000-0000-000000000001','Marta Reyes Silva','Jardinería','Martes y viernes · 09:00 a 14:00',320000,'Plazo fijo','2025-09-01');

insert into documentos (condominio_id, titulo, tipo, fecha, publico, nota) values
('00000000-0000-0000-0000-000000000001','Reglamento de copropiedad','Reglamento','2022-09-14',true,'Inscrito en el Conservador de Bienes Raíces.'),
('00000000-0000-0000-0000-000000000001','Acta de asamblea ordinaria 2026','Acta','2026-04-22',true,'Aprobación del presupuesto anual y elección del comité.'),
('00000000-0000-0000-0000-000000000001','Póliza de seguro de áreas comunes','Seguro','2026-01-08',true,'Incendio, sismo y responsabilidad civil hasta el 08-01-2027.'),
('00000000-0000-0000-0000-000000000001','Planos de arquitectura y loteo','Plano','2021-06-30',true,'Planta general, superficies y deslindes.'),
('00000000-0000-0000-0000-000000000001','Certificado de mantención de ascensores','Certificado','2026-08-12',false,'Emitido por Ascensores Andes SpA.'),
('00000000-0000-0000-0000-000000000001','Plan de emergencia y evacuación','Protocolo','2026-03-05',true,'Vías de evacuación, zonas seguras y roles.');

-- Presupuesto 2027
with p as (insert into presupuestos (condominio_id, anio) values ('00000000-0000-0000-0000-000000000001', 2027) returning id)
insert into presupuesto_partidas (presupuesto_id, concepto, anual)
select p.id, x.c, x.m from p, (values
  ('Remuneraciones de personal y leyes sociales', 49500000),
  ('Consumos básicos y mantención de ascensores', 33600000),
  ('Aseo, jardinería y mantención general', 16800000),
  ('Seguros y servicios contratados', 3744000),
  ('Aporte al fondo común de reserva', 5610000)) as x(c, m);
