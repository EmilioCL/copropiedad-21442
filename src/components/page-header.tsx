import { Topbar } from "@/components/topbar";
import { NOMBRE_ROL } from "@/lib/permisos";
import type { Rol } from "@/lib/permisos";

export function PageHeader({
  title,
  subtitle,
  nota,
  rol,
  nombre,
}: {
  title: string;
  subtitle: string;
  nota: string;
  rol: Rol;
  nombre: string;
}) {
  return (
    <header className="mb-6.5 flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-1.75">
        <h1 className="font-display text-[31px] font-medium tracking-[-.7px]">{title}</h1>
        <div className="max-w-[640px] text-[13.5px] text-ink-5">{subtitle}</div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-text" />
          <span className="text-[12.5px] text-ink-3">
            Sesión como <b className="font-semibold">{NOMBRE_ROL[rol]}</b> — {nota}
          </span>
        </div>
      </div>
      <Topbar rol={rol} nombre={nombre} />
    </header>
  );
}

export function VistaEnConstruccion() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-card border border-border-soft bg-surface p-7 text-ink-5">
      <span className="font-mono text-[10px] tracking-[.9px] text-blue-text">EN CONSTRUCCIÓN</span>
      <p className="max-w-[520px] text-[13.5px] leading-relaxed">
        Esta vista se implementará en la Fase 3 del plan (paso 7 de CLAUDE.md), reproduciendo el
        prototipo con datos reales de Supabase.
      </p>
    </div>
  );
}
