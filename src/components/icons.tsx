import type { CSSProperties, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 20 20",
    width: 17,
    height: 17,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

/** Logo de la plataforma: dos torres en arco + almendra cobre. */
export function Logo({
  tone = "dark",
  className,
  style,
}: {
  tone?: "dark" | "light";
  className?: string;
  style?: CSSProperties;
}) {
  const bg = tone === "dark" ? "#1E3450" : "rgba(46,91,132,.34)";
  const strokeColor = "#8FB9E6";
  const ellipseColor = tone === "dark" ? "#C9762F" : "#DD8C3D";
  return (
    <svg viewBox="0 0 64 64" width={34} height={34} className={className} style={style}>
      <rect x="2" y="2" width="60" height="60" rx="17" fill={bg} />
      <path
        d="M32 14 L49 24 L49 50 L38 50 L38 35 L26 35 L26 50 L15 50 L15 24 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth={2.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <ellipse cx={32} cy={25} rx={5.4} ry={3.2} fill={ellipseColor} transform="rotate(-32 32 25)" />
    </svg>
  );
}

export function IconTurno(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6.2V10l2.8 2" />
    </svg>
  );
}

export function IconAcceso(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 16.5v-11a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11" />
      <path d="M12 10h4v6.5M3 16.5h14M9 10h.01" />
    </svg>
  );
}

export function IconEncomienda(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 7 10 3.8 16.5 7v6L10 16.2 3.5 13z" />
      <path d="M3.5 7 10 10.2 16.5 7M10 10.2v6" />
    </svg>
  );
}

export function IconPanel(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function IconMiUnidad(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M8 17v-4.5h4V17" />
    </svg>
  );
}

export function IconVotaciones(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 11.5 10 14l6-2.5" />
      <path d="M6.5 9.5V4.5h7v5" />
      <path d="M4 11.5v3.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3.5" />
    </svg>
  );
}

export function IconRepactar(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 8.5A6 6 0 0 1 15 6" />
      <path d="M16 4v3h-3" />
      <path d="M16 11.5A6 6 0 0 1 5 14" />
      <path d="M4 16v-3h3" />
    </svg>
  );
}

export function IconNotificaciones(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M10 3a4.5 4.5 0 0 0-4.5 4.5c0 3-1.5 4-1.5 5.5h12c0-1.5-1.5-2.5-1.5-5.5A4.5 4.5 0 0 0 10 3z" />
      <path d="M8 15.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconGastosComunes(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3.5" y="3.5" width="13" height="13" rx="2" />
      <path d="M3.5 8h13M7 12h6" />
    </svg>
  );
}

export function IconRecaudacion(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 6.5h13v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z" />
      <path d="M3.5 6.5 10 3l6.5 3.5M13 11h1.5" />
    </svg>
  );
}

export function IconPersonalConserjeria(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="10" cy="7" r="2.6" />
      <path d="M4.5 16.5c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6" />
    </svg>
  );
}

export function IconRegistroResidentes(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 3.5h10v13H5z" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" />
    </svg>
  );
}

export function IconAsamblea(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="6.5" cy="7" r="2" />
      <circle cx="13.5" cy="7" r="2" />
      <path d="M3 15.5c0-2 1.6-3.2 3.5-3.2S10 13.5 10 15.5M10 15.5c0-2 1.6-3.2 3.5-3.2s3.5 1.2 3.5 3.2" />
    </svg>
  );
}

export function IconConvenio(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 6.5h12v9H4z" />
      <path d="M4 6.5 10 3l6 3.5" />
      <path d="M8 11.5l1.6 1.6L13 10" />
    </svg>
  );
}

export function IconPropuestas(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 11.8h3.7l1.1 2h3.4l1.1-2h3.7" />
      <path d="M5.6 4.5h8.8l2.1 7.3v3.7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-3.7z" />
    </svg>
  );
}

export function IconRendirCuentas(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4.5 15.5V9M8.5 15.5V5M12.5 15.5v-4M16.5 15.5V7" />
    </svg>
  );
}

export function IconFondo(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6.5v7M8 8.6h3.2M8.6 11.4H12" />
    </svg>
  );
}

export function IconCobranza(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 3.5h8v13H6z" />
      <path d="M8.5 7h3M8.5 10h3M8.5 13h1.5" />
      <path d="M13.5 13.5 17 17" />
    </svg>
  );
}

export function IconPresupuesto(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3.5 14.5 7.5 9l3.2 3 5.8-7" />
      <path d="M12 5h4.5v4.5" />
    </svg>
  );
}

export function IconMantenciones(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12.8 4.2a3.3 3.3 0 0 0 4.3 4.3l-8.4 8.4-4.3-4.3z" />
      <path d="M6 15l-1.5 1.5" />
    </svg>
  );
}

export function IconTrabajadores(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="7.5" cy="7.3" r="2.3" />
      <circle cx="13.6" cy="8" r="1.8" />
      <path d="M3 16.3c0-2.6 2-4.1 4.5-4.1s4.5 1.5 4.5 4.1" />
      <path d="M13.2 12.5c2 .2 3.8 1.5 3.8 3.8" />
    </svg>
  );
}

export function IconDocumentos(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 3.5h6l4 4v9H5z" />
      <path d="M11 3.5v4h4" />
      <path d="M7.5 11h5M7.5 13.5h3" />
    </svg>
  );
}

export function IconMultas(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M10 3.5 17 16.5H3z" />
      <path d="M10 8v3.5M10 14h.01" />
    </svg>
  );
}

export function IconEspacios(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M2.8 9.2a7.2 7.2 0 0 1 14.4 0z" />
      <path d="M10 9.2V16" />
      <path d="M7.6 16.3a2.4 2.4 0 0 1 4.8 0" />
      <path d="M10 4V2.6" />
    </svg>
  );
}

export function IconBitacora(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6.5V10l2.5 1.8" />
    </svg>
  );
}

export function IconBuscar(p: IconProps) {
  return (
    <svg viewBox="0 0 20 20" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" {...p}>
      <circle cx="9" cy="9" r="5.4" />
      <path d="m13.2 13.2 3.3 3.3" />
    </svg>
  );
}

export function IconCerrarSesion(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M8 3.5H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3" />
      <path d="M12.5 13.5 17 10l-4.5-3.5M17 10H7.5" />
    </svg>
  );
}
