import { NextResponse } from "next/server";
import { getPerfilActual } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";

/**
 * Comprobante descargable de una rendición ya cerrada, solo para el administrador.
 * No se guarda en ningún lado ni dispara notificaciones: se arma al vuelo desde
 * los datos que ya quedaron registrados al cerrar el período.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await getPerfilActual();
  if (perfil.rol !== "administrador") {
    return NextResponse.json({ error: "Solo el administrador descarga este comprobante." }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("rendiciones")
    .select("folio, periodo, ingresos, egresos, cerrada_en")
    .eq("id", id)
    .eq("condominio_id", perfil.condominioId)
    .single();

  if (!r) return NextResponse.json({ error: "Rendición no encontrada." }, { status: 404 });

  const cerrada = new Date(r.cerrada_en).toLocaleString("es-CL", { timeZone: "America/Santiago" });
  const filas = [
    ["Folio", "Período", "Ingresos", "Egresos", "Balance", "Cerrada el"],
    [r.folio, r.periodo, String(r.ingresos), String(r.egresos), String(r.ingresos - r.egresos), cerrada],
  ];
  const csv = "﻿" + filas.map((f) => f.join(";")).join("\r\n") + "\r\n";

  const nombreArchivo = `rendicion-${r.periodo.replace(/[^a-zA-Z0-9]+/g, "-")}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
