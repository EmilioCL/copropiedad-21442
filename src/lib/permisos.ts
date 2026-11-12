export type Rol = "administrador" | "comite" | "copropietario" | "conserje";

export const NOMBRE_ROL: Record<Rol, string> = {
  administrador: "Administrador",
  comite: "Comité de administración",
  copropietario: "Copropietario",
  conserje: "Conserje",
};

/** Rutas y qué roles pueden abrirlas (ver tabla "Permisos por vista" del README). */
export const PERMISOS: Record<string, Rol[]> = {
  panel: ["administrador", "comite"],
  mi: ["copropietario"],
  res: ["administrador", "comite"],
  gc: ["administrador"],
  rec: ["administrador"],
  pres: ["administrador", "comite"],
  fondo: ["administrador"],
  cob: ["administrador"],
  asam: ["administrador", "comite"],
  vot: ["administrador", "comite", "copropietario"],
  conv: ["administrador", "comite"],
  prop: ["administrador"],
  sol: ["copropietario"],
  rend: ["administrador", "comite"],
  mul: ["administrador", "comite", "copropietario", "conserje"],
  esp: ["administrador", "comite", "copropietario", "conserje"],
  mant: ["administrador", "comite", "conserje"],
  pers: ["administrador"],
  per: ["administrador"],
  docs: ["administrador", "comite", "copropietario", "conserje"],
  turno: ["conserje"],
  acc: ["administrador", "conserje"],
  enc: ["administrador", "copropietario", "conserje"],
  not: ["administrador", "comite", "copropietario", "conserje"],
  bit: ["administrador", "comite"],
};

/** Vista de inicio por rol, a la que redirige "/" tras iniciar sesión. */
export const INICIO_POR_ROL: Record<Rol, string> = {
  administrador: "/panel",
  comite: "/panel",
  copropietario: "/mi",
  conserje: "/turno",
};

export function puedeAcceder(rol: Rol, ruta: string): boolean {
  const permitido = PERMISOS[ruta];
  return permitido ? permitido.includes(rol) : false;
}
