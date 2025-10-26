import InvoicesTable from './InvoicesTable'
import InvoicesListMobile from './InvoicesListMobile'
import PaginationControls from '../ui/PaginationControls'
import type { InvoiceRow } from './types'
import { PAGE_SIZE_OPTIONS } from './constants'

interface InvoicesResultsProps {
  rows: InvoiceRow[]
  onDeleteRequest?: (id: string) => void
  currentPage: number
  hasNext: boolean
  loading?: boolean
  onPrev: () => void
  onNext: () => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  sizeLabel?: string
}

export default function InvoicesResults({
  rows,
  onDeleteRequest,
  currentPage,
  hasNext,
  loading = false,
  onPrev,
  onNext,
  pageSize,
  onPageSizeChange,
  pageSizeOptions,
  sizeLabel = 'Tamaño',
}: InvoicesResultsProps) {
  return (
    <>
      {/* Cabecera con selector de tamaño (arriba derecha) */}
      <div className="flex items-center justify-end border-b border-[var(--panel-border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="muted text-xs">{sizeLabel}</span>
          <div className="group relative">
            <button
              type="button"
              className="muted inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--panel-border)] text-xs"
              aria-label="Información sobre el tamaño de página"
              tabIndex={0}
            >
              i
            </button>
            <div className="pointer-events-none absolute right-0 z-10 mt-1 hidden w-56 rounded border border-[var(--panel-border)] bg-[var(--panel)] p-2 text-xs shadow-md group-focus-within:block group-hover:block">
              Cambiar tamaño recarga desde la primera página
            </div>
          </div>
          <select
            className={`btn btn-ghost w-auto px-2 py-1 text-xs ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label={`${sizeLabel} de página`}
            disabled={loading}
            aria-disabled={loading}
          >
            {(pageSizeOptions ?? [...PAGE_SIZE_OPTIONS]).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Resultados */}
      <InvoicesTable rows={rows} onDeleteRequest={onDeleteRequest} />
      <InvoicesListMobile rows={rows} onDeleteRequest={onDeleteRequest} />

      {/* Controles */}
      <PaginationControls
        currentPage={currentPage}
        hasNext={hasNext}
        loading={loading}
        onPrev={onPrev}
        onNext={onNext}
      />
    </>
  )
}
