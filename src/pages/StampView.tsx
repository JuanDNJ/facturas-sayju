import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/ui/Spinner'
import StampMark from '../components/ui/Stamp'
import type { Stamp } from '../types/invoice.types'
import { getStamp } from '../apis/stamps'

export default function StampView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stamp, setStamp] = useState<Stamp | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user?.uid || !id) {
        setError('No se pudo cargar el sello')
        setLoading(false)
        return
      }
      try {
        const s = await getStamp(user.uid, id)
        if (!cancelled) {
          if (!s) {
            setError('Sello no encontrado')
          } else {
            setStamp(s)
          }
        }
      } catch {
        if (!cancelled) setError('Error al cargar el sello')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user?.uid, id])

  if (loading) return <Spinner className="p-6" />
  if (error)
    return (
      <div className="panel rounded p-4">
        <div className="mb-3 text-red-600">{error}</div>
        <Link to="/sellos" className="btn btn-secondary inline-block">
          Volver a sellos
        </Link>
      </div>
    )
  if (!stamp) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Detalle del sello</h1>
        <Link to="/sellos" className="btn btn-secondary inline-block">
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Preview */}
        <div className="panel rounded p-4">
          <h2 className="mb-2 text-sm font-medium">Vista previa</h2>
          <div className="flex min-h-[180px] items-center justify-center">
            {stamp.imgUrl ? (
              // Imagen subida o URL
              <img
                src={stamp.imgUrl}
                alt={stamp.companyName || stamp.name}
                className="max-h-64 max-w-full object-contain"
              />
            ) : (
              // Sello generado
              <StampMark
                text={stamp.name || stamp.companyName || 'LOGO'}
                variant="personalizado"
                angled={false}
                size="md"
                fontPx={12}
              />
            )}
          </div>
        </div>

        {/* Datos */}
        <div className="panel rounded p-4">
          <h2 className="mb-2 text-sm font-medium">Información</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="muted">Nombre:</span>
              <span className="ml-2 text-[var(--text)]">{stamp.name || '—'}</span>
            </div>
            <div>
              <span className="muted">Razón social:</span>
              <span className="ml-2 text-[var(--text)]">{stamp.companyName || '—'}</span>
            </div>
            <div>
              <span className="muted">DNI/NIF:</span>
              <span className="ml-2 text-[var(--text)]">{stamp.taxId || '—'}</span>
            </div>
            <div>
              <span className="muted">Dirección:</span>
              <span className="ml-2 text-[var(--text)]">{stamp.address || '—'}</span>
            </div>
            <div>
              <span className="muted">Creado:</span>
              <span className="ml-2 text-[var(--text)]">
                {stamp.createdAt ? new Date(stamp.createdAt).toLocaleString() : '—'}
              </span>
            </div>
            <div>
              <span className="muted">Actualizado:</span>
              <span className="ml-2 text-[var(--text)]">
                {stamp.updatedAt ? new Date(stamp.updatedAt).toLocaleString() : '—'}
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>
              Atrás
            </button>
            <Link to="/sellos" className="btn btn-secondary">
              Ir al listado
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
