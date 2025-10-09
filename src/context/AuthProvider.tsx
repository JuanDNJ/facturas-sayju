import { useEffect, useMemo, useState } from 'react'
// Cargamos auth dinámicamente para reducir el bundle inicial
import { appFirebase } from '../apis/firebase'
import { AuthContext } from './auth-context'
import type { User } from 'firebase/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsub: (() => void) | undefined
    let cancelled = false
    ;(async () => {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth')
      if (cancelled) return
      const auth = getAuth(appFirebase)
      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })
    })()
    return () => {
      cancelled = true
      if (unsub) unsub()
    }
  }, [])

  const value = useMemo(() => ({ user, loading }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
