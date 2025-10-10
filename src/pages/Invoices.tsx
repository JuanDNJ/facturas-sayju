import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getInvoices, deleteInvoice } from '../apis/invoices'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import type { Invoice } from '../types/invoice.types'
import { useToast } from '../hooks/useToast'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function Invoices() {
  const { user } = useAuth()
  const { show } = useToast()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [cursorStack, setCursorStack] = useState<QueryDocumentSnapshot<DocumentData>[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // filtros
  const [qInvoiceId, setQInvoiceId] = useState('')
  const [qCustomer, setQCustomer] = useState('')
  const [qFrom, setQFrom] = useState<string>('') // YYYY-MM-DD
  const [qTo, setQTo] = useState<string>('')

  // ordenación
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'id'>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [dateClearedNotice, setDateClearedNotice] = useState(false)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const page = await getInvoices(user.uid, {
          pageSize,
          fromDate: qFrom || undefined,
          toDate: qTo || undefined,
          orderDirection: sortBy === 'date' || sortBy === 'id' ? sortDir : undefined,
          orderByField: sortBy === 'id' ? 'invoiceId' : 'invoiceDate',
        })
        if (active) {
          setInvoices(page.items)
          setHasNext(Boolean(page.nextCursor))
          setCursorStack(page.nextCursor ? [page.nextCursor] : [])
          setCurrentPage(1)
        }
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e && 'message' in e
            ? String((e as { message?: unknown }).message)
            : 'No se pudieron cargar las facturas'
        if (active) setError(msg)
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [user, pageSize, qFrom, qTo, sortBy, sortDir])

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
        typeof inv.invoiceDate === 'string'
          ? inv.invoiceDate
          : inv.invoiceDate.toLocaleDateString('es-ES'),
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
    setLoading(true)
    setError(null)
    try {
      await deleteInvoice(user.uid, id)
      show('Factura eliminada', { type: 'success' })
      // recargar primera página con filtros vigentes
      const page = await getInvoices(user.uid, {
        pageSize,
        fromDate: qFrom || undefined,
        toDate: qTo || undefined,
        orderDirection: sortBy === 'date' || sortBy === 'id' ? sortDir : undefined,
        orderByField: sortBy === 'id' ? 'invoiceId' : 'invoiceDate',
      })
      setInvoices(page.items)
      setHasNext(Boolean(page.nextCursor))
      setCursorStack(page.nextCursor ? [page.nextCursor] : [])
      setCurrentPage(1)
    } catch (e) {
      console.error(e)
      show('No se pudo eliminar', { type: 'error' })
      setError('No se pudo eliminar la factura')
    } finally {
      setLoading(false)
    }
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Facturas</h1>
        <Link
          to="/invoices/new"
          className="btn btn-primary flex w-full items-center justify-center gap-2 text-center sm:w-auto"
        >
          <span>➕</span>
          <span>Nueva factura</span>
        </Link>
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
        className={`${
          filtersOpen ? 'grid' : 'hidden'
        } panel grid-cols-1 gap-3 rounded p-3 text-sm sm:grid sm:grid-cols-2 lg:grid-cols-4`}
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
            className={`panel w-full rounded px-2 py-1 sm:px-3 sm:py-2 ${
              sortBy === 'id' ? 'cursor-not-allowed opacity-50' : ''
            }`}
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
            className={`panel w-full rounded px-2 py-1 sm:px-3 sm:py-2 ${
              sortBy === 'id' ? 'cursor-not-allowed opacity-50' : ''
            }`}
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
                // Si el usuario selecciona orden por número, limpiamos fechas para permitir ordenación por invoiceId en servidor
                if (next === 'id' && (qFrom || qTo)) {
                  setQFrom('')
                  setQTo('')
                  setDateClearedNotice(true)
                  // ocultar aviso después de unos segundos
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
            Aviso: al ordenar por número de factura, los filtros de fecha no se aplican y se han
            desactivado.
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
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        row.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {row.isPaid ? '✓ Cobrada' : '⏳ Pendiente'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/invoices/${row.id}`}
                        className="btn btn-ghost flex h-8 items-center gap-1 px-3"
                      >
                        <span>👁️</span>
                        <span>Ver</span>
                      </Link>
                      {!row.isPaid && (
                        <Link
                          to={`/invoices/${row.id}/edit`}
                          className="btn btn-secondary flex h-8 items-center gap-1 px-3"
                        >
                          <span>✏️</span>
                          <span>Editar</span>
                        </Link>
                      )}
                      {!row.isPaid && (
                        <button
                          onClick={() => setConfirmId(row.id)}
                          className="btn btn-danger flex h-8 items-center gap-1 px-3"
                        >
                          <span>🗑️</span>
                          <span>Eliminar</span>
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
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
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
                  className="btn btn-ghost flex h-8 items-center gap-1 px-3"
                >
                  <span>👁️</span>
                  <span>Ver</span>
                </Link>
                {!row.isPaid && (
                  <Link
                    to={`/invoices/${row.id}/edit`}
                    className="btn btn-secondary flex h-8 items-center gap-1 px-3"
                  >
                    <span>✏️</span>
                    <span>Editar</span>
                  </Link>
                )}
                {!row.isPaid && (
                  <button
                    onClick={() => setConfirmId(row.id)}
                    className="btn btn-danger flex h-8 items-center gap-1 px-3"
                  >
                    <span>🗑️</span>
                    <span>Eliminar</span>
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
              onClick={async () => {
                if (!user) return
                if (currentPage <= 1) return
                setLoading(true)
                setError(null)
                try {
                  const prevCursorIdx = currentPage - 3 // -1 para ir a la primera
                  const prevCursor = prevCursorIdx >= 0 ? cursorStack[prevCursorIdx] : undefined
                  const page = await getInvoices(user.uid, {
                    pageSize,
                    cursor: prevCursor ?? undefined,
                    fromDate: qFrom || undefined,
                    toDate: qTo || undefined,
                    orderDirection: sortBy === 'date' || sortBy === 'id' ? sortDir : undefined,
                    orderByField: sortBy === 'id' ? 'invoiceId' : 'invoiceDate',
                  })
                  setInvoices(page.items)
                  setHasNext(Boolean(page.nextCursor))
                  setCursorStack((s) => {
                    const nextLen = Math.max(0, currentPage - 1)
                    const trimmed = s.slice(0, nextLen - 1)
                    return page.nextCursor ? [...trimmed, page.nextCursor] : trimmed
                  })
                  setCurrentPage((p) => Math.max(1, p - 1))
                } catch {
                  setError('No se pudo cargar la página anterior')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={currentPage <= 1 || loading}
            >
              Anterior
            </button>
            <button
              className="btn btn-secondary h-9 w-full sm:w-auto"
              onClick={async () => {
                if (!user) return
                const lastCursor = cursorStack[cursorStack.length - 1]
                if (!lastCursor) return
                setLoading(true)
                setError(null)
                try {
                  const page = await getInvoices(user.uid, {
                    pageSize,
                    cursor: lastCursor,
                    fromDate: qFrom || undefined,
                    toDate: qTo || undefined,
                    orderDirection: sortBy === 'date' || sortBy === 'id' ? sortDir : undefined,
                    orderByField: sortBy === 'id' ? 'invoiceId' : 'invoiceDate',
                  })
                  setInvoices(page.items)
                  setHasNext(Boolean(page.nextCursor))
                  setCursorStack((s) => (page.nextCursor ? [...s, page.nextCursor] : [...s]))
                  setCurrentPage((p) => p + 1)
                } catch {
                  setError('No se pudo cargar la siguiente página')
                } finally {
                  setLoading(false)
                }
              }}
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
        description="¿Eliminar esta factura? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        loading={loading}
        onCancel={() => setConfirmId(null)}
        onConfirm={async () => {
          if (!confirmId) return
          const id = confirmId
          setConfirmId(null)
          await performDelete(id)
        }}
      />
    </section>
  )
}
