interface PaginationControlsProps {
  currentPage: number
  hasNext: boolean
  loading?: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
  prevLabel?: string
  nextLabel?: string
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  sizeLabel?: string
}

export default function PaginationControls({
  currentPage,
  hasNext,
  loading = false,
  onPrev,
  onNext,
  className,
  prevLabel = 'Anterior',
  nextLabel = 'Siguiente',
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [3, 5, 10, 20, 50],
  sizeLabel = 'Tamaño',
}: PaginationControlsProps) {
  return (
    <div
      className={`flex flex-col gap-2 border-t border-[var(--panel-border)] p-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
      role="navigation"
      aria-label="Paginación"
    >
      <div className="muted text-xs">Página {currentPage}</div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {typeof pageSize === 'number' && onPageSizeChange && (
          <div className="flex items-center justify-end gap-2 sm:justify-start">
            <span className="muted text-xs">{sizeLabel}</span>
            <select
              className="btn btn-ghost w-full px-2 py-1 text-xs sm:w-auto"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label={`${sizeLabel} de página`}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          className="btn btn-secondary h-9 w-full sm:w-auto"
          onClick={onPrev}
          disabled={currentPage <= 1 || loading}
          aria-label={prevLabel}
        >
          {prevLabel}
        </button>
        <button
          className="btn btn-secondary h-9 w-full sm:w-auto"
          onClick={onNext}
          disabled={!hasNext || loading}
          aria-label={nextLabel}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
