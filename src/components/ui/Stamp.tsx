type StampVariant =
  | "pagado"
  | "anulado"
  | "vencido"
  | "borrador"
  | "personalizado";

export default function Stamp({
  text,
  variant = "personalizado",
  angled = true,
  size = "md",
  className = "",
  fontPx,
}: {
  text: string;
  variant?: StampVariant;
  angled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  fontPx?: number;
}) {
  // Dimensiones fijas por tamaño (ancho x alto) y escala de fuente
  const dimensionClasses =
    size === "sm"
      ? "w-24 h-10 text-[10px]"
      : size === "lg"
      ? "w-40 h-16 text-sm"
      : "w-32 h-12 text-xs"; // md por defecto
  const colorByVariant: Record<StampVariant, string> = {
    pagado: "text-green-600 border-green-600",
    anulado: "text-red-600 border-red-600",
    vencido: "text-amber-700 border-amber-700",
    borrador: "text-slate-600 border-slate-600",
    personalizado: "text-[var(--text)] border-[var(--muted)]",
  };
  const rotate = angled ? "-rotate-6" : "";
  return (
    <span
      className={`inline-flex items-center justify-center align-middle leading-none select-none uppercase tracking-widest rounded border-2 ${dimensionClasses} ${colorByVariant[variant]} opacity-90/100 ${rotate} px-3 whitespace-nowrap overflow-hidden text-ellipsis text-center ${className}`}
      style={{
        boxShadow: "0 0 0 2px currentColor inset, 0 2px 0 rgba(0,0,0,0.12)",
        letterSpacing: "0.12em",
        fontSize: fontPx ? `${fontPx}px` : undefined,
      }}
      aria-label={`Sello: ${text}`}
    >
      {text}
    </span>
  );
}
