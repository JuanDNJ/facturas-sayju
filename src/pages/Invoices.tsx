import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getInvoices } from "../apis/invoices";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import type { Invoice } from "../types/invoice.types";

export default function Invoices() {
  const { user } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [cursorStack, setCursorStack] = useState<
    QueryDocumentSnapshot<DocumentData>[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);

  // filtros
  const [qInvoiceId, setQInvoiceId] = useState("");
  const [qCustomer, setQCustomer] = useState("");
  const [qFrom, setQFrom] = useState<string>(""); // YYYY-MM-DD
  const [qTo, setQTo] = useState<string>("");

  // ordenación
  const [sortBy, setSortBy] = useState<"date" | "customer">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const page = await getInvoices(user.uid, {
          pageSize,
          fromDate: qFrom || undefined,
          toDate: qTo || undefined,
          orderDirection: sortBy === "date" ? sortDir : undefined,
        });
        if (active) {
          setInvoices(page.items);
          setHasNext(Boolean(page.nextCursor));
          setCursorStack(page.nextCursor ? [page.nextCursor] : []);
          setCurrentPage(1);
        }
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: unknown }).message)
            : "No se pudieron cargar las facturas";
        if (active) setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [user, pageSize, qFrom, qTo, sortBy, sortDir]);

  const rows = useMemo(() => {
    const text = (s: unknown) => (typeof s === "string" ? s : "");
    const qId = qInvoiceId.trim().toLowerCase();
    const qCust = qCustomer.trim().toLowerCase();
    let filtered = invoices.filter((inv) => {
      const idOk = !qId || text(inv.invoiceId).toLowerCase().includes(qId);
      const customerName = text(inv.customer?.name);
      const customerDni = text(inv.customer?.taxId);
      const custOk =
        !qCust ||
        customerName.toLowerCase().includes(qCust) ||
        customerDni.toLowerCase().includes(qCust);
      return idOk && custOk;
    });
    if (sortBy === "customer") {
      filtered = filtered.slice().sort((a, b) => {
        const an = text(a.customer?.name).toLowerCase();
        const bn = text(b.customer?.name).toLowerCase();
        if (an === bn) return 0;
        const cmp = an < bn ? -1 : 1;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return filtered.map((inv) => ({
      id: inv.id || inv.invoiceId,
      invoiceId: inv.invoiceId,
      customer: inv.customer?.name || "—",
      date:
        typeof inv.invoiceDate === "string"
          ? inv.invoiceDate
          : inv.invoiceDate.toLocaleDateString("es-ES"),
      total:
        typeof inv.totals?.totalAmount === "number"
          ? new Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "EUR",
            }).format(inv.totals.totalAmount)
          : "—",
    }));
  }, [invoices, qInvoiceId, qCustomer, sortBy, sortDir]);
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Facturas</h1>
        <Link
          to="/invoices/new"
          className="rounded px-3 py-2 panel w-full sm:w-auto text-center"
        >
          Nueva factura
        </Link>
      </div>

      {/* Filtros */}
      <div className="sm:hidden">
        <button
          className="rounded px-3 py-2 panel w-full"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>
      <div
        className={`${
          filtersOpen ? "grid" : "hidden"
        } sm:grid rounded panel p-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm`}
      >
        <div>
          <label className="muted block mb-1" htmlFor="f_id">
            Nº Factura
          </label>
          <input
            id="f_id"
            className="w-full rounded px-2 py-1 sm:px-3 sm:py-2 panel"
            placeholder="Ej: 2025-001"
            value={qInvoiceId}
            onChange={(e) => setQInvoiceId(e.target.value)}
          />
        </div>
        <div>
          <label className="muted block mb-1" htmlFor="f_cust">
            Cliente / DNI
          </label>
          <input
            id="f_cust"
            className="w-full rounded px-2 py-1 sm:px-3 sm:py-2 panel"
            placeholder="Nombre o DNI"
            value={qCustomer}
            onChange={(e) => setQCustomer(e.target.value)}
          />
        </div>
        <div>
          <label className="muted block mb-1" htmlFor="f_from">
            Desde
          </label>
          <input
            id="f_from"
            type="date"
            className="w-full rounded px-2 py-1 sm:px-3 sm:py-2 panel"
            value={qFrom}
            onChange={(e) => setQFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="muted block mb-1" htmlFor="f_to">
            Hasta
          </label>
          <input
            id="f_to"
            type="date"
            className="w-full rounded px-2 py-1 sm:px-3 sm:py-2 panel"
            value={qTo}
            onChange={(e) => setQTo(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-1">
          <div className="muted text-xs">
            Cambiar filtros recarga desde la primera página.
          </div>
          <div className="flex items-center gap-2 sm:self-auto self-end w-full sm:w-auto justify-end">
            <span className="muted text-xs">Tamaño</span>
            <select
              className="rounded px-2 py-1 sm:px-2 sm:py-1 panel text-xs w-full sm:w-auto"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="muted text-xs">Ordenar por</span>
            <select
              className="rounded px-2 py-1 sm:px-2 sm:py-1 panel text-xs w-full sm:w-auto"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "customer")}
            >
              <option value="date">Fecha de emisión</option>
              <option value="customer">Nombre de cliente</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            <span className="muted text-xs">Dirección</span>
            <select
              className="rounded px-2 py-1 sm:px-2 sm:py-1 panel text-xs w-full sm:w-auto"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
            >
              <option value="asc">Ascendente (A-Z / más antigua)</option>
              <option value="desc">Descendente (Z-A / más reciente)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded panel overflow-x-auto">
        {loading && <div className="p-4 text-sm">Cargando facturas…</div>}
        {error && (
          <div className="p-4 text-sm" style={{ color: "crimson" }}>
            {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="p-4 text-sm">No hay facturas todavía.</div>
        )}
        {/* Tabla solo en >= md */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">Factura</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-[var(--panel-border)]"
                >
                  <td className="px-3 py-2">{row.invoiceId}</td>
                  <td className="px-3 py-2">{row.customer}</td>
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2 text-right">{row.total}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/invoices/${row.id}`}
                        className="inline-block rounded px-3 py-1 border border-[var(--panel-border)] hover:bg-[var(--panel)]"
                      >
                        Ver
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Lista tipo tarjeta en móvil (< md) */}
        <div className="md:hidden divide-y border-t border-[var(--panel-border)]">
          {rows.map((row) => (
            <div key={row.id} className="px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{row.invoiceId}</div>
                  <div className="muted text-xs truncate max-w-[70vw]">
                    {row.customer}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{row.date}</div>
                  <div className="font-semibold">{row.total}</div>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Link
                  to={`/invoices/${row.id}`}
                  className="inline-block rounded px-3 py-1 border border-[var(--panel-border)] hover:bg-[var(--panel)]"
                >
                  Ver
                </Link>
              </div>
            </div>
          ))}
        </div>
        {/* Controles de paginación */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 border-t border-[var(--panel-border)]">
          <div className="muted text-xs">Página {currentPage}</div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              className="rounded px-3 py-1 panel w-full sm:w-auto"
              onClick={async () => {
                if (!user) return;
                // Ir a página anterior: necesitamos cargar desde el inicio hasta el cursor anterior.
                // Simplificación: recargamos desde el principio y usamos stack menos 2 para recalcular.
                if (currentPage <= 1) return;
                setLoading(true);
                setError(null);
                try {
                  // Página destino = currentPage - 1
                  // Para obtener esa página, pedimos con el cursor del inicio de esa página:
                  // que es el lastDoc de la página anterior (índice currentPage-3)
                  const prevCursorIdx = currentPage - 3; // puede ser -1 para ir a la primera
                  const prevCursor =
                    prevCursorIdx >= 0 ? cursorStack[prevCursorIdx] : undefined;
                  const page = await getInvoices(user.uid, {
                    pageSize,
                    cursor: prevCursor ?? undefined,
                    fromDate: qFrom || undefined,
                    toDate: qTo || undefined,
                  });
                  setInvoices(page.items);
                  setHasNext(Boolean(page.nextCursor));
                  // Al retroceder una página, la nueva longitud de stack es currentPage-1
                  setCursorStack((s) => {
                    const nextLen = Math.max(0, currentPage - 1);
                    const trimmed = s.slice(0, nextLen - 1);
                    return page.nextCursor
                      ? [...trimmed, page.nextCursor]
                      : trimmed;
                  });
                  setCurrentPage((p) => Math.max(1, p - 1));
                } catch {
                  setError("No se pudo cargar la página anterior");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={currentPage <= 1 || loading}
            >
              Anterior
            </button>
            <button
              className="rounded px-3 py-1 panel w-full sm:w-auto"
              onClick={async () => {
                if (!user) return;
                const lastCursor = cursorStack[cursorStack.length - 1];
                if (!lastCursor) return;
                setLoading(true);
                setError(null);
                try {
                  const page = await getInvoices(user.uid, {
                    pageSize,
                    cursor: lastCursor,
                    fromDate: qFrom || undefined,
                    toDate: qTo || undefined,
                    orderDirection: sortBy === "date" ? sortDir : undefined,
                  });
                  setInvoices(page.items);
                  setHasNext(Boolean(page.nextCursor));
                  setCursorStack((s) =>
                    page.nextCursor ? [...s, page.nextCursor] : [...s]
                  );
                  setCurrentPage((p) => p + 1);
                } catch {
                  setError("No se pudo cargar la siguiente página");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={!hasNext || loading}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
