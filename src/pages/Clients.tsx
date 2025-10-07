import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import {
  getCustomers,
  getCustomersPage,
  removeCustomer,
} from "../apis/customers";
import type { Customer } from "../types/invoice.types";
import { useToast } from "../hooks/useToast";

export default function Clients() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(
    () => localStorage.getItem("cl_query") || ""
  );
  const [pageSize, setPageSize] = useState<number>(() => {
    const v = localStorage.getItem("cl_pageSize");
    const n = v ? Number(v) : 10;
    return Number.isFinite(n) && n > 0 ? n : 10;
  });
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">(
    () => (localStorage.getItem("cl_orderDirection") as "asc" | "desc") || "asc"
  );
  // Filtros avanzados eliminados
  const [pageCursors, setPageCursors] = useState<
    QueryDocumentSnapshot<DocumentData>[]
  >([]);
  const [hasNext, setHasNext] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const loadFirst = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const page = await getCustomers(user.uid, {
          pageSize,
          withTotal: true,
          orderByField: "name",
          direction: orderDirection,
        });
        if (!active) return;
        setItems(page.items);
        setHasNext(Boolean(page.nextCursor));
        setPageCursors(page.nextCursor ? [page.nextCursor] : []);
        setCurrentPage(1);
        setTotal(page.total);
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: unknown }).message)
            : "No se pudieron cargar los clientes";
        if (active) setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadFirst();
    return () => {
      active = false;
    };
  }, [user, pageSize, orderDirection]);

  // Persistir preferencias
  useEffect(() => {
    localStorage.setItem("cl_query", query);
  }, [query]);
  useEffect(() => {
    localStorage.setItem("cl_pageSize", String(pageSize));
  }, [pageSize]);
  useEffect(() => {
    localStorage.setItem("cl_orderDirection", orderDirection);
  }, [orderDirection]);
  // Persistencia de filtros avanzados eliminada

  // Recoger toast que venga desde navegación (por ejemplo, tras crear o borrar)
  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      show(state.toast, { type: "success" });
      // limpiar el state para no repetir el toast en navegaciones futuras
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
  }, [location.state, location.pathname, navigate, show]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    let res = items;
    if (q) {
      res = res.filter((c) =>
        [c.name, c.email, c.taxId, c.phone, c.address]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    // Sin filtros avanzados
    return res;
  }, [items, query]);

  // Si cambia la búsqueda, volver a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const hasClientSideFilters = useMemo(() => {
    return Boolean(query.trim());
  }, [query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar por nombre, email, DNI, teléfono..."
            className="rounded px-3 py-2 panel w-full sm:w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="rounded px-3 py-2 panel w-full sm:w-auto"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Tamaño de página"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
          </select>
          <select
            className="rounded px-3 py-2 panel w-full sm:w-auto"
            value={orderDirection}
            onChange={(e) => {
              setOrderDirection(e.target.value as "asc" | "desc");
              setCurrentPage(1);
            }}
            aria-label="Orden por nombre"
          >
            <option value="asc">Nombre A–Z</option>
            <option value="desc">Nombre Z–A</option>
          </select>
          <Link
            to="/clientes/nuevo"
            className="btn btn-primary btn-sm w-full sm:w-auto text-center"
          >
            Nuevo cliente
          </Link>
        </div>
      </div>

      {/* Tabla (md+) */}
      <div className="hidden md:block overflow-x-auto rounded panel">
        {loading && <div className="p-4 text-sm">Cargando clientes…</div>}
        {error && (
          <div className="p-4 text-sm" style={{ color: "crimson" }}>
            {error}
          </div>
        )}
        {!loading && !error && data.length === 0 && (
          <div className="p-4 text-sm">No hay clientes todavía.</div>
        )}
        <table className="w-full text-sm">
          <thead className="text-left muted">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">DNI</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr
                key={c.id || c.taxId}
                className="border-t border-[var(--panel-border)]"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--text)]">{c.name}</div>
                  <div className="muted text-xs truncate max-w-[360px]">
                    {c.address}
                  </div>
                </td>
                <td className="px-4 py-3">{c.email || "—"}</td>
                <td className="px-4 py-3">{c.phone || "—"}</td>
                <td className="px-4 py-3">{c.taxId}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link
                      to={`/clientes/${c.id}`}
                      className="btn btn-ghost h-8 px-3"
                    >
                      Ver
                    </Link>
                    <Link
                      to={`/clientes/${c.id}?edit=1`}
                      className="btn btn-secondary h-8 px-3"
                    >
                      Editar
                    </Link>
                    <button
                      className="btn btn-danger h-8 px-3"
                      onClick={async () => {
                        if (!user || !c.id) return;
                        const ok = window.confirm(
                          `¿Eliminar cliente "${c.name}"? Esta acción no se puede deshacer.`
                        );
                        if (!ok) return;
                        try {
                          await removeCustomer(user.uid, c.id);
                          setItems((prev) => prev.filter((x) => x.id !== c.id));
                          show("Cliente eliminado", { type: "success" });
                        } catch (err) {
                          console.error(err);
                          show("Error al eliminar", { type: "error" });
                        }
                      }}
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista en tarjetas (móvil) */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {data.map((c) => (
          <div key={c.id || c.taxId} className="rounded p-4 panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-[var(--text)]">{c.name}</div>
                <div className="muted text-xs truncate max-w-[220px]">
                  {c.address}
                </div>
                <div className="muted text-xs">{c.taxId}</div>
              </div>
              <div className="flex gap-2 flex-wrap w-[120px] sm:w-auto">
                <Link
                  to={`/clientes/${c.id}`}
                  className="btn btn-ghost h-8 px-3 w-full sm:w-auto text-center"
                >
                  Ver
                </Link>
                <Link
                  to={`/clientes/${c.id}?edit=1`}
                  className="btn btn-secondary h-8 px-3 w-full sm:w-auto text-center"
                >
                  Editar
                </Link>
                <button
                  className="btn btn-danger h-8 px-3 w-full sm:w-auto text-center"
                  onClick={async () => {
                    if (!user || !c.id) return;
                    const ok = window.confirm(
                      `¿Eliminar cliente "${c.name}"? Esta acción no se puede deshacer.`
                    );
                    if (!ok) return;
                    try {
                      await removeCustomer(user.uid, c.id);
                      setItems((prev) => prev.filter((x) => x.id !== c.id));
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2">
        <div className="text-sm muted w-full sm:w-auto text-center sm:text-left">
          Página {currentPage}
          {typeof total === "number" && !hasClientSideFilters && (
            <>
              {" "}
              — Mostrando{" "}
              {items.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {items.length > 0
                ? (currentPage - 1) * pageSize + items.length
                : 0}{" "}
              de {total}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            className="btn btn-secondary w-full sm:w-auto"
            disabled={currentPage <= 1 || loading}
            onClick={async () => {
              if (!user) return;
              if (currentPage <= 1) return;
              setLoading(true);
              setError(null);
              try {
                const prevCursorIndex = currentPage - 2; // página anterior - 1
                const prevCursor =
                  prevCursorIndex >= 0 ? pageCursors[prevCursorIndex] : null;
                const page = await getCustomersPage(user.uid, prevCursor, {
                  pageSize,
                  orderByField: "name",
                  direction: orderDirection,
                });
                setItems(page.items);
                setHasNext(Boolean(page.nextCursor));
                setCurrentPage((p) => Math.max(1, p - 1));
              } catch {
                setError("No se pudo cargar la página anterior");
              } finally {
                setLoading(false);
              }
            }}
          >
            Anterior
          </button>
          <button
            className="btn btn-secondary w-full sm:w-auto"
            disabled={!hasNext || loading}
            onClick={async () => {
              if (!user) return;
              const lastCursor = pageCursors[currentPage - 1];
              if (!lastCursor) return;
              setLoading(true);
              setError(null);
              try {
                const page = await getCustomersPage(user.uid, lastCursor, {
                  pageSize,
                  orderByField: "name",
                  direction: orderDirection,
                });
                setItems(page.items);
                setHasNext(Boolean(page.nextCursor));
                setPageCursors((s) =>
                  page.nextCursor ? [...s, page.nextCursor] : [...s]
                );
                setCurrentPage((p) => p + 1);
              } catch {
                setError("No se pudo cargar la siguiente página");
              } finally {
                setLoading(false);
              }
            }}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Toasts globales renderizados por ToastProvider */}
    </section>
  );
}
