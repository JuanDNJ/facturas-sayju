import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { deleteInvoice } from '../apis/invoices'
import { useToast } from '../hooks/useToast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Icon from '../components/atomic/atoms/Icon'
import ViewEyeIcon from '../components/icons/ViewEyeIcon'
import EditIcon from '../components/icons/EditIcon'
import TrashIcon from '../components/icons/TrashIcon'
import AddInvoiceIcon from '../components/icons/AddInvoiceIcon'
import { useInvoicesPagination } from '../hooks/useInvoicesPagination'

export default function Invoices() {
  const { user } = useAuth()
  const { show } = useToast()
  const [filtersOpen, setFiltersOpen] = useState(false)

  // filtros de búsqueda local (cliente / nº factura)
  const [qInvoiceId, setQInvoiceId] = useState('')
  const [qCustomer, setQCustomer] = useState('')
  const [qFrom, setQFrom] = useState<string>('') // YYYY-MM-DD
  const [qTo, setQTo] = useState<string>('')

  // ordenación (por defecto: fecha desc => más recientes primero)
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'id'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [dateClearedNotice, setDateClearedNotice] = useState(false)

  // confirmación de borrado
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const serverOrderByField: 'invoiceDate' | 'invoiceId' =
    sortBy === 'id' ? 'invoiceId' : 'invoiceDate'
  const serverOrderDirection: 'asc' | 'desc' | undefined =
    sortBy === 'customer' ? undefined : sortDir

  const {
    items: invoices,
    loading,
    error,
    currentPage,
    hasNext,
    pageSize,
    setPageSize,
    nextPage,
    prevPage,
    reloadFirstPage,
  } = useInvoicesPagination({
    uid: user?.uid,
    pageSize: 10,
    fromDate: qFrom || undefined,
    toDate: qTo || undefined,
    orderDirection: serverOrderDirection,
    orderByField: serverOrderByField,
  })

  // Filtrado y orden local para 'customer'
  const rows = useMemo(() => {
    const text = (s: unknown) => (typeof s === 'string' ? s : '')
    const qId = qInvoiceId.trim().toLowerCase()
    const qCust = qCustomer.trim().toLowerCase()
    let filtered = invoices.filter((inv) => {
      const idOk = !qId || text(inv.invoiceId).toLowerCase().includes(qId)
      const customerName = text(inv.customer?.name)
      const customerDni = text(inv.customer?.taxId)
      const custOk =
        !qCust ||
        customerName.toLowerCase().includes(qCust) ||
        customerDni.toLowerCase().includes(qCust)
      return idOk && custOk
    })
    if (sortBy === 'customer') {
      filtered = filtered.slice().sort((a, b) => {
        const an = text(a.customer?.name).toLowerCase()
        const bn = text(b.customer?.name).toLowerCase()
        if (an === bn) return 0
        const cmp = an < bn ? -1 : 1
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return filtered.map((inv) => ({
      id: inv.id || inv.invoiceId,
      invoiceId: inv.invoiceId,
      customer: inv.customer?.name || '—',
      date:
        inv.invoiceDate instanceof Date
          ? Intl.DateTimeFormat('es-ES').format(inv.invoiceDate)
          : (inv.invoiceDate as unknown as string),
      total:
        typeof inv.totals?.totalAmount === 'number'
          ? new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'EUR',
            }).format(inv.totals.totalAmount)
          : '—',
      status: inv.status || 'pending',
      isPaid: (inv.status || 'pending') === 'paid',
    }))
  }, [invoices, qInvoiceId, qCustomer, sortBy, sortDir])

  async function performDelete(id: string) {
    if (!user) return
    try {
      await deleteInvoice(user.uid, id)
      show('Factura eliminada', { type: 'success' })
      await reloadFirstPage()
    } catch (e) {
      console.error(e)
      show('No se pudo eliminar', { type: 'error' })
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Facturas</h1>
        <aside>
          <Link
            to="/invoices/new"
            className="flex w-full items-center justify-center gap-2 text-center md:w-auto"
          >
            <Icon className="w-8 text-blue-400">
              <AddInvoiceIcon />
            </Icon>
            <strong>Nueva factura</strong>
          </Link>
        </aside>
      </div>

      {/* Filtros */}
      <div className="sm:hidden">
        <button
          className="btn btn-secondary flex w-full items-center justify-center gap-2"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <span>{filtersOpen ? '🔼' : '🔽'}</span>
          <span>{filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
        </button>
      </div>
      <div
        className={`${filtersOpen ? 'grid' : 'hidden'} panel grid-cols-1 gap-3 rounded p-3 text-sm sm:grid sm:grid-cols-2 lg:grid-cols-4`}
      >
        <div>
          <label className="muted mb-1 block" htmlFor="f_id">
            Nº Factura
          </label>
          <input
            id="f_id"
            className="btn btn-primary w-full sm:w-auto"
            placeholder="Ej: 2025-001"
            value={qInvoiceId}
            onChange={(e) => setQInvoiceId(e.target.value)}
          />
        </div>
        <div>
          <label className="muted mb-1 block" htmlFor="f_cust">
            Cliente / DNI
          </label>
          <input
            id="f_cust"
            className="btn btn-secondary w-full sm:w-auto"
            placeholder="Nombre o DNI"
            value={qCustomer}
            onChange={(e) => setQCustomer(e.target.value)}
          />
        </div>
        <div>
          <label className="muted mb-1 block" htmlFor="f_from">
            Desde
          </label>
          <input
            id="f_from"
            type="date"
            className={`panel w-full rounded px-2 py-1 sm:px-3 sm:py-2 ${sortBy === 'id' ? 'cursor-not-allowed opacity-50' : ''}`}
            value={qFrom}
            onChange={(e) => setQFrom(e.target.value)}
            disabled={sortBy === 'id'}
            title={sortBy === 'id' ? 'No disponible al ordenar por número de factura' : undefined}
          />
        </div>
        <div>
          <label className="muted mb-1 block" htmlFor="f_to">
            Hasta
          </label>
          <input
            id="f_to"
            type="date"
            className={`panel w-full rounded px-2 py-1 sm:px-3 sm:py-2 ${sortBy === 'id' ? 'cursor-not-allowed opacity-50' : ''}`}
            value={qTo}
            onChange={(e) => setQTo(e.target.value)}
            disabled={sortBy === 'id'}
            title={sortBy === 'id' ? 'No disponible al ordenar por número de factura' : undefined}
          />
        </div>
        <div className="mt-1 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
          <div className="muted text-xs">Cambiar filtros recarga desde la primera página.</div>
          <div className="flex w-full items-center justify-end gap-2 self-end sm:w-auto sm:self-auto">
            <span className="muted text-xs">Tamaño</span>
            <select
              className="btn btn-ghost w-full px-2 py-1 text-xs sm:w-auto"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Tamaño de página"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="mt-1 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="muted text-xs">Ordenar por</span>
            <select
              className="btn btn-secondary w-full px-2 py-1 text-xs sm:w-auto"
              value={sortBy}
              onChange={(e) => {
                const next = e.target.value as 'date' | 'customer' | 'id'
                if (next === 'id' && (qFrom || qTo)) {
                  setQFrom('')
                  setQTo('')
                  setDateClearedNotice(true)
                  window.setTimeout(() => setDateClearedNotice(false), 3500)
                }
                setSortBy(next)
              }}
              aria-label="Ordenar por"
            >
              <option value="date">Fecha de emisión</option>
              <option value="customer">Nombre de cliente</option>
              <option value="id">Número de factura</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="muted text-xs">Dirección</span>
            <select
              className="btn btn-danger w-full px-2 py-1 text-xs sm:w-auto"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              aria-label="Dirección de ordenación"
            >
              <option value="asc">Ascendente (A-Z / más antigua)</option>
              <option value="desc">Descendente (Z-A / más reciente)</option>
            </select>
          </div>
        </div>
        {sortBy === 'id' && dateClearedNotice && (
          <div className="rounded border border-[var(--panel-border)] bg-[var(--panel)] px-2 py-1 text-xs sm:col-span-2 lg:col-span-4">
            Aviso: al ordenar por número de factura, los filtros de fecha no se aplican y se han desactivado.
          </div>
        )}
      </div>

      <div className="panel overflow-x-auto rounded">
        {loading && <div className="p-4 text-sm">Cargando facturas…</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="p-4 text-sm">No hay facturas todavía.</div>
        )}
        {/* Tabla solo en >= md */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">Factura</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--panel-border)]">
                  <td className="px-3 py-2">{row.invoiceId}</td>
                  <td className="px-3 py-2">{row.customer}</td>
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2 text-right">{row.total}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${row.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {row.isPaid ? '✓ Cobrada' : '⏳ Pendiente'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/invoices/${row.id}`}
                        className="flex h-8 items-center gap-1 px-3 text-green-400"
                      >
                        <Icon className="w-10">
                          <ViewEyeIcon />
                        </Icon>
                      </Link>
                      {!row.isPaid && (
                        <Link
                          to={`/invoices/${row.id}/edit`}
                          className="btn btn-outline-edit flex h-8 items-center gap-1 px-3 text-blue-400"
                        >
                          <Icon className="w-10">
                            <EditIcon />
                          </Icon>
                        </Link>
                      )}
                      {!row.isPaid && (
                        <button
                          onClick={() => setConfirmId(row.id)}
                          className="btn btn-outline-delete flex h-8 items-center gap-1 px-3 text-red-400"
                        >
                          <Icon className="w-10">
                            <TrashIcon />
                          </Icon>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Lista tipo tarjeta en móvil (< md) */}
        <div className="divide-y border-t border-[var(--panel-border)] md:hidden">
          {rows.map((row) => (
            <div key={row.id} className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{row.invoiceId}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${row.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {row.isPaid ? '✓' : '⏳'}
                    </span>
                  </div>
                  <div className="muted max-w-[70vw] truncate text-xs">{row.customer}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{row.date}</div>
                  <div className="font-semibold">{row.total}</div>
                </div>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Link
                  to={`/invoices/${row.id}`}
                  className="flex h-8 items-center gap-1 px-3 text-green-400"
                >
                  <Icon className="w-8 sm:w-10">
                    <ViewEyeIcon />
                  </Icon>
                </Link>
                {!row.isPaid && (
                  <Link
                    to={`/invoices/${row.id}/edit`}
                    className="flex h-8 items-center gap-1 px-3 text-blue-400"
                  >
                    <Icon className="w-8 sm:w-10">
                      <EditIcon />
                    </Icon>
                  </Link>
                )}
                {!row.isPaid && (
                  <button
                    onClick={() => setConfirmId(row.id)}
                    className="flex h-8 items-center gap-1 px-3 text-red-400"
                  >
                    <Icon className="w-8 sm:w-10">
                      <TrashIcon />
                    </Icon>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Controles de paginación */}
        <div className="flex flex-col gap-2 border-t border-[var(--panel-border)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="muted text-xs">Página {currentPage}</div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              className="btn btn-secondary h-9 w-full sm:w-auto"
              onClick={prevPage}
              disabled={currentPage <= 1 || loading}
            >
              Anterior
            </button>
            <button
              className="btn btn-secondary h-9 w-full sm:w-auto"
              onClick={nextPage}
              disabled={!hasNext || loading}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title="Eliminar factura"
        description="Esta acción no se puede deshacer. ¿Seguro que quieres eliminar la factura?"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) performDelete(confirmId)
          setConfirmId(null)
        }}
      />
    </section>
  )
}
