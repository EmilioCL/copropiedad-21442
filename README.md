# Copropiedad 21442

Plataforma de administración de condominios bajo la **Ley N° 21.442 de Copropiedad Inmobiliaria**
(Chile). Un mismo sistema, cuatro roles —administrador, comité de administración, copropietario
y conserje— cada uno viendo y pudiendo hacer solo lo que la ley le reconoce.

Este proyecto integra, sobre una base propia ya funcional, las propuestas de tres grupos del
curso (ver [ATRIBUCION.md](ATRIBUCION.md) para el detalle de qué idea vino de qué grupo y dónde
quedó implementada).

## Stack

- **Next.js 16** (App Router, Server Actions) + **React 19** + TypeScript
- **Supabase** — Postgres, Auth y Row Level Security. Las reglas de negocio que no son un simple
  filtro de fila viven en funciones `SECURITY DEFINER` (ver `supabase/migrations/`), no en el
  cliente.
- **Tailwind CSS 4**
- Desplegado en **Vercel**

## Casos de uso

| Módulo | Ruta | Quién |
|---|---|---|
| Gastos comunes y recaudación | `/gc`, `/rec` | Administrador |
| Convenio de pago (con aprobación del comité) | `/conv`, `/prop`, `/sol` | Los 3 roles de gestión |
| Asambleas y votaciones | `/asam`, `/vot` | Administrador, comité, copropietario |
| Rendición de cuentas | `/rend` | Administrador, comité |
| Fondo de reserva y cobranza | `/fondo`, `/cob` | Administrador |
| Multas por infracción (en UTM) | `/mul` | Todos |
| Conserjería (turnos, accesos, encomiendas) | `/turno`, `/acc`, `/enc` | Conserje |
| Parámetros del condominio | `/config` | Administrador |
| Notificaciones y bitácora | `/not`, `/bit` | Todos / gestión |

El detalle de reglas de negocio (quién puede hacer qué, topes, plazos) está documentado como
comentarios en cada migración de `supabase/migrations/`, en el orden en que se fueron agregando.

## Correr en local

```bash
npm install
npm run dev
```

Necesitas un archivo `.env.local` con las credenciales de un proyecto Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-clave-publica>
```

Para aplicar el esquema completo a un proyecto Supabase nuevo:

```bash
npx supabase db push --remote
```

`supabase/seed.sql` tiene los datos de demostración (12 unidades en 2 torres, espacios comunes,
mantenciones, trabajadores, documentos y presupuesto). Insértalo manualmente contra tu proyecto
después de aplicar las migraciones — `db push` solo sincroniza el esquema, no datos.

## Cuentas de demostración

Cuatro cuentas, una por rol, creadas en Supabase Auth y vinculadas vía
`supabase/migrations/20261112000003_perfiles_demo.sql`:

- `admin@demo.cl` — Administrador
- `comite@demo.cl` — Comité de administración
- `copropietario@demo.cl` — Copropietario (unidad B-202)
- `conserje@demo.cl` — Conserje

Las contraseñas no se guardan en el repositorio; se gestionan directamente en el dashboard de
Supabase (Authentication → Users).

## Estructura

```
src/app/(app)/<ruta>/page.tsx   — una página + sus server actions por caso de uso
src/lib/permisos.ts             — qué rol puede abrir qué ruta
src/lib/guard.ts                — redirige si el rol no tiene permiso
supabase/migrations/            — esquema + reglas de negocio, en orden cronológico
supabase/seed.sql               — datos de demostración
ATRIBUCION.md                   — qué grupo propuso qué, y dónde quedó
```
