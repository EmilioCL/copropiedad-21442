# Integración de los 3 grupos — Copropiedad 21442

Este documento explica, para cada cambio incorporado a la aplicación base de nuestro grupo,
de qué grupo vino la idea original y dónde quedó implementada. La aplicación de nuestro grupo
(ya ~70% funcional antes de esta integración) es la base de todo el proyecto: no se reescribió
nada desde cero, se adaptaron las ideas de los otros 3 grupos a nuestra arquitectura existente
(Next.js + Supabase, reglas de negocio en funciones `SECURITY DEFINER` + RLS).

Grupos integrados:
- **Grupo de Julián** — único con código funcionando (Python), cubría gastos comunes y convenio de pago.
- **Grupo de Ignacio** — documentación (PRD) de convenio de pago y multa por infracción.
- **Grupo de Felipe** — prototipo HTML/JS de asamblea y registro de copropietarios.

---

## 1. Bug reportado por el profesor: notificaciones que nunca se enviaban

**Diagnóstico propio.** La tabla `notificaciones` y la vista `/not` ya existían, pero ningún
flujo insertaba filas ahí: convocar una asamblea, cerrar una rendición o cursar una multa no
generaba ningún aviso, aunque "parecía" guardarse todo correctamente — exactamente el síntoma
que describió el profesor.

**Solución:** se agregaron triggers `SECURITY DEFINER` (mismo patrón que la bitácora existente)
que notifican automáticamente al comité y a los copropietarios al convocar una asamblea, cerrar
una rendición con transparencia activada, crear una votación o cursar/resolver una multa — sin
depender de que la página recuerde insertar la notificación.

- [`supabase/migrations/20261118000002_notificaciones_automaticas.sql`](supabase/migrations/20261118000002_notificaciones_automaticas.sql)
- Fix de un bug real encontrado en pruebas (un `CASE` sin castear al enum `rol_t` rompía el
  aviso al comité): [`20261118000009_fix_notif_asamblea_cast.sql`](supabase/migrations/20261118000009_fix_notif_asamblea_cast.sql)

---

## 2. Habilidad para votar: hay que pagar la 1ª cuota del convenio, no solo tenerlo

**Grupo de Julián** (código real, `core.py`/`service.py`) e **Ignacio** (PRD) coinciden en que
una unidad con convenio de pago solo vuelve a estar "hábil" cuando paga su primera cuota — no
por el solo hecho de habérselo aprobado. Nuestra versión anterior marcaba hábil apenas existía
un convenio vigente, sin verificar ningún pago.

**Solución:** se corrigió la vista `v_unidades` para exigir que la cuota 1 esté `pagada`, y se
agregó `pagar_cuota_convenio()` — una función que antes no existía: la columna
`convenio_cuotas.pagada` estaba en el esquema desde el inicio pero nada la actualizaba nunca.

- [`supabase/migrations/20261118000003_habilidad_convenio.sql`](supabase/migrations/20261118000003_habilidad_convenio.sql)
- UI: [`src/app/(app)/conv/page.tsx`](src/app/(app)/conv/page.tsx) (botón "Registrar pago" por cuota)

---

## 3. Habilidad de voto fija al momento de validar la asamblea

**Grupo de Felipe** (CA9 de su especificación): la habilidad para votar debe fijarse al validar
la convocatoria, no reevaluarse en vivo cada vez que alguien vota. En la versión anterior, si una
unidad pagaba su deuda a mitad de una asamblea, pasaba de inhábil a hábil y podía votar algo que
no debía.

**Solución:** `asamblea_validar()` ahora toma una foto (`asamblea_habiles`) de qué unidades están
hábiles en ese momento, y `emitir_voto()` consulta esa foto — no el estado en vivo — para
cualquier votación ligada a una asamblea ya validada.

- [`supabase/migrations/20261118000004_voto_habilidad_snapshot.sql`](supabase/migrations/20261118000004_voto_habilidad_snapshot.sql)

---

## 4. Convenio de pago: requiere aprobación del Comité de Administración

**Grupo de Julián** (código real) e **Ignacio** (PRD) modelan el convenio de pago como un flujo
de dos pasos: alguien propone, y el **comité** aprueba o rechaza — nunca el administrador directo.
En nuestra versión original, el administrador "celebraba" el convenio de inmediato (sin paso de
aprobación), y la tabla `propuestas_convenio` solo la usaban el comité/copropietario, resueltas
por el propio administrador.

**Solución:** se unificaron ambos caminos en uno solo: `proponer_convenio()` (administrador,
comité o el propio copropietario pueden originar la propuesta) → `aprobar_propuesta_convenio()`
/ `rechazar_propuesta_convenio()`, exclusivas del comité. También se incorporaron dos reglas que
ambos grupos exigían y que no existían:

- **Bloqueo de 12 meses** tras un convenio incumplido antes de poder repactar — idea de **Ignacio**.
- **No permitir una segunda propuesta/convenio** mientras ya hay uno pendiente o vigente para la
  misma unidad — validación que el `service.py` de **Julián** hacía explícitamente.

- [`supabase/migrations/20261118000001_propuesta_origen_administrador.sql`](supabase/migrations/20261118000001_propuesta_origen_administrador.sql)
- [`supabase/migrations/20261118000005_convenio_comite.sql`](supabase/migrations/20261118000005_convenio_comite.sql)
- UI: [`conv`](src/app/(app)/conv/page.tsx), [`prop`](src/app/(app)/prop/page.tsx) (ahora página
  de decisión del comité, antes de autorización del administrador), [`sol`](src/app/(app)/sol/page.tsx)

---

## 5. Multas en UTM, con tope y abono al Fondo de Reserva

**Grupo de Ignacio** (PRD de multa por infracción): las multas deben expresarse en UTM —no en
pesos libres— con un tope de 1 a 3 UTM (hasta 6 si hay reincidencia en los últimos 12 meses), y
lo recaudado debe ingresar al Fondo de Reserva al pagarse. Nuestra versión original tenía un
monto en pesos sin tope alguno, y no existía ninguna forma de pagar una multa ni de que afectara
el Fondo.

**Solución:** `cursar_multa()` calcula el monto en pesos a partir de un valor UTM configurable y
valida el tope (duplicado si hay reincidencia); `pagar_multa()` abona el monto al Fondo de
Reserva. También se incorporó una regla de Ignacio que no estaba: el comité no puede resolver la
apelación de una multa cursada a su propia unidad.

- [`supabase/migrations/20261118000006_multas_utm_fondo.sql`](supabase/migrations/20261118000006_multas_utm_fondo.sql)
- UI: [`src/app/(app)/mul/page.tsx`](src/app/(app)/mul/page.tsx)

---

## 6. Parámetros del condominio configurables (antes, todo fijo)

**Grupo de Julián/Ignacio**: el aporte al Fondo de Reserva es un **mínimo legal del 5%**
(Ley 21.442, art. 13), no un valor fijo — cada condominio puede fijarlo más alto. En la versión
original estaba hardcodeado en 5% y no existía ninguna pantalla para ajustar ningún parámetro del
condominio (tampoco el valor de la UTM, necesario para las multas).

**Solución:** nueva página de administración con una función que aplica el piso legal en
servidor (rechaza cualquier valor bajo 5%, no solo en la UI).

- [`supabase/migrations/20261118000007_parametros_condominio.sql`](supabase/migrations/20261118000007_parametros_condominio.sql)
- UI nueva: [`src/app/(app)/config/page.tsx`](src/app/(app)/config/page.tsx)

---

## 7. Citación de asamblea: entre 5 y 15 días corridos de anticipación

**Grupo de Felipe**: la Ley 21.442 exige que la citación a asamblea se anticipe entre 5 y 15 días
corridos. No había ninguna validación de esto.

- [`src/app/(app)/asam/page.tsx`](src/app/(app)/asam/page.tsx) (función `convocar`)

---

## 8. Neutralización del software

**Instrucción directa del profesor** (no viene de ningún grupo): se quitó el nombre/marca
"Parque Los Almendros" de toda la interfaz (layout, topbar, sidebar, pantalla de acceso) y del
condominio de demostración en la base de datos. El producto ya se llamaba "Copropiedad 21442" —
un nombre neutro basado en la ley, no en un edificio específico— así que se mantuvo ese nombre
como identidad de la plataforma en todos lados.

- [`supabase/migrations/20261118000008_neutralizar_nombre.sql`](supabase/migrations/20261118000008_neutralizar_nombre.sql)
- [`src/app/layout.tsx`](src/app/layout.tsx), [`src/components/topbar.tsx`](src/components/topbar.tsx),
  [`src/components/sidebar.tsx`](src/components/sidebar.tsx), [`src/components/acceso-form.tsx`](src/components/acceso-form.tsx)

---

## Ideas identificadas pero no implementadas (por alcance, no por descarte)

Siguiendo la instrucción de rescatar solo lo necesario para que la aplicación quede completa
—no absolutamente todo lo que cada grupo propuso—, quedaron fuera de esta integración, a
propósito:

- **Prorrateo con suma exacta garantizada** (grupo de Julián): hoy cada unidad se redondea
  independientemente a la decena más cercana; puede no sumar exactamente el total emitido. Mejora
  menor, no bloqueante.
- **Multipropietario / arrendatario con poder / historial de dueño con fechas** (grupos de
  Ignacio y Felipe): `unidades.propietario` sigue siendo un solo campo de texto. Implementarlo
  bien requiere rediseñar el modelo de datos de unidades (tabla de propietarios con vigencia), un
  cambio mayor que no era necesario para que los casos de uso quedaran funcionando.
- **Segunda citación fracasada por falta de quórum real** (grupo de Felipe): requeriría modelar
  un concepto de "asistencia a la sesión" que hoy no existe en el esquema (solo existe el voto
  por materia). Quedó fuera por alcance; lo que sí se implementó fue la habilidad fija al validar
  (punto 3 arriba), que es el bug concreto que afectaba la votación.
- **Registro de copropietarios** (grupo de Felipe): la base ya cubre esto razonablemente bien
  (`/res`, con tipo de ocupante, nombre del ocupante si no es el propietario residente, email) —
  no se encontraron brechas críticas que ameritaran cambios aquí.

---

## Cómo verificar

Las reglas de negocio nuevas se probaron directamente contra la base de datos en producción,
simulando cada rol (administrador, comité, copropietario) sin necesidad de credenciales de
prueba, verificando 19 casos: notificaciones automáticas, snapshot de habilidad al validar,
bloqueo de doble convenio, bloqueo de 12 meses, tope de multas en UTM, abono al Fondo, piso legal
del 5%, y el bloqueo de autoconflicto del comité — los 19 pasaron.
