import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const linkBase =
  "flex items-center gap-2 rounded px-3 py-2 text-sm font-medium hover:bg-[var(--menu-hover)] transition-colors";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  isModal?: boolean;
};

export default function Sidebar({
  open,
  onClose,
  collapsed = false,
  isModal = true,
}: SidebarProps) {
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const location = useLocation();

  // Focus inicial y cierre con Escape cuando es modal
  useEffect(() => {
    if (isModal && open) {
      firstLinkRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [isModal, open, onClose]);

  // Cerrar al cambiar de ruta (por ejemplo, al navegar con cualquier NavLink)
  useEffect(() => {
    if (isModal && open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={`fixed inset-0 bg-black/75 z-30 md:hidden transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        } no-print`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed md:sticky md:top-0 z-40 h-full md:h-screen sidebar-solid ${
          collapsed ? "md:w-16" : "md:w-64"
        } w-64 shrink-0 transition-transform md:transition-[width] ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } no-print`}
        aria-hidden={!isModal}
        aria-modal={isModal}
        role={isModal ? "dialog" : undefined}
      >
        <div className="p-4 text-lg font-semibold flex items-center justify-between ">
          <span className={collapsed ? "md:hidden" : undefined}>
            Facturas Sayju
          </span>
          <button
            className="md:hidden p-2 rounded hover:bg-[var(--menu-hover)]"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col p-2 gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? " justify-center" : "")
            }
            ref={firstLinkRef}
            onClick={() => {
              if (isModal) onClose();
            }}
          >
            <span>📊</span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink
            to="/clientes"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? " justify-center" : "")
            }
            onClick={() => {
              if (isModal) onClose();
            }}
          >
            <span>👥</span>
            {!collapsed && <span>Clientes</span>}
          </NavLink>
          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? " justify-center" : "")
            }
            onClick={() => {
              if (isModal) onClose();
            }}
          >
            <span>🧾</span>
            {!collapsed && <span>Facturas</span>}
          </NavLink>
          <NavLink
            to="/sellos"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? " justify-center" : "")
            }
            onClick={() => {
              if (isModal) onClose();
            }}
          >
            <span>🏷️</span>
            {!collapsed && <span>Sellos</span>}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              (isActive ? `${linkBase} bg-[var(--menu-hover)]` : linkBase) +
              (collapsed ? " justify-center" : "")
            }
            onClick={() => {
              if (isModal) onClose();
            }}
          >
            <span>⚙️</span>
            {!collapsed && <span>Ajustes</span>}
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
