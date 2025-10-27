import { useEffect, useMemo, useState, Suspense, lazy } from 'react'
import Spinner from '../components/ui/Spinner'
import { Link, useNavigate } from 'react-router-dom'
import type { Customer, Invoice, Item, Totals, Stamp } from '../types/invoice.types'
import { useAuth } from '../hooks/useAuth'
import { addInvoice } from '../apis/invoices'
import { getStamps as getStampsFs } from '../apis/stamps'
import { getCustomers as getCustomersFs, addCustomer, updateCustomer } from '../apis/customers'
import DniHelp from '../components/DniHelp'
import Modal from '../components/ui/Modal'
import Disclosure from '../components/ui/Disclosure'
import CustomSelect from '../components/ui/CustomSelect'
import { isValidDNI, isValidEmail } from '../utils/validators'
import BackwardIcon from '../components/icons/BackwardIcon'
import Icon from '../components/atomic/atoms/Icon'
// Carga diferida del formulario de factura
const InvoiceForm = lazy(() =>
  import('../components/invoices/InvoiceForm').then((m) => ({ default: m.InvoiceForm }))
)

function toNumber(n: string | number): number {
  if (typeof n === 'number') return n
  const parsed = parseFloat(n)
  return Number.isFinite(parsed) ? parsed : 0
}

// El formato de moneda lo gestiona el InvoiceForm

export default function NewInvoice() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Identificación
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const defaultDate = `${yyyy}-${mm}-${dd}`

  const [invoiceId, setInvoiceId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(defaultDate)
  const [expirationDate, setExpirationDate] = useState(defaultDate)
  // Tipo de factura
  const [invoiceKind, setInvoiceKind] = useState<'normal' | 'rectificativa'>('normal')
  const [rectifiedRef, setRectifiedRef] = useState('')
  const [rectifiedDate, setRectifiedDate] = useState(defaultDate)
  const [rectificationReason, setRectificationReason] = useState('')

  // Emisor
  const [issuerMode, setIssuerMode] = useState<'stamp' | 'manual'>('stamp')
  const [issuerName, setIssuerName] = useState('Sayju')
  const [issuerCompany, setIssuerCompany] = useState('Sayju S.A.')
  const [issuerAddress, setIssuerAddress] = useState('C/ Ejemplo 123, Madrid')
  const [issuerTaxId, setIssuerTaxId] = useState('B-12345678')
  const [issuerImgUrl, setIssuerImgUrl] = useState<string>('')

  const [stampsList, setStampsList] = useState<Stamp[]>([])
  const [selectedStampId, setSelectedStampId] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      if (!user?.uid) return
      try {
        const page = await getStampsFs(user.uid, {
          pageSize: 50,
          orderByField: 'name',
          direction: 'asc',
        })
        setStampsList(page.items)
        setSelectedStampId((prev) => prev || page.items[0]?.id || '')
      } catch {
        // Si falla la carga, dejamos la lista vacía
      }
    })()
  }, [user?.uid])

  // Clientes (Firestore)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState<string>('')
  const [customerQuery, setCustomerQuery] = useState<string>('')
  const customer = useMemo(
    () => customers.find((c) => c.id === customerId) || null,
    [customers, customerId]
  )

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) => (c.name || '').toLowerCase().includes(q) || (c.taxId || '').toLowerCase().includes(q)
    )
  }, [customers, customerQuery])

  // Mantener selección coherente con el filtro
  useEffect(() => {
    if (!customerId) {
      if (filteredCustomers.length > 0) setCustomerId(filteredCustomers[0].id || '')
      return
    }
    const stillVisible = filteredCustomers.some((c) => c.id === customerId)
    if (!stillVisible) {
      setCustomerId(filteredCustomers[0]?.id || '')
    }
  }, [customerQuery, filteredCustomers, customerId])

  useEffect(() => {
    ;(async () => {
      if (!user?.uid) return
      try {
        const page = await getCustomersFs(user.uid, {
          pageSize: 100,
          orderByField: 'name',
          direction: 'asc',
        })
        setCustomers(page.items)
        setCustomerId((prev) => prev || page.items[0]?.id || '')
      } catch {
        // si falla, mantenemos lista vacía
      }
    })()
  }, [user?.uid])

  // Modal crear/editar cliente
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [customerDraft, setCustomerDraft] = useState<Customer>({
    name: '',
    address: '',
    taxId: '',
    email: '',
    phone: '',
  })
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({})

  // Items
  const [items, setItems] = useState<Item[]>([
    { code: '', description: '', quantity: 1, price: '0' },
  ])

  // Impuestos
  const [vatPercentage, setVatPercentage] = useState<number>(21)
  const [irpfPercentage, setIrpfPercentage] = useState<number>(0)

  // Totales (calculados también en InvoiceForm para mostrar)
  const totals: Totals = useMemo(() => {
    const taxableBase = items.reduce((sum, it) => sum + toNumber(it.price) * (it.quantity || 0), 0)
    const vatAmount = taxableBase * (vatPercentage / 100)
    const taxableBasePlusVat = taxableBase + vatAmount
    const irpfAmount = taxableBase * (irpfPercentage / 100)
    const totalAmount = taxableBasePlusVat - irpfAmount
    return {
      taxableBase,
      vatPercentage,
      vatAmount,
      taxableBasePlusVat,
      irpfPercentage,
      irpfAmount,
      totalAmount,
    }
  }, [items, vatPercentage, irpfPercentage])

  // Validación
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Expand/Collapse (móvil): Emisor, Cliente, Impuestos
  const [emisorOpen, setEmisorOpen] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('nv_emisorOpen') : null
    return v === null ? true : v === 'true'
  })
  const [clienteOpen, setClienteOpen] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('nv_clienteOpen') : null
    return v === null ? true : v === 'true'
  })
  const [impuestosOpen, setImpuestosOpen] = useState(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('nv_impuestosOpen') : null
    return v === null ? true : v === 'true'
  })

  // Al cargar, si la pantalla es pequeña, colapsar por defecto
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      // Solo forzar colapso si no hay preferencia almacenada
      if (localStorage.getItem('nv_emisorOpen') === null) setEmisorOpen(false)
      if (localStorage.getItem('nv_clienteOpen') === null) setClienteOpen(false)
      if (localStorage.getItem('nv_impuestosOpen') === null) setImpuestosOpen(false)
    }
  }, [])

  // Persistir cambios
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('nv_emisorOpen', String(emisorOpen))
  }, [emisorOpen])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('nv_clienteOpen', String(clienteOpen))
  }, [clienteOpen])
  useEffect(() => {
    if (typeof window !== 'undefined')
      localStorage.setItem('nv_impuestosOpen', String(impuestosOpen))
  }, [impuestosOpen])
  function validate() {
    const e: Record<string, string> = {}
    if (!invoiceId.trim()) e.invoiceId = 'Requerido'
    if (!customerId) e.customerId = 'Selecciona un cliente'

    if (issuerMode === 'stamp') {
      if (!selectedStampId) e.selectedStampId = 'Selecciona un sello'
    } else {
      if (!issuerName.trim()) e.issuerName = 'Requerido'
      if (!issuerAddress.trim()) e.issuerAddress = 'Requerido'
      if (!issuerTaxId.trim()) e.issuerTaxId = 'Requerido'
    }

    if (items.length === 0) e.items = 'Añade al menos una línea'
    items.forEach((it, idx) => {
      if (!it.description || !it.description.trim())
        e[`item_${idx}_description`] = 'Descripción requerida'
      if (!it.quantity || it.quantity <= 0) e[`item_${idx}_quantity`] = 'Cantidad > 0'
      // En rectificativas se permiten precios negativos
      if (invoiceKind !== 'rectificativa' && toNumber(it.price) < 0)
        e[`item_${idx}_price`] = 'Precio >= 0'
    })

    if (invoiceKind === 'rectificativa') {
      if (!rectifiedRef.trim()) e.rectifiedRef = 'Referencia de factura requerida'
      if (!rectificationReason.trim()) e.rectificationReason = 'Motivo requerido'
    }

    return e
  }

  async function handleSubmit() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length === 0) {
      if (!user) {
        alert('Debes iniciar sesión para guardar la factura')
        return
      }
      const stamp: Stamp =
        issuerMode === 'stamp'
          ? (stampsList.find((s: Stamp) => s.id === selectedStampId) as Stamp)
          : {
              name: issuerName,
              companyName: issuerCompany,
              address: issuerAddress,
              taxId: issuerTaxId,
              imgUrl: issuerImgUrl || undefined,
            }
      const invoice: Invoice = {
        invoiceId,
        stamp,
        invoiceDate,
        expirationDate,
        customer: customer || { name: '', address: '', taxId: '' },
        items,
        totals,
        invoiceKind,
        rectifiedRef: invoiceKind === 'rectificativa' ? rectifiedRef : undefined,
        rectifiedDate: invoiceKind === 'rectificativa' ? rectifiedDate : undefined,
        rectificationReason: invoiceKind === 'rectificativa' ? rectificationReason : undefined,
      }
      try {
        await addInvoice(user.uid, invoice)
        navigate('/invoices')
      } catch (err) {
        console.error(err)
        alert('No se pudo guardar la factura')
      }
    }
  }

  return (
    <section className="space-y-4">
      {/* Modal Cliente */}
      <Modal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title={editingCustomerId ? 'Editar cliente' : 'Nuevo cliente'}
        size="md"
      >
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div>
            <label className="muted mb-1 block" htmlFor="c_name">
              Nombre
            </label>
            <input
              id="c_name"
              className="panel w-full rounded px-3 py-2"
              value={customerDraft.name}
              onChange={(e) => setCustomerDraft((d) => ({ ...d, name: e.target.value }))}
            />
            {customerErrors.name && (
              <div className="mt-1 text-xs text-red-600">{customerErrors.name}</div>
            )}
          </div>
          <div>
            <label className="muted mb-1 block" htmlFor="c_tax">
              DNI
            </label>
            <input
              id="c_tax"
              className="panel w-full rounded px-3 py-2"
              placeholder="77777777A o X1234567L"
              aria-describedby="modal-dni-help"
              value={customerDraft.taxId}
              onChange={(e) => setCustomerDraft((d) => ({ ...d, taxId: e.target.value }))}
            />
            <DniHelp id="modal-dni-help" />
            {customerErrors.taxId && (
              <div className="mt-1 text-xs text-red-600">{customerErrors.taxId}</div>
            )}
          </div>
          <div>
            <label className="muted mb-1 block" htmlFor="c_address">
              Dirección
            </label>
            <textarea
              id="c_address"
              rows={2}
              className="panel w-full rounded px-3 py-2"
              value={customerDraft.address}
              onChange={(e) => setCustomerDraft((d) => ({ ...d, address: e.target.value }))}
            />
            {customerErrors.address && (
              <div className="mt-1 text-xs text-red-600">{customerErrors.address}</div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="muted mb-1 block" htmlFor="c_email">
                Email (opcional)
              </label>
              <input
                id="c_email"
                type="email"
                className="panel w-full rounded px-3 py-2"
                value={customerDraft.email || ''}
                onChange={(e) => setCustomerDraft((d) => ({ ...d, email: e.target.value }))}
              />
              {customerErrors.email && (
                <div className="mt-1 text-xs text-red-600">{customerErrors.email}</div>
              )}
            </div>
            <div>
              <label className="muted mb-1 block" htmlFor="c_phone">
                Teléfono (opcional)
              </label>
              <input
                id="c_phone"
                className="panel w-full rounded px-3 py-2"
                value={customerDraft.phone || ''}
                onChange={(e) => setCustomerDraft((d) => ({ ...d, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (!user?.uid) return
                const e: Record<string, string> = {}
                if (!customerDraft.name?.trim()) e.name = 'Nombre requerido'
                if (!customerDraft.taxId?.trim()) e.taxId = 'DNI requerido'
                else if (!isValidDNI(customerDraft.taxId)) {
                  e.taxId = 'DNI no válido'
                }
                if (!customerDraft.address?.trim()) e.address = 'Dirección requerida'
                if (customerDraft.email && !isValidEmail(customerDraft.email))
                  e.email = 'Email no válido'
                setCustomerErrors(e)
                if (Object.keys(e).length > 0) return

                try {
                  if (editingCustomerId) {
                    await updateCustomer(user.uid, editingCustomerId, {
                      name: customerDraft.name,
                      address: customerDraft.address,
                      taxId: customerDraft.taxId,
                      email: customerDraft.email,
                      phone: customerDraft.phone,
                    })
                    const page = await getCustomersFs(user.uid, {
                      pageSize: 100,
                      orderByField: 'name',
                      direction: 'asc',
                    })
                    setCustomers(page.items)
                    setCustomerId(editingCustomerId)
                  } else {
                    const newId = await addCustomer(user.uid, {
                      name: customerDraft.name,
                      address: customerDraft.address,
                      taxId: customerDraft.taxId,
                      email: customerDraft.email,
                      phone: customerDraft.phone,
                    } as Customer)
                    const page = await getCustomersFs(user.uid, {
                      pageSize: 100,
                      orderByField: 'name',
                      direction: 'asc',
                    })
                    setCustomers(page.items)
                    setCustomerId(newId)
                  }
                  setCustomerModalOpen(false)
                } catch (err) {
                  console.error(err)
                  alert('No se pudo guardar el cliente')
                }
              }}
            >
              Guardar
            </button>
            <button className="btn btn-ghost" onClick={() => setCustomerModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Nueva factura</h1>
        <Icon className="w-6 sm:w-8">
          <Link to="/invoices">
            <BackwardIcon />
          </Link>
        </Icon>
      </div>

      <Suspense
        fallback={
          <div className="panel rounded p-6">
            <Spinner label="Cargando formulario…" />
          </div>
        }
      >
        <InvoiceForm
          values={{
            invoiceId,
            invoiceDate,
            expirationDate,
            invoiceKind,
            rectifiedRef,
            rectifiedDate,
            rectificationReason,
            issuerMode,
            issuer: {
              name: issuerName,
              companyName: issuerCompany,
              address: issuerAddress,
              taxId: issuerTaxId,
              imgUrl: issuerImgUrl,
            },
            selectedStampId,
            items,
            vatPercentage,
            irpfPercentage,
          }}
          errors={errors}
          stampsList={stampsList}
          onValuesChange={(patch) => {
            if (patch.invoiceId !== undefined) setInvoiceId(patch.invoiceId)
            if (patch.invoiceDate !== undefined) setInvoiceDate(patch.invoiceDate)
            if (patch.expirationDate !== undefined) setExpirationDate(patch.expirationDate)
            if (patch.invoiceKind !== undefined) setInvoiceKind(patch.invoiceKind)
            if (patch.rectifiedRef !== undefined) setRectifiedRef(patch.rectifiedRef)
            if (patch.rectifiedDate !== undefined) setRectifiedDate(patch.rectifiedDate)
            if (patch.rectificationReason !== undefined)
              setRectificationReason(patch.rectificationReason)
            if (patch.issuerMode !== undefined) setIssuerMode(patch.issuerMode)
            if (patch.issuer !== undefined) {
              setIssuerName(patch.issuer.name)
              setIssuerCompany(patch.issuer.companyName || '')
              setIssuerAddress(patch.issuer.address)
              setIssuerTaxId(patch.issuer.taxId)
              setIssuerImgUrl(patch.issuer.imgUrl || '')
            }
            if (patch.selectedStampId !== undefined) setSelectedStampId(patch.selectedStampId)
            if (patch.vatPercentage !== undefined) setVatPercentage(patch.vatPercentage)
            if (patch.irpfPercentage !== undefined) setIrpfPercentage(patch.irpfPercentage)
          }}
          onItemChange={(index, itemPatch) =>
            setItems((arr) => arr.map((it, i) => (i === index ? { ...it, ...itemPatch } : it)))
          }
          onAddItem={() =>
            setItems((arr) => [...arr, { code: '', description: '', quantity: 1, price: '0' }])
          }
          onRemoveItem={(index) => setItems((arr) => arr.filter((_, i) => i !== index))}
          customerSection={
            <div className="panel rounded p-4 text-sm">
              <Disclosure
                open={clienteOpen}
                onOpenChange={(v) => setClienteOpen(v)}
                className="space-y-2"
                buttonClassName="text-xs sm:hidden"
                panelClassName="space-y-2 sm:block"
                header={
                  <div className="flex w-full items-center justify-between">
                    <div className="font-semibold">
                      <span className="sm:hidden">{clienteOpen ? 'Ocultar' : 'Mostrar'}</span>{' '}
                      Cliente
                    </div>
                  </div>
                }
              >
                <div className="space-y-6">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-6">
                      <button
                        className="btn btn-primary px-2 py-1 text-xs"
                        onClick={() => {
                          setEditingCustomerId(null)
                          setCustomerDraft({
                            name: '',
                            address: '',
                            taxId: '',
                            email: '',
                            phone: '',
                          })
                          setCustomerErrors({})
                          setCustomerModalOpen(true)
                        }}
                      >
                        Nuevo
                      </button>
                      <button
                        className="btn btn-secondary px-2 py-1 text-xs"
                        onClick={() => {
                          const c = customers.find((x) => x.id === customerId)
                          if (!c) return
                          setEditingCustomerId(c.id || null)
                          setCustomerDraft({
                            name: c.name,
                            address: c.address,
                            taxId: c.taxId,
                            email: c.email,
                            phone: c.phone,
                          })
                          setCustomerErrors({})
                          setCustomerModalOpen(true)
                        }}
                        disabled={!customerId}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                  <label className="muted mb-1 block" htmlFor="searchCustomer">
                    Buscar y seleccionar cliente
                  </label>
                  <input
                    id="searchCustomer"
                    className="panel mb-2 w-full rounded px-3 py-2"
                    placeholder="Buscar por nombre o DNI..."
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    aria-label="Buscar cliente por nombre o DNI"
                  />
                  <label className="muted mb-1 block" htmlFor="customerId">
                    Seleccionar cliente
                  </label>
                  <CustomSelect
                    id="customerId"
                    value={customerId}
                    onChange={setCustomerId}
                    placeholder="Seleccionar cliente..."
                    options={filteredCustomers.map((c) => ({
                      value: c.id || '',
                      label: c.name,
                    }))}
                  />
                  {filteredCustomers.length === 0 && (
                    <div className="muted mt-1 text-xs">No hay resultados para el filtro.</div>
                  )}
                  {errors.customerId && (
                    <div className="mt-1 text-xs text-red-600">{errors.customerId}</div>
                  )}
                </div>
                {customer && (
                  <div className="muted text-xs">
                    <div>{customer.address}</div>
                    <div>{customer.taxId}</div>
                  </div>
                )}
              </Disclosure>
            </div>
          }
          rightAside={
            <div className="panel w-full rounded p-4 text-sm lg:w-[420px]">
              <div className="mb-2 font-semibold">Impuestos</div>
              {/* Móvil: contenido colapsable */}
              <div className="sm:hidden">
                <Disclosure
                  open={impuestosOpen}
                  onOpenChange={setImpuestosOpen}
                  buttonClassName="btn btn-secondary px-2 py-1 text-xs"
                  panelClassName="mt-2"
                  header={<span>{impuestosOpen ? 'Ocultar' : 'Mostrar'}</span>}
                >
                  <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="muted mb-1 block" htmlFor="vat">
                        IVA (%)
                      </label>
                      <input
                        id="vat"
                        type="number"
                        step={0.1}
                        className="panel w-full rounded px-3 py-2"
                        value={vatPercentage}
                        onChange={(e) => setVatPercentage(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="muted mb-1 block" htmlFor="irpf">
                        IRPF (%)
                      </label>
                      <input
                        id="irpf"
                        type="number"
                        step={0.1}
                        className="panel w-full rounded px-3 py-2"
                        value={irpfPercentage}
                        onChange={(e) => setIrpfPercentage(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="mb-2 font-semibold">Totales</div>
                  <div className="flex justify-between py-1">
                    <span className="muted">Base imponible</span>
                    <span>
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(totals.taxableBase || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="muted">IVA ({totals.vatPercentage}%)</span>
                    <span>
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(totals.vatAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="muted">Base + IVA</span>
                    <span>
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(totals.taxableBasePlusVat || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="muted">IRPF ({totals.irpfPercentage}%)</span>
                    <span>
                      -
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(totals.irpfAmount || 0)}
                    </span>
                  </div>
                  <div className="my-2 border-t border-[var(--panel-border)]" />
                  <div className="flex justify-between py-1 text-base font-semibold">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(totals.totalAmount || 0)}
                    </span>
                  </div>
                </Disclosure>
              </div>

              {/* Desktop: contenido siempre visible */}
              <div className="hidden sm:block">
                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="muted mb-1 block" htmlFor="vat-sm">
                      IVA (%)
                    </label>
                    <input
                      id="vat-sm"
                      type="number"
                      step={0.1}
                      className="panel w-full rounded px-3 py-2"
                      value={vatPercentage}
                      onChange={(e) => setVatPercentage(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="muted mb-1 block" htmlFor="irpf-sm">
                      IRPF (%)
                    </label>
                    <input
                      id="irpf-sm"
                      type="number"
                      step={0.1}
                      className="panel w-full rounded px-3 py-2"
                      value={irpfPercentage}
                      onChange={(e) => setIrpfPercentage(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="mb-2 font-semibold">Totales</div>
                <div className="flex justify-between py-1">
                  <span className="muted">Base imponible</span>
                  <span>
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                      totals.taxableBase || 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="muted">IVA ({totals.vatPercentage}%)</span>
                  <span>
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                      totals.vatAmount || 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="muted">Base + IVA</span>
                  <span>
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                      totals.taxableBasePlusVat || 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="muted">IRPF ({totals.irpfPercentage}%)</span>
                  <span>
                    -
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                      totals.irpfAmount || 0
                    )}
                  </span>
                </div>
                <div className="my-2 border-t border-[var(--panel-border)]" />
                <div className="flex justify-between py-1 text-base font-semibold">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                      totals.totalAmount || 0
                    )}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button className="btn btn-primary" onClick={handleSubmit}>
                  Guardar
                </button>
              </div>
            </div>
          }
          issuerSectionOpen={emisorOpen}
          onIssuerSectionOpenChange={setEmisorOpen}
          onSubmit={handleSubmit}
        />
      </Suspense>
    </section>
  )
}
