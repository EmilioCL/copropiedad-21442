"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconBuscar } from "@/components/icons";
import { NOMBRE_ROL } from "@/lib/permisos";
import type { Rol } from "@/lib/permisos";

type Resultado = { grupo: string; titulo: string; sub: string | null; href: string };

function periodoActual() {
  const d = new Date();
  const mes = d.toLocaleDateString("es-CL", { month: "long" });
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${d.getFullYear()}`;
}

export function Topbar({ rol, nombre }: { rol: Rol; nombre: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 2) {
      setResultados(null);
      return;
    }
    debounce.current = setTimeout(async () => {
      const r = await fetch(`/api/buscar?q=${encodeURIComponent(q.trim())}`);
      const d = await r.json();
      setResultados(d.resultados ?? []);
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q]);

  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/acceso");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <div className="relative flex min-w-[250px] items-center gap-2.25 rounded-pill border border-border-soft bg-surface px-3.5 py-2 shadow-[0_1px_2px_rgba(24,27,31,.04)]">
        <IconBuscar className="flex-none text-[#8A9098]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar unidad, persona o folio…"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink-1 outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="flex-none px-0.5 text-[15px] leading-none text-[#8A9098]"
          >
            ×
          </button>
        )}
        {resultados !== null && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] max-h-[400px] overflow-y-auto rounded-2xl border border-border-strong bg-surface shadow-[0_18px_44px_-16px_rgba(24,27,31,.3)]">
            <div className="flex items-center justify-between gap-3 border-b border-border-soft bg-surface-2 px-4 py-2.5">
              <span className="font-mono text-[9.5px] tracking-[.9px] text-ink-6">RESULTADOS</span>
              <span className="font-mono text-[10px] text-[#8A9098]">{resultados.length}</span>
            </div>
            {resultados.length === 0 ? (
              <div className="px-4 py-5 text-[12.5px] text-ink-5">
                Sin coincidencias en unidades, personas ni folios registrados.
              </div>
            ) : (
              resultados.map((r, i) => (
                <Link
                  key={i}
                  href={r.href}
                  onClick={() => setResultados(null)}
                  className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 border-b border-[#F0EEE9] px-4 py-2.75 last:border-b-0 hover:bg-surface-2"
                >
                  <span className="justify-self-start whitespace-nowrap rounded-[5px] bg-info-bg px-1.75 py-0.75 font-mono text-[9.5px] tracking-[.6px] text-blue-text">
                    {r.grupo}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[12.5px] font-semibold text-ink-2">{r.titulo}</span>
                    <span className="truncate text-[11.5px] text-ink-5">{r.sub}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.25 rounded-pill border border-border-soft bg-surface py-1.75 pl-2.25 pr-3.5 shadow-[0_1px_3px_rgba(24,27,31,.055),0_1px_2px_rgba(24,27,31,.03)]">
        <span className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-sidebar text-[10.5px] font-semibold text-[#E9EEF4]">
          {iniciales || "?"}
        </span>
        <span className="text-[12.5px] font-semibold">{NOMBRE_ROL[rol]}</span>
        <button
          type="button"
          onClick={cerrarSesion}
          className="rounded-pill border border-border-strong px-2.75 py-1.25 text-[11.5px] text-ink-4 hover:bg-app-bg hover:text-ink-1"
        >
          Salir
        </button>
      </div>

      <div className="flex items-center gap-2.25 rounded-pill border border-border-soft bg-surface px-3.75 py-2.25 shadow-[0_1px_3px_rgba(24,27,31,.055),0_1px_2px_rgba(24,27,31,.03)]">
        <span className="h-1.75 w-1.75 rounded-full bg-success shadow-[0_0_0_3px_rgba(31,130,86,.15)]" />
        <span className="text-[12.5px] font-medium">Cond. Parque Los Almendros</span>
      </div>

      <div className="rounded-pill border border-border-soft bg-surface-2 px-3.5 py-2.25 font-mono text-[11px] text-ink-4">
        {periodoActual()}
      </div>
    </div>
  );
}
