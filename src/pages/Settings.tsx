import { useEffect, useState } from 'react'
import { getAuth, updateProfile } from 'firebase/auth'
import { saveUserProfile } from '../apis/user'
import { useAuth } from '../hooks/useAuth'
import { uploadUserAvatar } from '../apis/storage'

export default function Settings() {
  const { user } = useAuth()
  const auth = getAuth()
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [objectURL, setObjectURL] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName || '')
    setPhotoURL(user.photoURL || '')
    setPreview(user.photoURL || null)
  }, [user])

  useEffect(() => {
    return () => {
      if (objectURL) URL.revokeObjectURL(objectURL)
    }
  }, [objectURL])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!user) {
      setError('No hay usuario autenticado')
      return
    }
    setLoading(true)
    try {
      let finalPhotoURL = photoURL.trim()
      // Si hay archivo seleccionado, se sube y se usa su URL
      if (user && file) {
        // Validación básica: tipo y tamaño
        const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
        if (!validTypes.includes(file.type)) {
          throw new Error('Tipo de archivo no soportado')
        }
        const maxBytes = 5 * 1024 * 1024 // 5MB
        if (file.size > maxBytes) {
          throw new Error('La imagen debe ser menor de 5MB')
        }
        finalPhotoURL = await uploadUserAvatar(user.uid, file)
        setPhotoURL(finalPhotoURL)
        setPreview(finalPhotoURL)
      }
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim() || null,
          photoURL: finalPhotoURL || null,
        })
      }
      await saveUserProfile(user.uid, {
        displayName: displayName.trim(),
        email: user.email || '',
      })
      setSuccess('Perfil actualizado')
      setFile(null)
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: unknown }).message || 'Error')
          : 'Error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold">Perfil</h1>
      <form onSubmit={onSubmit} className="panel max-w-xl space-y-4 rounded p-4">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white/20">
            {preview ? (
              <img src={preview} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <div className="flex-1">
            <label className="muted text-sm">Nombre visible</label>
            <input
              className="panel mt-1 w-full rounded px-3 py-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
        </div>

        <div>
          <label className="muted text-sm">URL de avatar (opcional)</label>
          <input
            className="panel mt-1 w-full rounded px-3 py-2"
            value={photoURL}
            onChange={(e) => {
              const v = e.target.value
              setPhotoURL(v)
              setPreview(v || null)
            }}
            placeholder="https://..."
          />
          <div className="mt-3">
            <label className="muted text-sm">o sube una imagen</label>
            <input
              className="panel mt-1 w-full rounded px-3 py-2"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setFile(f)
                setSuccess(null)
                setError(null)
                if (objectURL) {
                  URL.revokeObjectURL(objectURL)
                  setObjectURL(null)
                }
                if (f) {
                  const url = URL.createObjectURL(f)
                  setObjectURL(url)
                  setPreview(url)
                } else {
                  setPreview(photoURL || null)
                }
              }}
            />
            <p className="muted mt-1 text-xs">
              Formatos soportados: PNG, JPG, WEBP, GIF, SVG. Máx. 5MB.
            </p>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={loading || !user}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={loading}
            onClick={() => {
              setPhotoURL('')
              setFile(null)
              setPreview(null)
              if (objectURL) {
                URL.revokeObjectURL(objectURL)
                setObjectURL(null)
              }
            }}
          >
            Quitar avatar
          </button>
        </div>
      </form>
    </section>
  )
}
