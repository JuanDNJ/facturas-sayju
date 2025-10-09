import { useId, type ReactNode } from 'react'

type HelpRender = (args: { id: string }) => ReactNode

type FormFieldProps = {
  id?: string
  label: ReactNode
  help?: ReactNode | HelpRender
  error?: ReactNode
  required?: boolean
  className?: string
  labelClassName?: string
  helpClassName?: string
  errorClassName?: string
  children: (controlProps: {
    id: string
    required?: boolean
    'aria-describedby'?: string
  }) => ReactNode
}

export default function FormField({
  id,
  label,
  help,
  error,
  required,
  className,
  labelClassName,
  helpClassName,
  errorClassName,
  children,
}: FormFieldProps) {
  const autoId = useId()
  const fieldId = id ?? `field-${autoId}`
  const helpId = help ? `${fieldId}-help` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={fieldId} className={labelClassName ?? 'muted mb-1 block'}>
        {label}
        {required ? ' *' : null}
      </label>

      {children({ id: fieldId, required, 'aria-describedby': describedBy })}

      {help ? (
        <div id={helpId} className={helpClassName ?? 'muted mt-1 text-xs'}>
          {typeof help === 'function' ? (help as HelpRender)({ id: helpId! }) : help}
        </div>
      ) : null}

      {error ? (
        <div id={errorId} className={errorClassName ?? 'mt-1 text-xs text-red-600'}>
          {error}
        </div>
      ) : null}
    </div>
  )
}
