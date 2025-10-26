// No need to import React with the new JSX transform
import InvoicesDateRangeFilter from './InvoicesDateRangeFilter.tsx'

export type SortBy = 'date' | 'customer' | 'id'
export type SortDir = 'asc' | 'desc'

export interface InvoicesFiltersProps {
  qInvoiceId: string
  setQInvoiceId: (v: string) => void
  qCustomer: string
  setQCustomer: (v: string) => void
  qFrom: string
  setQFrom: (v: string) => void
  qTo: string
  setQTo: (v: string) => void
  sortBy: SortBy
  setSortBy: (v: SortBy) => void
  sortDir: SortDir
  setSortDir: (v: SortDir) => void
  dateClearedNotice: boolean
  datesDisabled: boolean
  footer?: React.ReactNode
}

export default function InvoicesFilters(props: InvoicesFiltersProps) {
  const {
    qInvoiceId,
    setQInvoiceId,
    qCustomer,
    setQCustomer,
    qFrom,
    setQFrom,
    qTo,
    setQTo,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    dateClearedNotice,
    datesDisabled,
  } = props

  return (
    <section className="flex flex-col gap-6">
      {/* Encabezado movido al contenedor superior en Invoices.tsx para que quede arriba */}
      <article className="gpa-6 flex flex-col justify-evenly md:flex-row">
        <section className="gap-6md:flex-row flex flex-col">
          <div className="p-3">
            <label className="muted mb-1 block" htmlFor="f_id">
              Nº Factura
            </label>
            <input
              id="f_id"
              className="btn w-full"
              placeholder="Ej: 2025-001"
              value={qInvoiceId}
              onChange={(e) => setQInvoiceId(e.target.value)}
            />
          </div>
          <div className="p-3">
            <label className="muted mb-1 block" htmlFor="f_cust">
              Cliente / DNI
            </label>
            <input
              id="f_cust"
              className="btn w-full"
              placeholder="Nombre o DNI"
              value={qCustomer}
              onChange={(e) => setQCustomer(e.target.value)}
            />
          </div>
        </section>
        <section className="flex gap-6">
          {/* Rango de fechas extraído: default en móviles/tablet, compacto en escritorio */}
          <div className="block lg:hidden">
            <h2>Rango de fechas</h2>
            <InvoicesDateRangeFilter
              qFrom={qFrom}
              setQFrom={setQFrom}
              qTo={qTo}
              setQTo={setQTo}
              disabled={datesDisabled}
              disabledTitle={
                datesDisabled ? 'No disponible al ordenar por número de factura' : undefined
              }
              variant="default"
            />
          </div>
          <div className="hidden p-3 lg:block">
            <h2>Rango de fechas</h2>
            <InvoicesDateRangeFilter
              qFrom={qFrom}
              setQFrom={setQFrom}
              qTo={qTo}
              setQTo={setQTo}
              disabled={datesDisabled}
              disabledTitle={
                datesDisabled ? 'No disponible al ordenar por número de factura' : undefined
              }
              variant="compact"
            />
          </div>
        </section>
        <section className="flex gap-6">
          {/* Controles de ordenación */}
          <div className="flex flex-col gap-2">
            <span className="muted text-xs">Ordenar por</span>
            <select
              className="btn w-full px-2 py-1 text-xs sm:w-auto"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              aria-label="Ordenar por"
            >
              <option value="date">Fecha de emisión</option>
              <option value="customer">Nombre de cliente</option>
              <option value="id">Número de factura</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="muted text-xs">Dirección</span>
            <select
              className="btn btn-danger w-full sm:w-auto"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDir)}
              aria-label="Dirección de ordenación"
            >
              <option value="desc">Descendente (Z-A / más reciente)</option>
              <option value="asc">Ascendente (A-Z / más antigua)</option>
            </select>
          </div>

          {dateClearedNotice && sortBy === 'id' && (
            <div className="w-full rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs sm:col-span-2 lg:col-span-4">
              Aviso: al ordenar por número de factura, los filtros de fecha no se aplican y se han
              desactivado.
            </div>
          )}
        </section>
      </article>

      {/* Footer opcional, alineado a la derecha */}
      {props.footer ? (
        <footer className="col-start-1 col-end-9 flex items-center justify-end gap-4">
          {/* Nota informativa */}
          <div className="mt-1 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
            <div className="muted text-xs">Cambiar filtros recarga desde la primera página.</div>
          </div>
          <div className="flex justify-end">{props.footer}</div>
        </footer>
      ) : null}
    </section>
  )
}
