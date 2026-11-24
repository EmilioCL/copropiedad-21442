"use client";

import type { ReactNode } from "react";

/** Botón de envío que pide confirmación antes de disparar una acción destructiva. */
export function ConfirmButton({
  children,
  mensaje,
  className = "",
}: {
  children: ReactNode;
  mensaje: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={`inline-flex items-center justify-center gap-2 rounded-control bg-gradient-to-b from-[#C85A3F] to-[#A8432F] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-opacity disabled:opacity-50 ${className}`}
      onClick={(e) => {
        if (!window.confirm(mensaje)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
