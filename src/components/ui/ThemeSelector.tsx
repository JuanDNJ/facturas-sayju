import { useState, useRef, useEffect } from 'react'
import useTheme from '../../theme/useTheme'
import { SunIcon } from '../icons/SunIcon'
import { MoonIcon } from '../icons/MoonIcon'
import { OldWomanIcon } from '../icons/OldWomanIcon'
import Icon from '../atomic/atoms/Icon'

const themes = [
  { value: 'dark', label: ' Oscuro', icon: <MoonIcon /> },
  { value: 'light', label: 'Claro', icon: <SunIcon /> },
  { value: 'paper', label: 'Papel', icon: <OldWomanIcon /> },
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
        <Icon className="w-4">{currentTheme?.icon}</Icon>
        <span className="text-sm">{currentTheme?.label}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 z-50 mt-1 w-32 overflow-hidden rounded border border-[currentColor]/50 shadow-lg"
          role="menu"
        >
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              type="button"
              className={`text-dark hover:bg-dark w-full bg-white px-3 py-2 text-left transition-colors hover:text-white`}
              onClick={() => handleThemeSelect(themeOption.value)}
              role="menuitem"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4">{themeOption.icon}</Icon>
                <strong className="text-sm">{themeOption.label}</strong>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
