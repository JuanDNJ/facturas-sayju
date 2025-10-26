// Componente de rango de fechas para filtros de facturas

export interface InvoicesDateRangeFilterProps {
  qFrom: string
  setQFrom: (v: string) => void
  qTo: string
  setQTo: (v: string) => void
  disabled?: boolean
  disabledTitle?: string
  variant?: 'default' | 'compact'
}

export default function InvoicesDateRangeFilter({
  qFrom,
  setQFrom,
  qTo,
  setQTo,
  disabled = false,
  disabledTitle,
  variant = 'default',
}: InvoicesDateRangeFilterProps) {
  const disabledClasses = disabled ? 'cursor-not-allowed opacity-50' : ''
  const invalidRange = !disabled && !!qFrom && !!qTo && qFrom > qTo

  if (variant === 'compact') {
    return (
      <section className="flex flex-col gap-6 py-1">
        <div
          className={`panel flex items-center gap-2 rounded p-3 py-1.5 ${disabledClasses} ${invalidRange ? 'ring-1 ring-red-500' : ''}`}
        >
          <span className="text-xs opacity-70" aria-hidden>
            📅
          </span>
          <label htmlFor="f_from">Desde</label>
          <input
            id="f_from"
            type="date"
            className="min-w-[8.5rem] bg-transparent px-2 py-1 outline-none sm:min-w-[9.5rem]"
            value={qFrom}
            onChange={(e) => setQFrom(e.target.value)}
            disabled={disabled}
            title={disabled ? disabledTitle : undefined}
            max={qTo || undefined}
            aria-label="Fecha desde"
            aria-disabled={disabled}
            aria-invalid={invalidRange}
          />
        </div>
        <div
          className={`panel flex items-center gap-2 px-2 py-1 ${disabledClasses} ${invalidRange ? 'ring-1 ring-red-500' : ''}`}
        >
          <span className="opacity-50" aria-hidden>
            –
          </span>
          <label htmlFor="f_to">Hasta</label>
          <input
            id="f_to"
            type="date"
            className="min-w-[8.5rem] bg-transparent outline-none sm:min-w-[9.5rem]"
            value={qTo}
            onChange={(e) => setQTo(e.target.value)}
            disabled={disabled}
            title={disabled ? disabledTitle : undefined}
            min={qFrom || undefined}
            aria-label="Fecha hasta"
            aria-disabled={disabled}
            aria-invalid={invalidRange}
          />
        </div>
        {invalidRange && (
          <div className="mt-1 text-xs text-red-600 sm:col-span-2 lg:col-span-4" role="alert">
            Rango de fechas inválido: "Desde" no puede ser posterior a "Hasta".
          </div>
        )}
      </section>
    )
  }

  return (
    <>
      <div>
        <label className="muted mb-1 block" htmlFor="f_from">
          Desde
        </label>
        <input
          id="f_from"
          type="date"
          className={`panel w-full rounded px-2 py-1 sm:w-auto sm:px-3 sm:py-2 ${disabledClasses} ${invalidRange ? 'border border-red-500' : ''}`}
          value={qFrom}
          onChange={(e) => setQFrom(e.target.value)}
          disabled={disabled}
          title={disabled ? disabledTitle : undefined}
          max={qTo || undefined}
          aria-label="Fecha desde"
          aria-disabled={disabled}
          aria-invalid={invalidRange}
        />
      </div>
      <div>
        <label className="muted mb-1 block" htmlFor="f_to">
          Hasta
        </label>
        <input
          id="f_to"
          type="date"
          className={`panel w-full rounded px-2 py-1 sm:w-auto sm:px-3 sm:py-2 ${disabledClasses} ${invalidRange ? 'border border-red-500' : ''}`}
          value={qTo}
          onChange={(e) => setQTo(e.target.value)}
          disabled={disabled}
          title={disabled ? disabledTitle : undefined}
          min={qFrom || undefined}
          aria-label="Fecha hasta"
          aria-disabled={disabled}
          aria-invalid={invalidRange}
        />
      </div>
      {invalidRange && (
        <div className="mt-1 text-xs text-red-600 sm:col-span-2 lg:col-span-4" role="alert">
          Rango de fechas inválido: "Desde" no puede ser posterior a "Hasta".
        </div>
      )}
    </>
  )
}
