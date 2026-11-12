"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Rol } from "@/lib/permisos";
import {
  Logo,
  IconTurno,
  IconAcceso,
  IconEncomienda,
  IconPanel,
  IconMiUnidad,
  IconVotaciones,
  IconRepactar,
  IconNotificaciones,
  IconGastosComunes,
  IconRecaudacion,
  IconPersonalConserjeria,
  IconRegistroResidentes,
  IconAsamblea,
  IconConvenio,
  IconPropuestas,
  IconRendirCuentas,
  IconFondo,
  IconCobranza,
  IconPresupuesto,
  IconMantenciones,
  IconTrabajadores,
  IconDocumentos,
  IconMultas,
  IconEspacios,
  IconBitacora,
  IconCerrarSesion,
} from "@/components/icons";
import { NOMBRE_ROL } from "@/lib/permisos";

type Item = { href: string; label: string; icon: ReactNode };

function NavLink({ item, activo }: { item: Item; activo: boolean }) {
  return (
    <Link
      href={item.href}
      className="relative flex w-full items-center gap-2.75 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors hover:bg-sidebar-active/60"
      style={activo ? { background: "#1E3450", border: "1px solid #2C4A6B" } : undefined}
    >
      <span className="relative flex-none text-blue-sidebar">{item.icon}</span>
      <span className="relative flex-1">{item.label}</span>
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-2 pt-4 font-mono text-[9.5px] tracking-[1.1px] text-[#7D8EA3]">{children}</div>
  );
}

export function Sidebar({
  rol,
  nombre,
  unidades,
}: {
  rol: Rol;
  nombre: string;
  unidades: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const esAdmin = rol === "administrador";
  const esComite = rol === "comite";
  const esCoprop = rol === "copropietario";
  const esConserje = rol === "conserje";
  const gestion = esAdmin || esComite;

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/acceso");
    router.refresh();
  }

  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <aside className="relative flex h-full w-[246px] flex-none flex-col overflow-y-auto border-r border-sidebar-line bg-sidebar px-4 py-6 text-[#E9EEF4]">
      <div className="flex items-center gap-3 border-b border-[#8FB9E6]/[.14] px-1.5 pb-4">
        <Logo tone="dark" className="flex-none" style={{ animation: "logoBreathe 5s ease-in-out infinite" }} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="font-display text-[14px] font-semibold leading-[1.18] tracking-[-.2px]">
            Parque Los Almendros
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.25 w-1.25 flex-none rounded-full bg-[#6FE3A8]" />
            <span className="whitespace-nowrap font-mono text-[9px] tracking-[.7px] text-[#7D8EA3]">
              {unidades} {unidades === 1 ? "UNIDAD" : "UNIDADES"}
            </span>
          </div>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {esConserje && (
          <>
            <SectionLabel>CONSERJERÍA</SectionLabel>
            <NavLink item={{ href: "/turno", label: "Mi turno", icon: <IconTurno /> }} activo={pathname === "/turno"} />
            <NavLink item={{ href: "/acc", label: "Control de acceso", icon: <IconAcceso /> }} activo={pathname === "/acc"} />
            <NavLink item={{ href: "/enc", label: "Encomiendas", icon: <IconEncomienda /> }} activo={pathname === "/enc"} />
          </>
        )}

        {gestion && (
          <NavLink item={{ href: "/panel", label: "Panel general", icon: <IconPanel /> }} activo={pathname === "/panel"} />
        )}

        {esCoprop && (
          <>
            <NavLink item={{ href: "/mi", label: "Mi unidad", icon: <IconMiUnidad /> }} activo={pathname === "/mi"} />
            <NavLink item={{ href: "/vot", label: "Votaciones", icon: <IconVotaciones /> }} activo={pathname === "/vot"} />
            <NavLink item={{ href: "/sol", label: "Repactar mi deuda", icon: <IconRepactar /> }} activo={pathname === "/sol"} />
          </>
        )}

        <SectionLabel>AVISOS</SectionLabel>
        <NavLink item={{ href: "/not", label: "Notificaciones", icon: <IconNotificaciones /> }} activo={pathname === "/not"} />

        {esAdmin && (
          <>
            <SectionLabel>GESTIÓN FINANCIERA</SectionLabel>
            <NavLink item={{ href: "/gc", label: "Emitir gastos comunes", icon: <IconGastosComunes /> }} activo={pathname === "/gc"} />
            <NavLink item={{ href: "/rec", label: "Recaudación", icon: <IconRecaudacion /> }} activo={pathname === "/rec"} />
            <NavLink item={{ href: "/per", label: "Personal", icon: <IconPersonalConserjeria /> }} activo={pathname === "/per"} />
          </>
        )}

        {gestion && (
          <>
            <SectionLabel>CASOS DE USO</SectionLabel>
            {esAdmin && (
              <NavLink item={{ href: "/res", label: "Registro residentes", icon: <IconRegistroResidentes /> }} activo={pathname === "/res"} />
            )}
            <NavLink item={{ href: "/asam", label: "Convocar asamblea", icon: <IconAsamblea /> }} activo={pathname === "/asam"} />
            <NavLink item={{ href: "/vot", label: "Votaciones", icon: <IconVotaciones /> }} activo={pathname === "/vot"} />
            <NavLink item={{ href: "/conv", label: "Convenio de pago", icon: <IconConvenio /> }} activo={pathname === "/conv"} />
            {esAdmin && (
              <NavLink item={{ href: "/prop", label: "Convenios propuestos", icon: <IconPropuestas /> }} activo={pathname === "/prop"} />
            )}
            <NavLink item={{ href: "/rend", label: "Rendir cuentas", icon: <IconRendirCuentas /> }} activo={pathname === "/rend"} />
            {esAdmin && (
              <>
                <NavLink item={{ href: "/fondo", label: "Fondo de reserva", icon: <IconFondo /> }} activo={pathname === "/fondo"} />
                <NavLink item={{ href: "/cob", label: "Cobranza", icon: <IconCobranza /> }} activo={pathname === "/cob"} />
              </>
            )}
            <NavLink item={{ href: "/pres", label: "Presupuesto anual", icon: <IconPresupuesto /> }} activo={pathname === "/pres"} />
          </>
        )}

        <SectionLabel>OPERACIONES</SectionLabel>
        <NavLink item={{ href: "/mant", label: "Mantenciones", icon: <IconMantenciones /> }} activo={pathname === "/mant"} />
        {esAdmin && (
          <NavLink item={{ href: "/pers", label: "Trabajadores", icon: <IconTrabajadores /> }} activo={pathname === "/pers"} />
        )}
        <NavLink item={{ href: "/docs", label: "Documentos", icon: <IconDocumentos /> }} activo={pathname === "/docs"} />

        <SectionLabel>CONVIVENCIA</SectionLabel>
        {!esConserje && (
          <NavLink item={{ href: "/mul", label: "Multas", icon: <IconMultas /> }} activo={pathname === "/mul"} />
        )}
        <NavLink item={{ href: "/esp", label: "Espacios comunes", icon: <IconEspacios /> }} activo={pathname === "/esp"} />

        {gestion && (
          <>
            <SectionLabel>TRAZABILIDAD</SectionLabel>
            <NavLink item={{ href: "/bit", label: "Bitácora de gestión", icon: <IconBitacora /> }} activo={pathname === "/bit"} />
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={cerrarSesion}
        className="mt-auto flex w-full items-center gap-2.25 rounded-[11px] border border-sidebar-border bg-transparent px-3 py-2.25 text-left text-[11.5px] text-[#B7C4D3] transition-colors hover:bg-sidebar-active hover:text-white"
      >
        <IconCerrarSesion width={15} height={15} className="flex-none" />
        <span>Cerrar sesión</span>
      </button>

      <div className="mt-3 flex items-center gap-2.75 rounded-2xl border border-white/[.08] bg-white/[.05] p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[.14] text-[12px] font-semibold">
          {iniciales || "?"}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="truncate text-[12.5px] font-semibold">{nombre}</div>
          <div className="text-[11px] text-white/50">{NOMBRE_ROL[rol]}</div>
        </div>
      </div>
    </aside>
  );
}
