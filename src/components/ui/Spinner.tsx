export default function Spinner({
  label = 'Cargando…',
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-3 ${className}`}>
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--panel-border)] border-t-[var(--text)]"
        aria-hidden
      />
      <span className="muted text-sm">{label}</span>
    </div>
  )
}
