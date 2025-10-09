import { useId, useState, type ReactNode } from 'react'

type DisclosureProps = {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  header: ReactNode
  children: ReactNode
  className?: string
  panelClassName?: string
  buttonClassName?: string
}

export default function Disclosure({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  header,
  children,
  className,
  panelClassName,
  buttonClassName,
}: DisclosureProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = (v: boolean) => {
    if (!isControlled) setUncontrolledOpen(v)
    onOpenChange?.(v)
  }

  const panelId = useId()
  const btnId = `btn-${panelId}`

  return (
    <div className={className}>
      <button
        id={btnId}
        className={buttonClassName ?? 'btn btn-secondary px-2 py-1 text-xs'}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {header}
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={`${open ? 'block' : 'hidden'} ${panelClassName ?? ''}`}
      >
        {children}
      </div>
    </div>
  )
}
