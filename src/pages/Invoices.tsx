import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { deleteInvoice } from '../apis/invoices'
import { useToast } from '../hooks/useToast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Icon from '../components/atomic/atoms/Icon'
import { AddInvoiceIcon } from '../components/icons/AddInvoiceIcon'
import { useInvoicesPagination } from '../hooks/useInvoicesPagination'
import { useInvoicesFilters } from '../hooks/useInvoicesFilters'
import InvoicesResults from '../components/invoices/InvoicesResults'
import InvoicesFilters from '../components/invoices/InvoicesFilters'
import { PAGE_SIZE_OPTIONS } from '../components/invoices/constants'
import { SettingsIcon } from '../components/icons/SettingsIcon'
import { LockOpenIcon } from '../components/icons/LockOpenIcon'
import { LockClosedIcon } from '../components/icons/LockClosedIcon'

export default function Invoices() {
  const { user } = useAuth()
  const { show } = useToast()
  // Abierto por defecto en escritorio (>= sm), cerrado en móvil.
  // Si hay preferencia guardada en localStorage, se respeta.
  const [filtersOpen, setFiltersOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('invoices.filtersOpen')
        if (saved === '1' || saved === '0') {
          return saved === '1'
        }
        if (typeof window.matchMedia === 'function') {
          // Tailwind 'sm' => min-width: 640px
          return window.matchMedia('(min-width: 640px)').matches
        }
      }
    } catch {
      // noop
    }
    return false
  })

  // Persistencia de visibilidad de filtros
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('invoices.filtersOpen', filtersOpen ? '1' : '0')
      }
    } catch {
      // noop
    }
  }, [filtersOpen])

  // Estado y lógica de filtros encapsulados en el hook
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
    serverOrderByField,
    serverOrderDirection,
    datesDisabled,
  } = useInvoicesFilters()

  // confirmación de borrado
  const [confirmId, setConfirmId] = useState<string | null>(null)

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

  // Persistencia de tamaño de página en localStorage
  useEffect(() => {
    try {
      const key = 'invoices.pageSize'
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      if (saved) {
        const num = Number(saved)
        const allowed = [3, 5, 10, 20, 50]
        if (Number.isFinite(num) && allowed.includes(num) && num !== pageSize) {
          setPageSize(num)
        }
      }
    } catch {
      // noop
    }
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('invoices.pageSize', String(pageSize))
      }
    } catch {
      // noop
    }
  }, [pageSize])

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
        <aside className="flex items-center gap-6">
          {/* Toggle filtros en escritorio (>= sm) */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-6 ${filtersOpen ? '' : 'text-red-300'} `}>
                {filtersOpen ? <LockOpenIcon /> : <LockClosedIcon />}
              </Icon>
              <strong className="text-sm">Filtros</strong>
            </div>
          </button>
          <Link to="/invoices/new" className="flex w-full items-center gap-2 text-center md:w-auto">
            <Icon className="w-6 text-cyan-300">
              <AddInvoiceIcon />
            </Icon>
            <strong className="text-sm">Nueva factura</strong>
          </Link>
        </aside>
      </div>

      <div
        id="filters-panel"
        className={`${filtersOpen ? '' : 'hidden'} panel rounded-md p-3 text-sm sm:p-4 lg:p-5`}
        aria-labelledby="filters-title"
      >
        {/* Encabezado siempre arriba */}
        <div className="mb-2 flex items-center gap-2 border-b border-[var(--panel-border)] pb-2">
          <Icon className="w-5 text-blue-400">
            <SettingsIcon />
          </Icon>
          <h2 id="filters-title" className="text-sm font-medium">
            Filtros
          </h2>
        </div>

        {/* Contenido de filtros en grid/flex */}
        <div className="">
          {(() => {
            const hasFilters =
              qInvoiceId.trim() !== '' ||
              qCustomer.trim() !== '' ||
              qFrom.trim() !== '' ||
              qTo.trim() !== ''

            return (
              <InvoicesFilters
                qInvoiceId={qInvoiceId}
                setQInvoiceId={setQInvoiceId}
                qCustomer={qCustomer}
                setQCustomer={setQCustomer}
                qFrom={qFrom}
                setQFrom={setQFrom}
                qTo={qTo}
                setQTo={setQTo}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortDir={sortDir}
                setSortDir={setSortDir}
                dateClearedNotice={dateClearedNotice}
                datesDisabled={datesDisabled}
                footer={
                  <div className="mt-1 flex items-center justify-end">
                    <button
                      className={`btn btn-secondary ${!hasFilters ? 'cursor-not-allowed opacity-50' : ''}`}
                      onClick={() => {
                        setQInvoiceId('')
                        setQCustomer('')
                        setQFrom('')
                        setQTo('')
                        reloadFirstPage()
                      }}
                      disabled={!hasFilters}
                      aria-disabled={!hasFilters}
                      aria-label="Limpiar filtros"
                      title={!hasFilters ? 'No hay filtros para limpiar' : 'Limpiar filtros'}
                    >
                      Limpiar filtros
                    </button>
                  </div>
                }
              />
            )
          })()}
        </div>
      </div>
      {/* Lista de facturas */}
      <div className="panel overflow-x-auto rounded">
        {loading && <div className="p-4 text-sm">Cargando facturas…</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="p-4 text-sm">No hay facturas todavía.</div>
        )}

        {/* Resultados y controles */}
        <InvoicesResults
          rows={rows}
          onDeleteRequest={(id) => setConfirmId(id)}
          currentPage={currentPage}
          hasNext={hasNext}
          loading={loading}
          onPrev={prevPage}
          onNext={nextPage}
          pageSize={pageSize}
          onPageSizeChange={(n) => {
            setPageSize(n)
            reloadFirstPage()
          }}
          pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        />
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
