import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-card border border-border-soft bg-surface p-5.5 shadow-[0_1px_2px_rgba(24,27,31,.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  accent = "var(--color-blue)",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-kpi border border-border-soft bg-surface p-5 shadow-[0_1px_2px_rgba(24,27,31,.05)]">
      <span
        className="absolute bottom-4.5 left-0 top-4.5 w-0.75 rounded-r-[3px]"
        style={{ background: accent }}
      />
      <div className="text-[11px] uppercase tracking-[.7px] text-ink-5">{label}</div>
      <div className="mt-2 font-display text-[34px] font-medium leading-none tracking-[-1.3px]">{value}</div>
      {hint && <div className="mt-1.75 text-[12px] text-ink-6">{hint}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "success" | "warn" | "danger" | "neutral";
}) {
  const styles: Record<string, string> = {
    info: "bg-info-bg text-blue-text border-info-border",
    success: "bg-success-bg text-success-text border-success-border",
    warn: "bg-warn-bg text-warn-text border-warn-border",
    danger: "bg-warn-bg text-[#A83A1F] border-warn-border",
    neutral: "bg-surface-2 text-ink-4 border-border-soft",
  };
  return (
    <span className={`inline-flex items-center rounded-chip border px-1.75 py-0.5 text-[11px] font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong bg-surface-2 p-10 text-center text-[13px] text-ink-5">
      {children}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border-soft bg-surface">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`border-b border-border-soft bg-surface-2 px-4 py-2.75 text-left text-[11px] uppercase tracking-[.5px] text-ink-5 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-[#F0EEE9] px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center gap-2 rounded-control px-4 py-2.5 text-[12.5px] font-semibold transition-opacity disabled:opacity-50";
  const styles: Record<string, string> = {
    primary: "bg-gradient-to-b from-blue-hover to-blue text-white",
    secondary: "border border-border-strong bg-surface text-ink-2 hover:bg-app-bg",
    danger: "bg-gradient-to-b from-[#C85A3F] to-[#A8432F] text-white",
    ghost: "text-ink-4 hover:bg-app-bg",
  };
  return (
    <button type={type} className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-control border border-border-strong bg-white px-3.5 py-2.5 text-[13.5px] text-ink-1 outline-none focus:border-blue ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-control border border-border-strong bg-white px-3.5 py-2.5 text-[13.5px] text-ink-1 outline-none focus:border-blue ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-control border border-border-strong bg-white px-3.5 py-2.5 text-[13.5px] text-ink-1 outline-none focus:border-blue ${props.className ?? ""}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] text-ink-5">
      {label}
      {children}
    </label>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="flex gap-2.5 rounded-control border border-warn-border bg-warn-bg px-3.5 py-3 text-[12.5px] text-warn-text">
      {children}
    </div>
  );
}
