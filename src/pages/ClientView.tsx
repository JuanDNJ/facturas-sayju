import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import type { Customer } from '../types/invoice.types'
import { useAuth } from '../hooks/useAuth'
import { getCustomer, updateCustomer, removeCustomer } from '../apis/customers'
import { isValidDNI, isValidEmail } from '../utils/validators'
import DniHelp from '../components/DniHelp'
import { useToast } from '../hooks/useToast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Icon from '../components/atomic/atoms/Icon'
import EditIcon from '../components/icons/EditIcon'
import TrashIcon from '../components/icons/TrashIcon'
import BackwardIcon from '../components/icons/BackwardIcon'

export default function ClientView() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shouldEdit = searchParams.get('edit') === '1'

  const [current, setCurrent] = useState<Customer | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Customer | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { show } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!user || !id) return
      setLoading(true)
      try {
        const c = await getCustomer(user.uid, id)
        if (!active) return
        if (c) {
          setCurrent(c)
          setDraft(c)
          setEditing(shouldEdit)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [user, id, shouldEdit])

  const validate = (d: Customer) => {
    const e: Record<string, string> = {}
    if (!d.name?.trim()) e.name = 'Requerido'
    if (!d.address?.trim()) e.address = 'Requerido'
    if (!d.taxId?.trim()) e.taxId = 'Requerido'
    else if (!isValidDNI(d.taxId)) e.taxId = 'DNI no válido'
    if (d.email && !isValidEmail(d.email)) e.email = 'Email no válido'
    return e
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="panel rounded p-4">Cargando cliente…</div>
      </section>
    )
  }

  if (!current) {
    return (
      <section className="space-y-4">
        <div className="panel rounded p-4">
          <div className="mb-2 font-semibold">Cliente no encontrado</div>
          <Link className="underline" to="/clientes">
            Volver a clientes
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cliente</h1>
        <div className="flex items-center gap-6">
          <Link className="flex items-center gap-2" to="/clientes">
            <Icon className="w-6">
              <BackwardIcon />
            </Icon>
          </Link>
          {!editing && (
            <button
              type="button"
              className="flex items-center gap-2 text-green-400"
              onClick={() => setEditing(true)}
            >
              <Icon className="w-6">
                <EditIcon />
              </Icon>
            </button>
          )}
          {!editing && current?.id && (
            <button
              type="button"
              className="flex items-center gap-2 text-red-400"
              onClick={() => setConfirmOpen(true)}
            >
              <Icon className="w-6">
                <TrashIcon />
              </Icon>
            </button>
          )}
        </div>
      </div>

      <div className="panel rounded p-4">
        <div className="space-y-2 text-sm">
          <div>
            <span className="muted">Nombre / Razón social: </span>
            <span className="font-medium text-[var(--text)]">{current?.name}</span>
          </div>
          <div>
            <span className="muted">Dirección: </span>
            <span>{current?.address}</span>
          </div>
          <div>
            <span className="muted">DNI: </span>
            <span>{current?.taxId}</span>
          </div>
          {(current?.email || current?.phone) && (
            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
              {current?.email && (
                <div>
                  <span className="muted">Email: </span>
                  <span>{current.email}</span>
                </div>
              )}
              {current?.phone && (
                <div>
                  <span className="muted">Teléfono: </span>
                  <span>{current.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && draft && (
        <div className="panel rounded p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Editar cliente</div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-ghost flex items-center gap-2"
                onClick={() => {
                  setDraft(current!)
                  setErrors({})
                  setEditing(false)
                }}
              >
                <span>❌</span>
                <span>Cancelar</span>
              </button>
              <button
                type="button"
                className="btn btn-primary flex items-center gap-2"
                disabled={saving}
                onClick={async () => {
                  if (!user || !current?.id) return
                  const d = { ...draft, id: current?.id } as Customer
                  const e = validate(d)
                  setErrors(e)
                  if (Object.keys(e).length === 0) {
                    try {
                      setSaving(true)
                      await updateCustomer(user.uid, current.id!, d)
                      setCurrent(d)
                      setEditing(false)
                      show('Cliente guardado', { type: 'success' })
                    } catch (err) {
                      console.error(err)
                      show('Error al guardar', { type: 'error' })
                    } finally {
                      setSaving(false)
                    }
                  }
                }}
              >
                <span>💾</span>
                <span>Guardar</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <label className="muted mb-1 block" htmlFor="name">
                Nombre / Razón social
              </label>
              <input
                id="name"
                className="panel w-full rounded px-3 py-2"
                value={draft.name}
                onChange={(e) => setDraft({ ...(draft as Customer), name: e.target.value })}
              />
              {errors.name && <div className="mt-1 text-xs text-red-600">{errors.name}</div>}
            </div>
            <div>
              <label className="muted mb-1 block" htmlFor="address">
                Dirección
              </label>
              <textarea
                id="address"
                rows={2}
                className="panel w-full rounded px-3 py-2"
                value={draft.address}
                onChange={(e) => setDraft({ ...(draft as Customer), address: e.target.value })}
              />
              {errors.address && <div className="mt-1 text-xs text-red-600">{errors.address}</div>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="muted mb-1 block" htmlFor="taxId">
                  DNI
                </label>
                <input
                  id="taxId"
                  className="panel w-full rounded px-3 py-2"
                  value={draft.taxId}
                  onChange={(e) => setDraft({ ...(draft as Customer), taxId: e.target.value })}
                  placeholder="77777777A o X1234567L"
                  aria-describedby="cv-dni-help"
                />
                <DniHelp id="cv-dni-help" />
                {errors.taxId && <div className="mt-1 text-xs text-red-600">{errors.taxId}</div>}
              </div>
              <div>
                <label className="muted mb-1 block" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="panel w-full rounded px-3 py-2"
                  value={draft.email ?? ''}
                  onChange={(e) => setDraft({ ...(draft as Customer), email: e.target.value })}
                />
                {errors.email && <div className="mt-1 text-xs text-red-600">{errors.email}</div>}
              </div>
              <div>
                <label className="muted mb-1 block" htmlFor="phone">
                  Teléfono
                </label>
                <input
                  id="phone"
                  className="panel w-full rounded px-3 py-2"
                  value={draft.phone ?? ''}
                  onChange={(e) => setDraft({ ...(draft as Customer), phone: e.target.value })}
                />
              </div>
            </div>

            {saving && <p className="muted pt-1 text-xs">Guardando…</p>}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar cliente"
        description={`¿Eliminar cliente "${current?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!user || !current?.id) return
          try {
            setDeleting(true)
            await removeCustomer(user.uid, current.id)
            navigate('/clientes', { replace: true, state: { toast: 'Cliente eliminado' } })
          } catch (err) {
            console.error(err)
          } finally {
            setDeleting(false)
            setConfirmOpen(false)
          }
        }}
      />

      {/* Toasts globales renderizados por ToastProvider */}
    </section>
  )
}
