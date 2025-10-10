import { useState, useRef, useEffect } from 'react'
import useTheme from '../../theme/useTheme'

const themes = [
  { value: 'dark', label: '🌙 Oscuro' },
  { value: 'light', label: '☀️ Claro' },
  { value: 'paper', label: '📜 Papel' },
] as const

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentTheme = themes.find((t) => t.value === theme)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeSelect = (newTheme: 'dark' | 'light' | 'paper') => {
    setTheme(newTheme)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="panel flex items-center justify-between gap-2 rounded px-3 py-1 text-sm hover:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Seleccionar tema"
      >
        <span>{currentTheme?.label}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 z-50 mt-1 w-32 overflow-hidden rounded border border-[var(--panel-border)] bg-[var(--menu-bg)] shadow-lg"
          role="menu"
        >
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              type="button"
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--menu-hover)] ${
                themeOption.value === theme ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--text)]'
              }`}
              onClick={() => handleThemeSelect(themeOption.value)}
              role="menuitem"
            >
              {themeOption.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
