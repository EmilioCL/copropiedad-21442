import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Búsqueda global por unidad/propietario/ocupante. Sin filtro manual de permisos:
// la RLS de `unidades` ya limita lo que cada rol puede ver (admin/comité todas,
// conserje todas, copropietario solo la suya).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ resultados: [] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unidades")
    .select("id, codigo, propietario, ocupante_nombre")
    .or(`codigo.ilike.%${q}%,propietario.ilike.%${q}%,ocupante_nombre.ilike.%${q}%`)
    .limit(8);

  if (error) return NextResponse.json({ resultados: [] });

  const resultados = (data ?? []).map((u) => ({
    grupo: "Unidad",
    titulo: u.codigo,
    sub: u.ocupante_nombre ?? u.propietario,
    href: `/res?unidad=${u.id}`,
  }));

  return NextResponse.json({ resultados });
}
