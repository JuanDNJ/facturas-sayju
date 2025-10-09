import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

// Prefetch simple de módulos de página al hacer hover para acelerar navegación
function prefetchPage(
  key: 'dashboard' | 'clients' | 'invoices' | 'stamps' | 'settings' | 'suggestions'
) {
  switch (key) {
    case 'dashboard':
      import('../../pages/Dashboard')
      break
    case 'clients':
      import('../../pages/Clients')
      break
    case 'invoices':
      import('../../pages/Invoices')
      break
    case 'stamps':
      import('../../pages/Stamps')
      break
    case 'settings':
      import('../../pages/Settings')
      break
    case 'suggestions':
      import('../../pages/Suggestions')
      break
  }
}

const linkBase =
  'flex items-center gap-2 rounded px-3 py-2 text-sm font-medium hover:bg-[var(--menu-hover)] transition-colors'

type SidebarProps = {
  open: boolean
  onClose: () => void
  collapsed?: boolean
  isModal?: boolean
}

export default function Sidebar({
  open,
  onClose,
  collapsed = false,
  isModal = true,
}: SidebarProps) {
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null)
  const location = useLocation()

  // Focus inicial y cierre con Escape cuando es modal
  useEffect(() => {
    if (isModal && open) {
      firstLinkRef.current?.focus()
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [isModal, open, onClose])

  // Cerrar al cambiar de ruta (por ejemplo, al navegar con cualquier NavLink)
  useEffect(() => {
    if (isModal && open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={`fixed inset-0 z-30 bg-black/75 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        } no-print`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`sidebar-solid fixed z-40 h-full md:sticky md:top-0 md:h-screen ${
          collapsed ? 'md:w-16' : 'md:w-64'
        } w-64 shrink-0 transition-transform md:transition-[width] ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } no-print`}
        {...(isModal && {
          'aria-modal': 'true',
          role: 'dialog',
        })}
      >
        <div className="flex items-center justify-between p-4 text-lg font-semibold">
          <span className={collapsed ? 'md:hidden' : undefined}>
            <NavLink to="/">Facturas Sayju</NavLink>
          </span>
          <NavLink to="/">
            <img src="logo.png" width={32} alt="Logo de empresa" />
          </NavLink>
          <button
            type="button"
            className="rounded p-2 hover:bg-[var(--menu-hover)] md:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? ' justify-center' : '')
            }
            ref={firstLinkRef}
            onMouseEnter={() => prefetchPage('dashboard')}
            onClick={() => {
              if (isModal) onClose()
            }}
          >
            <span>📊</span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? ' justify-center' : '')
            }
            onMouseEnter={() => prefetchPage('clients')}
            onClick={() => {
              if (isModal) onClose()
            }}
          >
            <span>👥</span>
            {!collapsed && <span>Clientes</span>}
          </NavLink>
          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? ' justify-center' : '')
            }
            onMouseEnter={() => prefetchPage('invoices')}
            onClick={() => {
              if (isModal) onClose()
            }}
          >
            <span>🧾</span>
            {!collapsed && <span>Facturas</span>}
          </NavLink>
          <NavLink
            to="/sellos"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? ' justify-center' : '')
            }
            onMouseEnter={() => prefetchPage('stamps')}
            onClick={() => {
              if (isModal) onClose()
            }}
          >
            <span>🏷️</span>
            {!collapsed && <span>Sellos</span>}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? ' justify-center' : '')
            }
            onMouseEnter={() => prefetchPage('settings')}
            onClick={() => {
              if (isModal) onClose()
            }}
          >
            <span>⚙️</span>
            {!collapsed && <span>Ajustes</span>}
          </NavLink>
          <NavLink
            to="/sugerencias"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? ' justify-center' : '')
            }
            onMouseEnter={() => prefetchPage('suggestions')}
            onClick={() => {
              if (isModal) onClose()
            }}
          >
            <span>💬</span>
            {!collapsed && <span>Sugerencias</span>}
          </NavLink>
        </nav>
      </aside>
    </>
  )
}
