import { useEffect, useId, useRef, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  initialFocusRef?: React.RefObject<HTMLElement>
  children: ReactNode
}

function getMaxWidth(size: ModalProps['size']) {
  switch (size) {
    case 'sm':
      return 'max-w-sm'
    case 'md':
      return 'max-w-lg'
    case 'lg':
      return 'max-w-3xl'
    case 'xl':
      return 'max-w-5xl'
    default:
      return 'max-w-lg'
  }
}

export default function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  initialFocusRef,
  children,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const autoTitleId = useId()
  const titleId = title ? `modal-title-${autoTitleId}` : undefined

  // Cerrar con Escape
  useEffect(() => {
    if (!open || !closeOnEsc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // Focus trap sencillo
        const root = contentRef.current
        if (!root) return
        const focusables = root.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
        const list = Array.from(focusables).filter((el) => !el.hasAttribute('disabled'))
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeOnEsc, onClose])

  // Lock scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev || ''
    }
  }, [open])

  // Focus inicial
  useEffect(() => {
    if (!open) return
    const toFocus =
      initialFocusRef?.current ||
      contentRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    toFocus?.focus()
  }, [open, initialFocusRef])

  if (!open) return null

  const labelledProps = title
    ? { 'aria-labelledby': titleId }
    : ariaLabel
      ? { 'aria-label': ariaLabel }
      : {}

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      {...labelledProps}
    >
      <div
        className="absolute inset-0 bg-[var(--bg)]"
        onClick={() => {
          if (closeOnOverlayClick) onClose()
        }}
      />
      <div
        ref={contentRef}
        className={`panel relative z-50 max-h-[90vh] w-[95vw] ${getMaxWidth(size)} overflow-auto rounded p-4 shadow-lg`}
      >
        <div className="mb-3 flex items-start justify-between">
          {title ? (
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
