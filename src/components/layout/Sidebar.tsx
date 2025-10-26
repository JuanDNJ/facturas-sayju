import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import SuggestionsIcon from '../icons/SuggestionsIcon'
import Icon from '../atomic/atoms/Icon'
import ClientsIcon from '../icons/ClienstIcon'
import InvoicesIcon from '../icons/InvoicesIcon'
import DashboardIcon from '../icons/DashboardIcon'
import CompanySealIcons from '../icons/CompanySealIcons'
import SettingsIcon from '../icons/SettingsIcon'
import CloseIcon from '../icons/CloseIcon'

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
        className={`sidebar-solid fixed z-40 h-full w-full md:sticky md:top-0 md:h-screen ${
          collapsed ? 'md:w-16' : 'md:w-64'
        } w-64 shrink-0 transition-transform md:transition-[width] ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } no-print`}
        {...(isModal && {
          'aria-modal': 'true',
          role: 'dialog',
        })}
      >
        <section className="flex items-center p-4">
          <header className="flex flex-1 items-center justify-start gap-4 md:justify-between">
            <span className={collapsed ? 'md:hidden' : undefined}>
              <NavLink to="/" className={`text-4xl font-extrabold text-[currentColor] italic`}>
                SA&JU
              </NavLink>
            </span>
            <NavLink to="/" className={`rounded border-2 border-[currentColor]/50`}>
              <img src="logo.png" width={28} alt="Logo de empresa" />
            </NavLink>
          </header>
          <aside className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              className="w-8 rounded text-red-600 hover:bg-[var(--menu-hover)] md:hidden"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <CloseIcon />
            </button>
          </aside>
        </section>
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
            <Icon className="w-10">
              <DashboardIcon />
            </Icon>
            {!collapsed && <span className="text-lg">Dashboard</span>}
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
            <Icon className="w-10">
              <ClientsIcon />
            </Icon>
            {!collapsed && <span className="text-lg">Clientes</span>}
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
            <Icon className="w-10">
              <InvoicesIcon />
            </Icon>
            {!collapsed && <span className="text-lg">Facturas</span>}
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
            <Icon className="w-10">
              <CompanySealIcons />
            </Icon>
            {!collapsed && <span className="text-lg">Sellos</span>}
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
            <Icon className="w-10">
              <SettingsIcon />
            </Icon>
            {!collapsed && <span className="text-lg">Ajustes</span>}
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
            <span className="w-10">
              <SuggestionsIcon />
            </span>
            {!collapsed && <span className="text-lg">Sugerencias</span>}
          </NavLink>
        </nav>
      </aside>
    </>
  )
}
