import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { loginUser, requestPasswordReset } from '../apis/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState<number>(0)

  const state = (location.state || {}) as { from?: string }
  const redirectTo = state.from || '/'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!email.trim() || password.length < 1) {
      setError('Email y contraseña son requeridos')
      return
    }
    setLoading(true)
    try {
      await loginUser(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: unknown }).message || 'Error al iniciar sesión')
          : 'Error al iniciar sesión'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <section className="panel w-full max-w-md rounded p-4">
        <h1 className="mb-3 text-center text-xl font-semibold">Iniciar sesión</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="muted text-sm">Email</label>
            <input
              className="panel mt-1 w-full rounded px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="muted text-sm">Contraseña</label>
            <input
              className="panel mt-1 w-full rounded px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {info && <div className="text-sm text-green-600">{info}</div>}

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <div className="mt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              className="btn btn-ghost h-8 px-2 underline"
              disabled={cooldown > 0}
              onClick={async () => {
                setError(null)
                setInfo(null)
                const mail = email.trim()
                if (!mail) {
                  setError('Introduce tu email para recuperar la contraseña')
                  return
                }
                try {
                  await requestPasswordReset(mail)
                  setInfo('Te hemos enviado un email para recuperar la contraseña')
                  setCooldown(30)
                } catch {
                  setError('No se pudo enviar el email de recuperación')
                }
              }}
            >
              {cooldown > 0 ? `Reintentar en ${cooldown}s` : '¿Olvidaste tu contraseña?'}
            </button>
            <Link to="/registro" className="btn btn-ghost h-8 px-2 underline">
              Crear cuenta
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}
