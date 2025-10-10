import { useState } from 'react'
import { addSuggestion } from '../apis/suggestions'
import { useAuth } from '../hooks/useAuth'
import CustomSelect from '../components/ui/CustomSelect'

export default function Suggestions() {
  const { user } = useAuth()
  const [category, setCategory] = useState<'mejora' | 'error' | 'necesidad' | 'otro'>('mejora')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOk(null)
    setErr(null)
    if (!user) {
      setErr('Debes iniciar sesión para enviar sugerencias.')
      return
    }
    if (!message.trim()) {
      setErr('El mensaje es obligatorio.')
      return
    }
    setSending(true)
    try {
      await addSuggestion({
        category,
        title: title.trim() || undefined,
        message: message.trim(),
        userId: user.uid,
        userDisplay: user.displayName || undefined,
        userEmail: user.email || undefined,
      })
      setOk('¡Gracias! Hemos registrado tu sugerencia.')
      setTitle('')
      setMessage('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo enviar la sugerencia.'
      setErr(msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold">Sugerencias</h1>
      <form className="max-w-xl space-y-3" onSubmit={onSubmit}>
        {ok && <div className="text-sm text-green-600">{ok}</div>}
        {err && <div className="text-danger text-sm">{err}</div>}
        <div>
          <label className="muted mb-1 block" htmlFor="category">
            Categoría
          </label>
          <CustomSelect
            id="category"
            value={category}
            onChange={(value) => setCategory(value as typeof category)}
            options={[
              { value: 'mejora', label: 'Mejora' },
              { value: 'necesidad', label: 'Necesidad' },
              { value: 'error', label: 'Error' },
              { value: 'otro', label: 'Otra' },
            ]}
          />
        </div>
        <div>
          <label className="muted mb-1 block" htmlFor="title">
            Título (opcional)
          </label>
          <input
            id="title"
            className="panel w-full rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="muted mb-1 block" htmlFor="message">
            Mensaje
          </label>
          <textarea
            id="message"
            rows={5}
            className="panel w-full rounded px-3 py-2"
            placeholder="Describe tu sugerencia o necesidad..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
          <button
            type="reset"
            className="btn btn-ghost"
            onClick={() => {
              setTitle('')
              setMessage('')
              setErr(null)
              setOk(null)
            }}
          >
            Limpiar
          </button>
        </div>
      </form>
    </section>
  )
}
