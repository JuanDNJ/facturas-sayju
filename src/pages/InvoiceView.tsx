import { useEffect, useState } from 'react'
import Disclosure from '../components/ui/Disclosure'
import { Link, useParams } from 'react-router-dom'
import type { Invoice } from '../types/invoice.types'
import { useAuth } from '../hooks/useAuth'
import { getInvoice, updateInvoiceStatus } from '../apis/invoices'
import { useToast } from '../hooks/useToast'

function formatCurrency(value: number, locale = 'es-ES', currency = 'EUR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value || 0)
}

function toNumber(n: string | number): number {
  if (typeof n === 'number') return n
  const parsed = parseFloat(n)
  return Number.isFinite(parsed) ? parsed : 0
}

// Maquetación presentacional de factura a partir de los tipos
// Nota: no se muestra ningún campo id opcional
export default function InvoiceView() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { show } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [clienteOpen, setClienteOpen] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('iv_clienteOpen') : null
    return v === null ? true : v === 'true'
  })
  type TotalsAlign = 'left' | 'right' | 'center' | 'full'
  const [totalsAlign, setTotalsAlign] = useState<TotalsAlign>(() => {
    if (typeof window === 'undefined') return 'full'
    const v = localStorage.getItem('iv_totalsAlign') as TotalsAlign | null
    return v ?? 'full'
  })

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!user || !id) return
      setLoading(true)
      setError(null)
      try {
        const data = await getInvoice(user.uid, id)
        if (active) setInvoice(data)
        if (active && !data) setError('Factura no encontrada')
      } catch (e: unknown) {
        const msg =
          typeof e === 'object' && e && 'message' in e
            ? String((e as { message?: unknown }).message)
            : 'No se pudo cargar la factura'
        if (active) setError(msg)
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [user, id])

  // Colapsar "Cliente" por defecto en móvil en primer render
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      if (localStorage.getItem('iv_clienteOpen') === null) setClienteOpen(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('iv_clienteOpen', String(clienteOpen))
  }, [clienteOpen])

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('iv_totalsAlign', totalsAlign)
  }, [totalsAlign])

  const handleMarkAsPaid = () => {
    // Toast informativo sobre la importancia de marcar como cobrada
    show(
      '💡 Al marcar como cobrada: se registra la fecha, no podrás editarla ni eliminarla, y quedará en tu historial para control fiscal.',
      {
        type: 'info',
        durationMs: 6000, // Más tiempo para leer el mensaje importante
      }
    )

    // Pequeña pausa para que el usuario lea el mensaje antes de proceder
    setTimeout(() => {
      handleStatusChange('paid')
    }, 500)
  }

  const handleStatusChange = async (newStatus: Invoice['status']) => {
    if (!user || !id || !invoice) return

    setUpdatingStatus(true)
    try {
      await updateInvoiceStatus(user.uid, id, newStatus)

      // Actualizar localmente
      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              paidDate: newStatus === 'paid' ? new Date() : undefined,
            }
          : prev
      )

      if (newStatus === 'paid') {
        show('✅ Factura cobrada registrada. Ya no podrás editarla ni eliminarla.', {
          type: 'success',
          durationMs: 4000,
        })
      } else {
        show(`Factura marcada como ${newStatus === 'pending' ? 'pendiente' : newStatus}`, {
          type: 'success',
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      show('❌ Error al actualizar el estado de la factura', { type: 'error' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="panel rounded p-6">Cargando factura…</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-4">
        <div className="panel rounded p-6 text-red-600">{error}</div>
      </section>
    )
  }

  if (!invoice) return null

  const {
    stamp,
    invoiceId,
    invoiceDate,
    expirationDate,
    customer,
    items,
    totals,
    status = 'pending',
  } = invoice
  const isPaid = status === 'paid'

  return (
    <section className="space-y-4">
      {/* Estado y Acciones (no imprimir) */}
      <div className="no-print space-y-3">
        {/* Badge de estado */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {isPaid ? '✓ Cobrada' : '⏳ Pendiente'}
          </span>
          {isPaid && invoice.paidDate && (
            <span className="muted text-xs">
              Cobrada el {new Date(invoice.paidDate).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <Link to="/invoices" className="panel w-full rounded px-3 py-2 text-center sm:w-auto">
            Volver
          </Link>

          {!isPaid && (
            <button
              type="button"
              className="btn btn-primary w-full text-center sm:w-auto"
              onClick={handleMarkAsPaid}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'Marcando...' : 'Marcar como Cobrada'}
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary w-full text-center sm:w-auto"
            onClick={() => window.print()}
          >
            Imprimir / Guardar PDF
          </button>

          <div className="flex items-center justify-end gap-2 print:hidden">
            <label htmlFor="totalsAlign" className="muted text-xs">
              Totales
            </label>
            <select
              id="totalsAlign"
              className="panel rounded px-2 py-1 text-xs"
              value={totalsAlign}
              onChange={(e) => setTotalsAlign(e.target.value as TotalsAlign)}
              aria-label="Alineación de totales (pantalla)"
            >
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
              <option value="center">Centrado</option>
              <option value="full">100% ancho</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel rounded p-6">
        {/* Cabecera: Emisor (izquierda) + Fecha (arriba derecha) y segunda fila con Factura (izquierda) y Vencimiento (derecha) */}
        <div className="flex flex-col gap-4">
          {/* Fila superior: Emisor a la izquierda + Fecha arriba a la derecha */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Emisor (alineado a la izquierda) */}
            <div className="flex items-start gap-4 md:text-left">
              {stamp.imgUrl && (
                <img src={stamp.imgUrl} alt="Logo" className="h-16 w-16 object-contain" />
              )}
              <div className="text-sm">
                <div className="text-base font-semibold text-[var(--text)]">
                  {stamp.companyName || stamp.name}
                </div>
                <div className="muted">{stamp.address}</div>
                <div className="muted">{stamp.taxId}</div>
              </div>
            </div>

            {/* Fecha arriba a la derecha */}
            <div className="text-right md:ml-auto md:items-end">
              <div className="muted text-xs">Fecha</div>
              <div className="font-medium">
                {typeof invoiceDate === 'string'
                  ? invoiceDate
                  : new Date(invoiceDate).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>

          {/* Segunda fila: Factura a la izquierda y Vencimiento a la derecha */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="muted text-xs">Factura</div>
              <div className="font-medium">{invoiceId}</div>
            </div>
            <div className="text-right sm:text-right">
              <div className="muted text-xs">Vencimiento</div>
              <div className="font-medium">
                {typeof expirationDate === 'string'
                  ? expirationDate
                  : new Date(expirationDate).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
        </div>

        {/* Nota: Se evita duplicar el identificador de factura aquí; ya aparece en la meta de cabecera */}

        {/* Cliente */}
        <div className="panel mt-6 rounded p-4">
          {/* Título fijo en desktop */}
          <div className="mb-2 hidden font-semibold sm:block">Cliente</div>
          {/* Móvil: Disclosure con botón */}
          <div className="sm:hidden">
            <Disclosure
              open={clienteOpen}
              onOpenChange={setClienteOpen}
              buttonClassName="btn btn-secondary px-2 py-1 text-xs"
              panelClassName="text-sm space-y-1"
              header={
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-semibold">Cliente</div>
                  <span>{clienteOpen ? 'Ocultar' : 'Mostrar'}</span>
                </div>
              }
            >
              <div className="space-y-1">
                <div>
                  <span className="muted">Nombre / Razón social: </span>
                  <span>{customer.name}</span>
                </div>
                <div>
                  <span className="muted">Dirección: </span>
                  <span>{customer.address}</span>
                </div>
                <div>
                  <span className="muted">DNI: </span>
                  <span>{customer.taxId}</span>
                </div>
              </div>
            </Disclosure>
          </div>
          {/* Desktop: contenido siempre visible sin botón */}
          <div className="hidden space-y-1 text-sm sm:block">
            <div>
              <span className="muted">Nombre / Razón social: </span>
              <span>{customer.name}</span>
            </div>
            <div>
              <span className="muted">Dirección: </span>
              <span>{customer.address}</span>
            </div>
            <div>
              <span className="muted">DNI: </span>
              <span>{customer.taxId}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="print-items mt-6">
          {/* Vista móvil: tarjetas */}
          <div className="print-items-cards space-y-3 md:hidden">
            {items.map((it, idx) => {
              const price = toNumber(it.price)
              const amount = it.quantity * price
              return (
                <div
                  key={idx}
                  className="print-item-card rounded border border-[var(--panel-border)] p-3 text-sm"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="print-item-prop">
                      <div className="muted mb-1 text-xs">Código</div>
                      <div className="font-medium break-words">{it.code || '—'}</div>
                    </div>
                    <div className="print-item-prop">
                      <div className="muted mb-1 text-xs">Cantidad</div>
                      <div className="text-right sm:text-left">{it.quantity}</div>
                    </div>
                    <div className="print-item-prop sm:col-span-2">
                      <div className="muted mb-1 text-xs">Descripción</div>
                      <div className="break-words">{it.description}</div>
                    </div>
                    <div className="print-item-prop">
                      <div className="muted mb-1 text-xs">Precio</div>
                      <div className="text-right sm:text-left">{formatCurrency(price)}</div>
                    </div>
                    <div className="print-item-prop flex items-end justify-between sm:block">
                      <div className="muted mb-1 text-xs">Importe</div>
                      <div className="font-medium">{formatCurrency(amount)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vista tabla en md+ */}
          <div className="print-items-table hidden overflow-x-auto rounded border border-[var(--panel-border)] md:block">
            <table className="print-items-table-el w-full text-sm">
              <thead className="bg-[var(--panel)]">
                <tr className="text-left">
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const price = toNumber(it.price)
                  const amount = it.quantity * price
                  return (
                    <tr key={idx} className="print-item-row border-t border-[var(--panel-border)]">
                      <td className="px-3 py-2 align-top">{it.code}</td>
                      <td className="px-3 py-2 align-top">{it.description}</td>
                      <td className="px-3 py-2 text-right align-top">{it.quantity}</td>
                      <td className="px-3 py-2 text-right align-top">{formatCurrency(price)}</td>
                      <td className="px-3 py-2 text-right align-top">{formatCurrency(amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}

        <div
          className={
            `print-totals mt-6 flex flex-col` +
            (totalsAlign === 'left'
              ? 'items-start'
              : totalsAlign === 'center'
                ? 'items-center'
                : totalsAlign === 'full'
                  ? 'items-stretch'
                  : 'items-end')
          }
        >
          <div
            className={
              `panel print-totals-box rounded p-4 text-sm ` +
              (totalsAlign === 'full' ? 'w-full sm:w-full' : 'w-full sm:w-[50vw]')
            }
          >
            <div className="flex justify-between py-1">
              <span className="muted">Base imponible</span>
              <span>{formatCurrency(totals.taxableBase)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="muted">IVA ({totals.vatPercentage}%)</span>
              <span>{formatCurrency(totals.vatAmount)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="muted">Base + IVA</span>
              <span>{formatCurrency(totals.taxableBasePlusVat)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="muted">IRPF ({totals.irpfPercentage}%)</span>
              <span>-{formatCurrency(totals.irpfAmount)}</span>
            </div>
            <div className="my-2 border-t border-[var(--panel-border)]" />
            <div className="flex justify-between py-1 text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
