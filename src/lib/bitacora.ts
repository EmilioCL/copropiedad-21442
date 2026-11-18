const ACCIONES: Record<string, Partial<Record<"INSERT" | "UPDATE" | "DELETE", string>>> = {
  emisiones: { INSERT: "Se emitieron los gastos comunes" },
  pagos: { INSERT: "Se registró un pago" },
  convenios: { INSERT: "Se activó un convenio de pago", UPDATE: "Se actualizó un convenio de pago" },
  propuestas_convenio: { INSERT: "Se propuso un convenio de pago" },
  cobranzas: { INSERT: "Se abrió una cobranza", UPDATE: "Se actualizó una cobranza" },
  asambleas: { INSERT: "Se convocó una asamblea", UPDATE: "Se validó una asamblea" },
  votaciones: { INSERT: "Se creó una votación", UPDATE: "Se cerró una votación" },
  rendiciones: { INSERT: "Se cerró una rendición de cuentas" },
  fondo_movimientos: { INSERT: "Se registró un movimiento en el fondo de reserva" },
  multas: { INSERT: "Se cursó una multa", UPDATE: "Se actualizó una multa" },
  documentos: { INSERT: "Se publicó un documento", UPDATE: "Se actualizó un documento", DELETE: "Se eliminó un documento" },
  trabajadores: { INSERT: "Se registró un trabajador", UPDATE: "Se actualizó un trabajador" },
  turnos: { INSERT: "Se abrió un turno de conserjería", UPDATE: "Se cerró un turno de conserjería" },
  mantenciones: { UPDATE: "Se certificó una mantención" },
  acta: { INSERT: "Se levantó un acta" },
};

/** Traduce una fila de bitácora ("INSERT asambleas") a una frase entendible para cualquier persona. */
export function describirAccion(accion: string): string {
  const [op, tabla] = accion.split(" ");
  const texto = ACCIONES[tabla]?.[op as "INSERT" | "UPDATE" | "DELETE"];
  return texto ?? accion;
}
