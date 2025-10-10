import { useCallback, useMemo, useRef, useState } from 'react'

export type Toast = {
  id: number
  message: string
  type?: 'info' | 'success' | 'error'
  durationMs?: number
}

// Contexto en archivo separado (toast-context.ts) para cumplir regla fast-refresh
export type ToastContextValue = {
  show: (message: string, opts?: { type?: Toast['type']; durationMs?: number }) => void
}

import { ToastContext } from './toast-context'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [lastShown, setLastShown] = useState<{ message: string; at: number } | null>(null)
  const timers = useRef<
    Map<number, { timeoutId: number | undefined; remaining: number; startedAt: number }>
  >(new Map())
  const show = useCallback(
    (message: string, opts?: { type?: Toast['type']; durationMs?: number }) => {
      const now = Date.now()
      // deduplicación simple: ignora el mismo mensaje en los últimos 2000ms
      if (lastShown && lastShown.message === message && now - lastShown.at < 2000) return
      setLastShown({ message, at: now })
      const id = now + Math.floor(Math.random() * 1000)
      const t: Toast = {
        id,
        message,
        type: opts?.type ?? 'info',
        durationMs:
          opts?.durationMs ??
          (opts?.type === 'error' ? 4000 : opts?.type === 'success' ? 2000 : 1800),
      }
      setToasts((prev) => {
        const next = [...prev, t]
        // límite de cola a 4
        return next.slice(-4)
      })
      // autodescartar con registro en timers para permitir pausa/reanudar
      const timeoutId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
        timers.current.delete(id)
      }, t.durationMs)
      timers.current.set(id, { timeoutId, remaining: t.durationMs!, startedAt: now })
    },
    [lastShown]
  )

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Contenedor visual */}
      <div className="fixed top-4 left-1/2 z-[1000] flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) =>
          t.type === 'error' ? (
            <div
              key={t.id}
              role="alert"
              aria-live="assertive"
              className={'toast-solid rounded border-red-500 px-3 py-2 text-sm shadow'}
              onMouseEnter={() => {
                const info = timers.current.get(t.id)
                if (!info) return
                if (info.timeoutId) window.clearTimeout(info.timeoutId)
                const elapsed = Date.now() - info.startedAt
                const remaining = Math.max(0, info.remaining - elapsed)
                timers.current.set(t.id, { timeoutId: undefined, remaining, startedAt: Date.now() })
              }}
              onMouseLeave={() => {
                const info = timers.current.get(t.id)
                if (!info) return
                if (info.timeoutId) return
                const timeoutId = window.setTimeout(() => {
                  setToasts((prev) => prev.filter((x) => x.id !== t.id))
                  timers.current.delete(t.id)
                }, info.remaining)
                timers.current.set(t.id, {
                  timeoutId,
                  remaining: info.remaining,
                  startedAt: Date.now(),
                })
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-red-600">{t.message}</div>
                <button
                  className="ml-auto rounded p-1 text-xs hover:bg-[var(--menu-hover)]"
                  aria-label="Cerrar notificación"
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={
                'toast-solid rounded px-3 py-2 text-sm shadow ' +
                (t.type === 'success' ? 'border-green-500' : '')
              }
              onMouseEnter={() => {
                const info = timers.current.get(t.id)
                if (!info) return
                if (info.timeoutId) window.clearTimeout(info.timeoutId)
                const elapsed = Date.now() - info.startedAt
                const remaining = Math.max(0, info.remaining - elapsed)
                timers.current.set(t.id, { timeoutId: undefined, remaining, startedAt: Date.now() })
              }}
              onMouseLeave={() => {
                const info = timers.current.get(t.id)
                if (!info) return
                if (info.timeoutId) return
                const timeoutId = window.setTimeout(() => {
                  setToasts((prev) => prev.filter((x) => x.id !== t.id))
                  timers.current.delete(t.id)
                }, info.remaining)
                timers.current.set(t.id, {
                  timeoutId,
                  remaining: info.remaining,
                  startedAt: Date.now(),
                })
              }}
            >
              <div className="flex items-start gap-3">
                <div className={t.type === 'success' ? 'text-green-700' : ''}>{t.message}</div>
                <button
                  className="ml-auto rounded p-1 text-xs hover:bg-[var(--menu-hover)]"
                  aria-label="Cerrar notificación"
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </ToastContext.Provider>
  )
}

// Hook extraído a hooks/useToast.ts para satisfacer la regla react-refresh/only-export-components
