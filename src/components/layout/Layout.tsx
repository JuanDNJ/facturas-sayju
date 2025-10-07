import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Drawer móvil
  const [collapsed, setCollapsed] = useState(false); // Colapso en desktop
  const [isDesktop, setIsDesktop] = useState(false);

  // Detectar md breakpoint para saber si el sidebar es modal
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  // Cargar estado de colapso desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebarCollapsed");
      if (stored != null) setCollapsed(stored === "1");
    } catch {
      // ignore read storage errors
    }
  }, []);

  // Guardar estado de colapso
  useEffect(() => {
    try {
      localStorage.setItem("sidebarCollapsed", collapsed ? "1" : "0");
    } catch {
      // ignore write storage errors
    }
  }, [collapsed]);

  // Atajos de teclado: m (móvil toggle), b (desktop colapso)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      const k = e.key.toLowerCase();
      if (k === "m") {
        setSidebarOpen((v) => !v);
      } else if (k === "b") {
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapse = () => setCollapsed((v) => !v);

  const layoutCols = collapsed
    ? "md:grid-cols-[4rem_1fr]"
    : "md:grid-cols-[16rem_1fr]";
  return (
    <div className={`md:h-screen md:overflow-hidden md:grid ${layoutCols}`}>
      {/* Sidebar drawer en móvil */}
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        collapsed={collapsed}
        isModal={!isDesktop}
      />
      <div className="grid grid-rows-[auto_1fr] md:min-h-0">
        <Topbar
          onToggleSidebar={toggleSidebar}
          onToggleCollapse={toggleCollapse}
          collapsed={collapsed}
        />
        <main className="pt-2 p-4 sm:p-6 md:overflow-auto md:min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
