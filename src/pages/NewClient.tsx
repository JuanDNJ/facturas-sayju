import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Customer } from '../types/invoice.types'
import { useAuth } from '../hooks/useAuth'
import { addCustomer } from '../apis/customers'
import { isValidDNI, isValidEmail } from '../utils/validators'
import DniHelp from '../components/DniHelp'
import FormField from '../components/ui/FormField'

const empty: Customer = {
  name: '',
  address: '',
  taxId: '',
  email: '',
  phone: '',
}

export default function NewClient() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [draft, setDraft] = useState<Customer>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const validate = (d: Customer) => {
    const e: Record<string, string> = {}
    if (!d.name?.trim()) e.name = 'Requerido'
    if (!d.address?.trim()) e.address = 'Requerido'
    if (!d.taxId?.trim()) e.taxId = 'Requerido'
    else if (!isValidDNI(d.taxId)) e.taxId = 'DNI no válido'
    if (d.email && !isValidEmail(d.email)) e.email = 'Email no válido'
    return e
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
        <Link to="/clientes" className="btn btn-ghost">
          Volver
        </Link>
      </div>

      <div className="panel space-y-3 rounded p-4 text-sm">
        <FormField label="Nombre / Razón social" required error={errors.name}>
          {(props) => (
            <input
              {...props}
              className="panel w-full rounded px-3 py-2"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          )}
        </FormField>
        <FormField label="Dirección" required error={errors.address}>
          {(props) => (
            <textarea
              {...props}
              rows={2}
              className="panel w-full rounded px-3 py-2"
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          )}
        </FormField>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            label="DNI"
            required
            help={({ id }) => <DniHelp id={id} />}
            error={errors.taxId}
          >
            {(props) => (
              <input
                {...props}
                className="panel w-full rounded px-3 py-2"
                placeholder="77777777A o X1234567L"
                value={draft.taxId}
                onChange={(e) => setDraft({ ...draft, taxId: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Email (opcional)" error={errors.email}>
            {(props) => (
              <input
                {...props}
                type="email"
                className="panel w-full rounded px-3 py-2"
                value={draft.email ?? ''}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Teléfono (opcional)">
            {(props) => (
              <input
                {...props}
                className="panel w-full rounded px-3 py-2"
                value={draft.phone ?? ''}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            )}
          </FormField>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={async () => {
              const e = validate(draft)
              setErrors(e)
              if (Object.keys(e).length === 0 && user) {
                try {
                  setSaving(true)
                  await addCustomer(user.uid, draft)
                  navigate('/clientes', {
                    replace: true,
                    state: { toast: 'Cliente creado' },
                  })
                } catch (err) {
                  // opcionalmente mostrar toast
                  console.error(err)
                } finally {
                  setSaving(false)
                }
              }
            }}
          >
            Guardar
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/clientes')}>
            Cancelar
          </button>
        </div>

        {saving && <p className="muted text-xs">Guardando…</p>}
      </div>
    </section>
  )
}
