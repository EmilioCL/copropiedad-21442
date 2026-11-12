const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function money(n: number | null | undefined): string {
  return CLP.format(n ?? 0);
}

// Columnas `date` (sin hora) de Postgres llegan como "YYYY-MM-DD": se formatean
// fijando timeZone:"UTC" para que no se corran un día según la zona del servidor.
const FECHA = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const FECHA_CORTA = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
// Columnas `timestamptz`: se muestran en la zona horaria del condominio.
const FECHA_HORA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Santiago",
});

export function fecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return FECHA.format(new Date(iso));
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  return FECHA_CORTA.format(new Date(iso));
}

export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return FECHA_HORA.format(new Date(iso));
}

export function porcentaje(n: number | null | undefined, decimales = 1): string {
  return `${(n ?? 0).toFixed(decimales)}%`;
}
