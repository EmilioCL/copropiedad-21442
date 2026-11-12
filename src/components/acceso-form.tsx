"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/icons";
import type { Rol } from "@/lib/permisos";

const PERFILES: { rol: Rol; iniciales: string; etiqueta: string; email: string }[] = [
  { rol: "administrador", iniciales: "PN", etiqueta: "Administrador", email: "admin@demo.cl" },
  { rol: "comite", iniciales: "SL", etiqueta: "Comité", email: "comite@demo.cl" },
  { rol: "copropietario", iniciales: "CP", etiqueta: "Copropietario", email: "copropietario@demo.cl" },
  { rol: "conserje", iniciales: "CJ", etiqueta: "Conserje", email: "conserje@demo.cl" },
];

const NOTA_POR_ROL: Record<Rol, string> = {
  administrador: "Emite gastos comunes, registra pagos, convoca asambleas y rinde cuentas.",
  comite: "Fiscaliza las finanzas, propone convenios y resuelve apelaciones de multas.",
  copropietario: "Consulta su estado de cuenta, vota y reserva espacios comunes.",
  conserje: "Abre turno, registra accesos, visitas, vehículos y encomiendas.",
};

export function AccesoForm() {
  const router = useRouter();
  const supabase = createClient();

  const [rol, setRol] = useState<Rol>("administrador");
  const [email, setEmail] = useState(PERFILES[0].email);
  const [password, setPassword] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  function elegirPerfil(p: (typeof PERFILES)[number]) {
    setRol(p.rol);
    setEmail(p.email);
    setError(null);
  }

  async function entrar() {
    setError(null);
    if (!email || !password) {
      setError("Ingresa tu correo y tu clave de acceso.");
      return;
    }
    setVerificando(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setVerificando(false);

    if (authError) {
      setError("Clave de acceso incorrecta. Use la clave de demostración indicada abajo.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-y-auto overflow-x-hidden bg-access text-[#E9EEF4]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-22%]"
        style={{
          background:
            "radial-gradient(34% 30% at 26% 16%, rgba(46,91,132,.52), transparent 66%), radial-gradient(30% 28% at 74% 78%, rgba(201,118,47,.24), transparent 70%), radial-gradient(26% 24% at 58% 8%, rgba(143,185,230,.16), transparent 72%)",
          animation: "drift 24s ease-in-out infinite",
        }}
      />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-5 border-b border-[#8FB9E6]/[.13] px-8 py-4">
        <div className="flex items-center gap-3">
          <Logo tone="light" className="h-11 w-11 flex-none" />
          <div className="flex flex-col gap-0.5">
            <div className="font-display text-[19px] font-semibold tracking-[-.3px]">Parque Los Almendros</div>
            <div className="font-mono text-[9.5px] tracking-[1.1px] text-[#7D8EA3]">PLATAFORMA DE ADMINISTRACIÓN</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-pill border border-[#8FB9E6]/25 bg-[#8FB9E6]/10 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6FE3A8]" style={{ animation: "pulseDot 2.6s ease-out infinite" }} />
            <span className="font-mono text-[9.5px] tracking-[.9px] text-[#B7D3F0]">SISTEMA OPERATIVO</span>
          </div>
          <div className="rounded-pill border border-[#8FB9E6]/[.16] bg-[#8FB9E6]/[.06] px-3.5 py-1.5 font-mono text-[9.5px] tracking-[.9px] text-blue-sidebar">
            LEY N° 21.442
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-8 py-4">
        <div className="flex w-full max-w-[466px] flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="font-display text-[25px] font-medium tracking-[-.7px]">Acceso al sistema</h1>
            <p className="text-[13.5px] leading-[1.55] text-[#9DB0C4]">
              Cada perfil accede únicamente a las facultades que la Ley N° 21.442 le reconoce.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              entrar();
            }}
            className="flex flex-col gap-4 rounded-card border border-white/60 bg-[#FBFAF7] p-5.5 text-ink-1 shadow-[0_26px_60px_-26px_rgba(4,10,18,.8),0_2px_6px_rgba(4,10,18,.3)]"
          >
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[9.5px] tracking-[1.1px] text-[#7A8087]">1 · PERFIL DE ACCESO</span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {PERFILES.map((p) => {
                  const activo = p.rol === rol;
                  return (
                    <button
                      key={p.rol}
                      type="button"
                      onClick={() => elegirPerfil(p)}
                      className="relative flex flex-col items-center gap-2 rounded-profile border px-2 py-3 transition-colors"
                      style={{
                        borderColor: activo ? "#1B3A5B" : "#E2DFD8",
                        borderWidth: activo ? 1.5 : 1,
                        background: activo ? "#F1F5FA" : "#FFFFFF",
                      }}
                    >
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-[11px] font-mono text-[11px] font-semibold"
                        style={{
                          background: activo ? "#1B3A5B" : "#F2F1ED",
                          color: activo ? "#E9EEF4" : "#6E747B",
                        }}
                      >
                        {p.iniciales}
                      </span>
                      <span className="text-center text-[12px] font-semibold leading-[1.25]">{p.etiqueta}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[12px] leading-[1.5] text-ink-5">{NOTA_POR_ROL[rol]}</span>
            </div>

            <div className="h-px bg-[#EAE7E0]" />

            <div className="flex flex-col gap-3">
              <span className="font-mono text-[9.5px] tracking-[1.1px] text-[#7A8087]">2 · CREDENCIALES</span>

              <label className="flex flex-col gap-1.5 text-[12px] text-ink-5">
                Correo
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.cl"
                  className="rounded-control border border-border-strong bg-white px-3.5 py-3 text-[14px] text-ink-1 outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-[12px] text-ink-5">
                Clave de acceso
                <span className="relative flex items-center">
                  <input
                    type={verClave ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingrese su clave"
                    className="w-full rounded-control border border-border-strong bg-white px-3.5 py-3.25 pr-20 text-[14px] text-ink-1 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave((v) => !v)}
                    className="absolute right-1.5 rounded-lg border border-[#E2DFD8] bg-[#F6F4F0] px-2.5 py-1.5 text-[11px] font-semibold text-ink-4"
                  >
                    {verClave ? "Ocultar" : "Ver"}
                  </button>
                </span>
              </label>

              {error && (
                <div className="flex gap-2.5 rounded-control border border-warn-border bg-warn-bg px-3.5 py-3">
                  <span className="pt-px font-mono text-[11px] text-warn-text">!</span>
                  <span className="text-[12.5px] leading-[1.45] text-warn-text">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verificando}
                className="flex items-center justify-center gap-2 rounded-control bg-gradient-to-b from-blue-hover to-blue py-3.5 text-[13px] font-semibold uppercase tracking-[.14em] text-white transition-opacity disabled:opacity-60"
              >
                {verificando && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                )}
                <span>{verificando ? "Verificando…" : "Ingresar"}</span>
                {!verificando && <span className="font-mono text-[13px]">→</span>}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-chip border border-info-border bg-info-bg px-1.5 py-0.5 font-mono text-[9.5px] text-blue-text">
                    DEMO
                  </span>
                  <span className="text-[12px] text-ink-5">Clave</span>
                  <span className="font-mono text-[13px] font-medium tracking-[1.5px]">Demo2026!</span>
                </div>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6FE3A8]" />
            <span className="font-mono text-[9.5px] tracking-[.8px] text-[#7D8EA3]">
              CONEXIÓN CIFRADA · CONTROL DE ACCESO POR PERFIL
            </span>
          </div>
        </div>
      </div>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-5 border-t border-[#8FB9E6]/[.13] px-8 py-3.5">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[18px] font-medium">12</span>
            <span className="font-mono text-[9px] tracking-[.7px] text-[#7D8EA3]">UNIDADES</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[18px] font-medium">2</span>
            <span className="font-mono text-[9px] tracking-[.7px] text-[#7D8EA3]">TORRES</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[18px] font-medium">871</span>
            <span className="font-mono text-[9px] tracking-[.7px] text-[#7D8EA3]">M² EDIFICADOS</span>
          </div>
        </div>
        <span className="font-mono text-[9px] tracking-[.7px] text-[#5D7793]">COPROPIEDAD INMOBILIARIA · CHILE</span>
      </footer>
    </div>
  );
}
