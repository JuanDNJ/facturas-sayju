import { useId, useState, type ReactNode } from 'react'

type DisclosureProps = {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  header?: ReactNode
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
      {header && (
        <h2
          id={btnId}
          className={buttonClassName ?? 'text-xs'}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          {header}
        </h2>
      )}

      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className={`disclosure-panel ${open ? 'block' : 'hidden'} ${panelClassName ?? ''}`}
      >
        {children}
      </div>
    </div>
  )
}
