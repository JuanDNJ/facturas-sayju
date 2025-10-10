import { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  'aria-label'?: string
  disabled?: boolean
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  id,
  'aria-label': ariaLabel,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        setIsOpen(!isOpen)
        break
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        break
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id={id}
        className={`panel flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left transition-colors ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'hover:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:outline-none'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <span className={selectedOption ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-[var(--panel-border)] bg-[var(--menu-bg)] shadow-lg"
          role="listbox"
          aria-label="Lista de opciones"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--menu-hover)] ${
                option.value === value ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--text)]'
              }`}
              onClick={() => handleOptionSelect(option.value)}
              role="option"
              aria-selected={option.value === value ? 'true' : 'false'}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
