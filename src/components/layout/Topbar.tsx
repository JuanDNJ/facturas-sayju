import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { logoutUser } from '../../apis/auth'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ThemeSelector from '../ui/ThemeSelector'
import Icon from '../atomic/atoms/Icon'
import MenuHamburgerIcon from '../icons/MenuHamburgerIcon'
import { CollapaseLeftIcon } from '../icons/CollapaseLeftIcon'
import { CollapaseRightIcon } from '../icons/CollapaseRightIcon'
export default function Topbar({
  onToggleSidebar,
  onToggleCollapse,
  collapsed,
}: {
  onToggleSidebar: () => void
  onToggleCollapse: () => void
  collapsed: boolean
}) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const display = user?.displayName || user?.email || ''
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const photo = user?.photoURL || null
  const initial = (display?.trim()?.[0] || '').toUpperCase()

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      const target = e.target as Node | null
      if (target && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])
  return (
    <header className="panel no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sm:px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Abrir menú"
          className="inline-flex rounded p-2 hover:bg-white/10 md:hidden"
          onClick={onToggleSidebar}
        >
          <Icon className="w-6">
            <MenuHamburgerIcon />
          </Icon>
        </button>
        <button
          type="button"
          aria-label="Colapsar barra lateral"
          className="hidden rounded p-2 italic hover:bg-white/10 md:inline-flex"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menú (b)' : 'Colapsar menú (b)'}
        >
          {collapsed ? (
            <>
              <Icon className="w-6 text-[#2CA9BC]">
                <CollapaseRightIcon />
              </Icon>
              <strong className="text-2xl text-[currentColor]" title="Panel de control">
                PC
              </strong>
            </>
          ) : (
            <>
              <Icon className="text-under-construction w-6">
                <CollapaseLeftIcon />
              </Icon>
              <strong className="text-2xl text-[currentColor]" title="Panel de control">
                PC
              </strong>
            </>
          )}
        </button>
      </div>
      <div className="flex min-w-0 items-center gap-2 text-sm sm:gap-3">
        <input
          type="text"
          placeholder="Buscar..."
          className="panel hidden w-40 rounded px-3 py-1 outline-none sm:block sm:w-56 md:w-64"
        />
        <ThemeSelector />
        {user ? (
          <>
            {display && (
              <strong className="hidden max-w-[140px] truncate text-sm text-[currentColor] sm:block">
                {display}
              </strong>
            )}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 hover:bg-white/30"
                aria-label="Cuenta"
                aria-haspopup="menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={display || 'avatar'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : initial ? (
                  <span className="text-sm font-semibold">{initial}</span>
                ) : (
                  <span>👤</span>
                )}
              </button>
              {menuOpen && (
                <div className="menu-solid absolute right-0 z-10 mt-1 w-44 rounded p-2">
                  <Link
                    className="block rounded px-2 py-1 hover:bg-[var(--menu-hover)]"
                    to="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                  <Link
                    className="block rounded px-2 py-1 hover:bg-[var(--menu-hover)]"
                    to="/registro/datos"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Completar datos
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded px-2 py-1 text-left hover:bg-[var(--menu-hover)]"
                    onClick={async () => {
                      setMenuOpen(false)
                      await logoutUser()
                      navigate('/login', {
                        replace: true,
                        state: { from: location.pathname },
                      })
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link className="panel rounded px-2 py-1" to="/login" title="Iniciar sesión">
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}
