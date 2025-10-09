import { useEffect, useRef, useState } from "react";
import useTheme from "../../theme/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { logoutUser } from "../../apis/auth";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
export default function Topbar({
  onToggleSidebar,
  onToggleCollapse,
  collapsed,
}: {
  onToggleSidebar: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const display = user?.displayName || user?.email || "";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const photo = user?.photoURL || null;
  const initial = (display?.trim()?.[0] || "").toUpperCase();

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      const target = e.target as Node | null;
      if (target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <header className="sticky top-0 z-30 h-14 border-b px-2 sm:px-4 flex items-center justify-between panel no-print backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Abrir menú"
          className="inline-flex md:hidden p-2 rounded hover:bg-white/10"
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <button
          type="button"
          aria-label="Colapsar barra lateral"
          className="hidden md:inline-flex p-2 rounded hover:bg-white/10"
          onClick={onToggleCollapse}
          title={collapsed ? "Expandir menú (b)" : "Colapsar menú (b)"}
        >
          {collapsed ? "➡" : "⬅"}
        </button>
        <div className="font-medium">
          <NavLink to="/">Panel de control</NavLink>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-sm min-w-0">
        <input
          type="text"
          placeholder="Buscar..."
          className="hidden sm:block rounded px-3 py-1 outline-none w-40 sm:w-56 md:w-64 panel"
        />
        <select
          aria-label="Seleccionar tema"
          className="rounded px-2 py-1 panel"
          value={theme}
          onChange={(e) =>
            setTheme(e.target.value as "dark" | "light" | "paper")
          }
        >
          <option value="dark">Oscuro</option>
          <option value="light">Claro</option>
          <option value="paper">Papel</option>
        </select>
        {user ? (
          <>
            {display && (
              <div className="hidden sm:block truncate max-w-[140px] text-xs text-blue-500">
                {display}
              </div>
            )}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-white/20 grid place-items-center shrink-0 hover:bg-white/30"
                aria-label="Cuenta"
                aria-haspopup="menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={display || "avatar"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : initial ? (
                  <span className="font-semibold text-sm">{initial}</span>
                ) : (
                  <span>👤</span>
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 rounded menu-solid p-2 w-44 z-10">
                  <Link
                    className="block px-2 py-1 rounded hover:bg-[var(--menu-hover)]"
                    to="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                  <Link
                    className="block px-2 py-1 rounded hover:bg-[var(--menu-hover)]"
                    to="/registro/datos"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Completar datos
                  </Link>
                  <button
                    type="button"
                    className="block w-full text-left px-2 py-1 rounded hover:bg-[var(--menu-hover)]"
                    onClick={async () => {
                      setMenuOpen(false);
                      await logoutUser();
                      navigate("/login", {
                        replace: true,
                        state: { from: location.pathname },
                      });
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            className="rounded px-2 py-1 panel"
            to="/login"
            title="Iniciar sesión"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
