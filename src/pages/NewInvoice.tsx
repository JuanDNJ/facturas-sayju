import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type {
  Customer,
  Invoice,
  Item,
  Totals,
  Stamp,
} from "../types/invoice.types";
import { useAuth } from "../hooks/useAuth";
import { addInvoice } from "../apis/invoices";
import { getStamps as getStampsFs } from "../apis/stamps";
import {
  getCustomers as getCustomersFs,
  addCustomer,
  updateCustomer,
} from "../apis/customers";
import DniHelp from "../components/DniHelp";
import { isValidDNI, isValidEmail } from "../utils/validators";

function toNumber(n: string | number): number {
  if (typeof n === "number") return n;
  const parsed = parseFloat(n);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number, locale = "es-ES", currency = "EUR") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    value || 0
  );
}

export default function NewInvoice() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Identificación
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const defaultDate = `${yyyy}-${mm}-${dd}`;

  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(defaultDate);
  const [expirationDate, setExpirationDate] = useState(defaultDate);
  // Tipo de factura
  const [invoiceKind, setInvoiceKind] = useState<"normal" | "rectificativa">(
    "normal"
  );
  const [rectifiedRef, setRectifiedRef] = useState("");
  const [rectifiedDate, setRectifiedDate] = useState(defaultDate);
  const [rectificationReason, setRectificationReason] = useState("");

  // Emisor
  const [issuerMode, setIssuerMode] = useState<"stamp" | "manual">("manual");
  const [issuerName, setIssuerName] = useState("Sayju");
  const [issuerCompany, setIssuerCompany] = useState("Sayju S.A.");
  const [issuerAddress, setIssuerAddress] = useState("C/ Ejemplo 123, Madrid");
  const [issuerTaxId, setIssuerTaxId] = useState("B-12345678");
  const [issuerImgUrl, setIssuerImgUrl] = useState<string>("");

  const [stampsList, setStampsList] = useState<Stamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        const page = await getStampsFs(user.uid, {
          pageSize: 50,
          orderByField: "name",
          direction: "asc",
        });
        setStampsList(page.items);
        setSelectedStampId((prev) => prev || page.items[0]?.id || "");
      } catch {
        // Si falla la carga, dejamos la lista vacía
      }
    })();
  }, [user?.uid]);

  // Clientes (Firestore)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [customerQuery, setCustomerQuery] = useState<string>("");
  const customer = useMemo(
    () => customers.find((c) => c.id === customerId) || null,
    [customers, customerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.taxId || "").toLowerCase().includes(q)
    );
  }, [customers, customerQuery]);

  // Mantener selección coherente con el filtro
  useEffect(() => {
    if (!customerId) {
      if (filteredCustomers.length > 0)
        setCustomerId(filteredCustomers[0].id || "");
      return;
    }
    const stillVisible = filteredCustomers.some((c) => c.id === customerId);
    if (!stillVisible) {
      setCustomerId(filteredCustomers[0]?.id || "");
    }
  }, [customerQuery, filteredCustomers, customerId]);

  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        const page = await getCustomersFs(user.uid, {
          pageSize: 100,
          orderByField: "name",
          direction: "asc",
        });
        setCustomers(page.items);
        setCustomerId((prev) => prev || page.items[0]?.id || "");
      } catch {
        // si falla, mantenemos lista vacía
      }
    })();
  }, [user?.uid]);

  // Modal crear/editar cliente
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  );
  const [customerDraft, setCustomerDraft] = useState<Customer>({
    name: "",
    address: "",
    taxId: "",
    email: "",
    phone: "",
  });
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>(
    {}
  );

  // Items
  const [items, setItems] = useState<Item[]>([
    { code: "", description: "", quantity: 1, price: "0" },
  ]);

  const addItem = () =>
    setItems((arr) => [
      ...arr,
      { code: "", description: "", quantity: 1, price: "0" },
    ]);
  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItems((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  const removeItem = (idx: number) =>
    setItems((arr) => arr.filter((_, i) => i !== idx));

  // Impuestos
  const [vatPercentage, setVatPercentage] = useState<number>(21);
  const [irpfPercentage, setIrpfPercentage] = useState<number>(0);

  // Totales
  const totals: Totals = useMemo(() => {
    const taxableBase = items.reduce(
      (sum, it) => sum + toNumber(it.price) * (it.quantity || 0),
      0
    );
    const vatAmount = taxableBase * (vatPercentage / 100);
    const taxableBasePlusVat = taxableBase + vatAmount;
    const irpfAmount = taxableBase * (irpfPercentage / 100);
    const totalAmount = taxableBasePlusVat - irpfAmount;
    return {
      taxableBase,
      vatPercentage,
      vatAmount,
      taxableBasePlusVat,
      irpfPercentage,
      irpfAmount,
      totalAmount,
    };
  }, [items, vatPercentage, irpfPercentage]);

  // Validación
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Expand/Collapse (móvil): Emisor, Cliente, Impuestos
  const [emisorOpen, setEmisorOpen] = useState(() => {
    const v =
      typeof window !== "undefined"
        ? localStorage.getItem("nv_emisorOpen")
        : null;
    return v === null ? true : v === "true";
  });
  const [clienteOpen, setClienteOpen] = useState(() => {
    const v =
      typeof window !== "undefined"
        ? localStorage.getItem("nv_clienteOpen")
        : null;
    return v === null ? true : v === "true";
  });
  const [impuestosOpen, setImpuestosOpen] = useState(() => {
    const v =
      typeof window !== "undefined"
        ? localStorage.getItem("nv_impuestosOpen")
        : null;
    return v === null ? true : v === "true";
  });

  // Al cargar, si la pantalla es pequeña, colapsar por defecto
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      // Solo forzar colapso si no hay preferencia almacenada
      if (localStorage.getItem("nv_emisorOpen") === null) setEmisorOpen(false);
      if (localStorage.getItem("nv_clienteOpen") === null)
        setClienteOpen(false);
      if (localStorage.getItem("nv_impuestosOpen") === null)
        setImpuestosOpen(false);
    }
  }, []);

  // Persistir cambios
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("nv_emisorOpen", String(emisorOpen));
  }, [emisorOpen]);
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("nv_clienteOpen", String(clienteOpen));
  }, [clienteOpen]);
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("nv_impuestosOpen", String(impuestosOpen));
  }, [impuestosOpen]);
  function validate() {
    const e: Record<string, string> = {};
    if (!invoiceId.trim()) e.invoiceId = "Requerido";
    if (!customerId) e.customerId = "Selecciona un cliente";

    if (issuerMode === "stamp") {
      if (!selectedStampId) e.selectedStampId = "Selecciona un sello";
    } else {
      if (!issuerName.trim()) e.issuerName = "Requerido";
      if (!issuerAddress.trim()) e.issuerAddress = "Requerido";
      if (!issuerTaxId.trim()) e.issuerTaxId = "Requerido";
    }

    if (items.length === 0) e.items = "Añade al menos una línea";
    items.forEach((it, idx) => {
      if (!it.description || !it.description.trim())
        e[`item_${idx}_description`] = "Descripción requerida";
      if (!it.quantity || it.quantity <= 0)
        e[`item_${idx}_quantity`] = "Cantidad > 0";
      // En rectificativas se permiten precios negativos
      if (invoiceKind !== "rectificativa" && toNumber(it.price) < 0)
        e[`item_${idx}_price`] = "Precio >= 0";
    });

    if (invoiceKind === "rectificativa") {
      if (!rectifiedRef.trim())
        e.rectifiedRef = "Referencia de factura requerida";
      if (!rectificationReason.trim())
        e.rectificationReason = "Motivo requerido";
    }

    return e;
  }

  return (
    <section className="space-y-4">
      {/* Modal Cliente */}
      {customerModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-[var(--bg)]"
            onClick={() => setCustomerModalOpen(false)}
          />
          <div className="relative z-50 w-[95vw] max-w-lg max-h-[90vh] overflow-auto rounded panel p-4 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {editingCustomerId ? "Editar cliente" : "Nuevo cliente"}
              </h2>
              <button
                className="rounded px-3 py-2 panel"
                onClick={() => setCustomerModalOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <label className="muted block mb-1" htmlFor="c_name">
                  Nombre
                </label>
                <input
                  id="c_name"
                  className="w-full rounded px-3 py-2 panel"
                  value={customerDraft.name}
                  onChange={(e) =>
                    setCustomerDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
                {customerErrors.name && (
                  <div className="text-xs mt-1" style={{ color: "crimson" }}>
                    {customerErrors.name}
                  </div>
                )}
              </div>
              <div>
                <label className="muted block mb-1" htmlFor="c_tax">
                  DNI
                </label>
                <input
                  id="c_tax"
                  className="w-full rounded px-3 py-2 panel"
                  placeholder="77777777A o X1234567L"
                  aria-describedby="modal-dni-help"
                  value={customerDraft.taxId}
                  onChange={(e) =>
                    setCustomerDraft((d) => ({ ...d, taxId: e.target.value }))
                  }
                />
                <DniHelp id="modal-dni-help" />
                {customerErrors.taxId && (
                  <div className="text-xs mt-1" style={{ color: "crimson" }}>
                    {customerErrors.taxId}
                  </div>
                )}
              </div>
              <div>
                <label className="muted block mb-1" htmlFor="c_address">
                  Dirección
                </label>
                <textarea
                  id="c_address"
                  rows={2}
                  className="w-full rounded px-3 py-2 panel"
                  value={customerDraft.address}
                  onChange={(e) =>
                    setCustomerDraft((d) => ({ ...d, address: e.target.value }))
                  }
                />
                {customerErrors.address && (
                  <div className="text-xs mt-1" style={{ color: "crimson" }}>
                    {customerErrors.address}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="muted block mb-1" htmlFor="c_email">
                    Email (opcional)
                  </label>
                  <input
                    id="c_email"
                    type="email"
                    className="w-full rounded px-3 py-2 panel"
                    value={customerDraft.email || ""}
                    onChange={(e) =>
                      setCustomerDraft((d) => ({ ...d, email: e.target.value }))
                    }
                  />
                  {customerErrors.email && (
                    <div className="text-xs mt-1" style={{ color: "crimson" }}>
                      {customerErrors.email}
                    </div>
                  )}
                </div>
                <div>
                  <label className="muted block mb-1" htmlFor="c_phone">
                    Teléfono (opcional)
                  </label>
                  <input
                    id="c_phone"
                    className="w-full rounded px-3 py-2 panel"
                    value={customerDraft.phone || ""}
                    onChange={(e) =>
                      setCustomerDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  className="rounded px-3 py-2 panel"
                  onClick={async () => {
                    if (!user?.uid) return;
                    const e: Record<string, string> = {};
                    if (!customerDraft.name?.trim())
                      e.name = "Nombre requerido";
                    if (!customerDraft.taxId?.trim()) e.taxId = "DNI requerido";
                    else if (!isValidDNI(customerDraft.taxId)) {
                      e.taxId = "DNI no válido";
                    }
                    if (!customerDraft.address?.trim())
                      e.address = "Dirección requerida";
                    if (
                      customerDraft.email &&
                      !isValidEmail(customerDraft.email)
                    )
                      e.email = "Email no válido";
                    setCustomerErrors(e);
                    if (Object.keys(e).length > 0) return;

                    try {
                      if (editingCustomerId) {
                        await updateCustomer(user.uid, editingCustomerId, {
                          name: customerDraft.name,
                          address: customerDraft.address,
                          taxId: customerDraft.taxId,
                          email: customerDraft.email,
                          phone: customerDraft.phone,
                        });
                        const page = await getCustomersFs(user.uid, {
                          pageSize: 100,
                          orderByField: "name",
                          direction: "asc",
                        });
                        setCustomers(page.items);
                        setCustomerId(editingCustomerId);
                      } else {
                        const newId = await addCustomer(user.uid, {
                          name: customerDraft.name,
                          address: customerDraft.address,
                          taxId: customerDraft.taxId,
                          email: customerDraft.email,
                          phone: customerDraft.phone,
                        } as Customer);
                        const page = await getCustomersFs(user.uid, {
                          pageSize: 100,
                          orderByField: "name",
                          direction: "asc",
                        });
                        setCustomers(page.items);
                        setCustomerId(newId);
                      }
                      setCustomerModalOpen(false);
                    } catch (err) {
                      console.error(err);
                      alert("No se pudo guardar el cliente");
                    }
                  }}
                >
                  Guardar
                </button>
                <button
                  className="rounded px-3 py-2 panel"
                  onClick={() => setCustomerModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-semibold">Nueva factura</h1>
        <Link
          to="/invoices"
          className="rounded px-3 py-2 panel w-full sm:w-auto text-center"
        >
          Volver
        </Link>
      </div>

      {/* Identificación */}
      <div className="rounded p-4 panel text-sm space-y-3">
        {/* Tipo, Nº, Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="muted block mb-1" htmlFor="invoiceKind">
              Tipo
            </label>
            <select
              id="invoiceKind"
              className="w-full rounded px-3 py-2 panel"
              value={invoiceKind}
              onChange={(e) =>
                setInvoiceKind(e.target.value as typeof invoiceKind)
              }
            >
              <option value="normal">Normal</option>
              <option value="rectificativa">Rectificativa</option>
            </select>
          </div>
          <div>
            <label className="muted block mb-1" htmlFor="invoiceId">
              Nº Factura
            </label>
            <input
              id="invoiceId"
              className="w-full rounded px-3 py-2 panel"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
            />
            {errors.invoiceId && (
              <div style={{ color: "crimson" }} className="text-xs mt-1">
                {errors.invoiceId}
              </div>
            )}
          </div>
          <div>
            <label className="muted block mb-1" htmlFor="invoiceDate">
              Fecha
            </label>
            <input
              id="invoiceDate"
              type="date"
              className="w-full rounded px-3 py-2 panel"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div>
            <label className="muted block mb-1" htmlFor="expirationDate">
              Vencimiento
            </label>
            <input
              id="expirationDate"
              type="date"
              className="w-full rounded px-3 py-2 panel"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
          </div>
        </div>

        {invoiceKind === "rectificativa" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="muted block mb-1" htmlFor="rectifiedRef">
                Nº factura rectificada
              </label>
              <input
                id="rectifiedRef"
                className="w-full rounded px-3 py-2 panel"
                value={rectifiedRef}
                onChange={(e) => setRectifiedRef(e.target.value)}
              />
              {errors.rectifiedRef && (
                <div style={{ color: "crimson" }} className="text-xs mt-1">
                  {errors.rectifiedRef}
                </div>
              )}
            </div>
            <div>
              <label className="muted block mb-1" htmlFor="rectifiedDate">
                Fecha factura rectificada
              </label>
              <input
                id="rectifiedDate"
                type="date"
                className="w-full rounded px-3 py-2 panel"
                value={rectifiedDate}
                onChange={(e) => setRectifiedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="muted block mb-1" htmlFor="rectificationReason">
                Motivo de rectificación
              </label>
              <input
                id="rectificationReason"
                className="w-full rounded px-3 py-2 panel"
                value={rectificationReason}
                onChange={(e) => setRectificationReason(e.target.value)}
              />
              {errors.rectificationReason && (
                <div style={{ color: "crimson" }} className="text-xs mt-1">
                  {errors.rectificationReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emisor y Cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Emisor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Emisor</div>
              <button
                type="button"
                className="sm:hidden rounded px-2 py-1 panel text-xs"
                aria-expanded={emisorOpen}
                onClick={() => setEmisorOpen((v) => !v)}
              >
                {emisorOpen ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <div
              className={`${
                emisorOpen ? "block" : "hidden"
              } sm:block space-y-2`}
            >
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="issuerMode"
                    checked={issuerMode === "manual"}
                    onChange={() => setIssuerMode("manual")}
                  />
                  Manual
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="issuerMode"
                    checked={issuerMode === "stamp"}
                    onChange={() => setIssuerMode("stamp")}
                  />
                  Seleccionar sello
                </label>
              </div>

              {issuerMode === "stamp" ? (
                <div className="space-y-2">
                  <div>
                    <label className="muted block mb-1" htmlFor="stampId">
                      Sello
                    </label>
                    <select
                      id="stampId"
                      className="w-full rounded px-3 py-2 panel"
                      value={selectedStampId}
                      onChange={(e) => setSelectedStampId(e.target.value)}
                    >
                      {stampsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.companyName || s.name}
                        </option>
                      ))}
                    </select>
                    {errors.selectedStampId && (
                      <div
                        style={{ color: "crimson" }}
                        className="text-xs mt-1"
                      >
                        {errors.selectedStampId}
                      </div>
                    )}
                  </div>
                  {(() => {
                    const s = stampsList.find((x) => x.id === selectedStampId);
                    return s ? (
                      <div className="muted text-xs">
                        <div className="font-medium text-[var(--text)]">
                          {s.companyName || s.name}
                        </div>
                        {s.address && <div>{s.address}</div>}
                        {s.taxId && <div>{s.taxId}</div>}
                        {s.imgUrl && (
                          <div className="mt-1">
                            <img
                              src={s.imgUrl}
                              alt="Logo sello"
                              className="w-32 h-16 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                <>
                  <div>
                    <label className="muted block mb-1" htmlFor="issuerName">
                      Nombre comercial
                    </label>
                    <input
                      id="issuerName"
                      className="w-full rounded px-3 py-2 panel"
                      value={issuerName}
                      onChange={(e) => setIssuerName(e.target.value)}
                    />
                    {errors.issuerName && (
                      <div
                        style={{ color: "crimson" }}
                        className="text-xs mt-1"
                      >
                        {errors.issuerName}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="muted block mb-1" htmlFor="issuerCompany">
                      Razón social
                    </label>
                    <input
                      id="issuerCompany"
                      className="w-full rounded px-3 py-2 panel"
                      value={issuerCompany}
                      onChange={(e) => setIssuerCompany(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="muted block mb-1" htmlFor="issuerAddress">
                      Dirección
                    </label>
                    <textarea
                      id="issuerAddress"
                      rows={2}
                      className="w-full rounded px-3 py-2 panel"
                      value={issuerAddress}
                      onChange={(e) => setIssuerAddress(e.target.value)}
                    />
                    {errors.issuerAddress && (
                      <div
                        style={{ color: "crimson" }}
                        className="text-xs mt-1"
                      >
                        {errors.issuerAddress}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="muted block mb-1" htmlFor="issuerTaxId">
                      NIF/CIF
                    </label>
                    <input
                      id="issuerTaxId"
                      className="w-full rounded px-3 py-2 panel"
                      placeholder="Ej.: B-12345678"
                      aria-describedby="issuerTaxIdHelp"
                      value={issuerTaxId}
                      onChange={(e) => setIssuerTaxId(e.target.value)}
                    />
                    <div
                      id="issuerTaxIdHelp"
                      className="text-xs text-muted mt-1"
                    >
                      Formatos habituales:
                      <span className="ml-1 font-mono">NIF: 12345678Z</span>,
                      <span className="ml-1 font-mono">NIE: X1234567L</span>,
                      <span className="ml-1 font-mono">CIF: B12345678</span>
                    </div>
                    {errors.issuerTaxId && (
                      <div
                        style={{ color: "crimson" }}
                        className="text-xs mt-1"
                      >
                        {errors.issuerTaxId}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="muted block mb-1" htmlFor="issuerImg">
                      Logo (URL opcional)
                    </label>
                    <input
                      id="issuerImg"
                      className="w-full rounded px-3 py-2 panel"
                      placeholder="https://..."
                      value={issuerImgUrl}
                      onChange={(e) => setIssuerImgUrl(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cliente */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Cliente</div>
              <button
                type="button"
                className="sm:hidden rounded px-2 py-1 panel text-xs"
                aria-expanded={clienteOpen}
                onClick={() => setClienteOpen((v) => !v)}
              >
                {clienteOpen ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <div
              className={`${
                clienteOpen ? "block" : "hidden"
              } sm:block space-y-2`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <label className="muted block mb-1" htmlFor="customerId">
                    Seleccionar cliente
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded px-2 py-1 panel text-xs"
                      onClick={() => {
                        setEditingCustomerId(null);
                        setCustomerDraft({
                          name: "",
                          address: "",
                          taxId: "",
                          email: "",
                          phone: "",
                        });
                        setCustomerErrors({});
                        setCustomerModalOpen(true);
                      }}
                    >
                      Nuevo
                    </button>
                    <button
                      className="rounded px-2 py-1 panel text-xs"
                      onClick={() => {
                        const c = customers.find((x) => x.id === customerId);
                        if (!c) return;
                        setEditingCustomerId(c.id || null);
                        setCustomerDraft({
                          name: c.name,
                          address: c.address,
                          taxId: c.taxId,
                          email: c.email,
                          phone: c.phone,
                        });
                        setCustomerErrors({});
                        setCustomerModalOpen(true);
                      }}
                      disabled={!customerId}
                    >
                      Editar
                    </button>
                  </div>
                </div>
                <input
                  className="w-full rounded px-3 py-2 panel mb-2"
                  placeholder="Buscar por nombre o DNI..."
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  aria-label="Buscar cliente por nombre o DNI"
                />
                <select
                  id="customerId"
                  className="w-full rounded px-3 py-2 panel"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {filteredCustomers.length === 0 && (
                  <div className="text-xs muted mt-1">
                    No hay resultados para el filtro.
                  </div>
                )}
                {errors.customerId && (
                  <div style={{ color: "crimson" }} className="text-xs mt-1">
                    {errors.customerId}
                  </div>
                )}
              </div>
              {customer && (
                <div className="muted text-xs">
                  <div>{customer.address}</div>
                  <div>{customer.taxId}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded p-4 panel text-sm">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="font-semibold">Conceptos</div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              className="rounded px-3 py-2 panel w-full sm:w-auto"
              onClick={addItem}
            >
              Añadir línea
            </button>
            <button
              className="rounded px-3 py-2 panel w-full sm:w-auto"
              onClick={() => {
                if (items.length === 0) return;
                const ok = confirm("¿Eliminar todas las líneas?");
                if (ok)
                  setItems([
                    { code: "", description: "", quantity: 1, price: "0" },
                  ]);
              }}
            >
              Eliminar todas
            </button>
          </div>
        </div>
        {/* Vista móvil: tarjetas */}
        <div className="md:hidden space-y-3">
          {items.map((it, idx) => {
            const price = toNumber(it.price);
            const amount = (it.quantity || 0) * price;
            return (
              <div
                key={idx}
                className="rounded border border-[var(--panel-border)] p-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="muted block mb-1">Código</label>
                    <input
                      className="w-full rounded px-2 py-1 panel"
                      value={it.code}
                      onChange={(e) =>
                        updateItem(idx, { code: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="muted block mb-1">Cantidad</label>
                    <input
                      type="number"
                      min={invoiceKind === "rectificativa" ? -999999 : 0}
                      step={1}
                      className="w-full rounded px-2 py-1 panel text-right"
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(idx, { quantity: Number(e.target.value) })
                      }
                    />
                    {errors[`item_${idx}_quantity`] && (
                      <div
                        style={{ color: "crimson" }}
                        className="text-xs mt-1"
                      >
                        {errors[`item_${idx}_quantity`]}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="muted block mb-1">Descripción</label>
                    <textarea
                      rows={2}
                      className="w-full rounded px-2 py-1 panel"
                      value={it.description}
                      onChange={(e) =>
                        updateItem(idx, { description: e.target.value })
                      }
                    />
                    {errors[`item_${idx}_description`] && (
                      <div
                        style={{ color: "crimson" }}
                        className="text-xs mt-1"
                      >
                        {errors[`item_${idx}_description`]}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="muted block mb-1">Precio</label>
                    <input
                      type="number"
                      min={invoiceKind === "rectificativa" ? -999999 : 0}
                      step={0.01}
                      className="w-full rounded px-2 py-1 panel text-right"
                      value={it.price as unknown as number}
                      onChange={(e) =>
                        updateItem(idx, {
                          price: e.target.value as unknown as number,
                        })
                      }
                    />
                    {errors[`item_${idx}_price`] && (
                      <div
                        style={{ color: "crimson" }}
                        className="text-xs mt-1"
                      >
                        {errors[`item_${idx}_price`]}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="muted text-xs">Importe</div>
                      <div className="font-medium">
                        {formatCurrency(amount)}
                      </div>
                    </div>
                    <button
                      className="rounded px-2 py-1 panel"
                      onClick={() => removeItem(idx)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Vista de tabla en pantallas medianas y grandes */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--panel)]">
              <tr className="text-left">
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Descripción</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-right">Precio</th>
                <th className="px-3 py-2 text-right">Importe</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const price = toNumber(it.price);
                const amount = (it.quantity || 0) * price;
                return (
                  <tr
                    key={idx}
                    className="border-t border-[var(--panel-border)] align-top"
                  >
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded px-2 py-1 panel"
                        value={it.code}
                        onChange={(e) =>
                          updateItem(idx, { code: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        rows={2}
                        className="w-full rounded px-2 py-1 panel"
                        value={it.description}
                        onChange={(e) =>
                          updateItem(idx, { description: e.target.value })
                        }
                      />
                      {errors[`item_${idx}_description`] && (
                        <div
                          style={{ color: "crimson" }}
                          className="text-xs mt-1"
                        >
                          {errors[`item_${idx}_description`]}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={invoiceKind === "rectificativa" ? -999999 : 0}
                        step={1}
                        className="w-24 rounded px-2 py-1 panel text-right"
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(idx, { quantity: Number(e.target.value) })
                        }
                      />
                      {errors[`item_${idx}_quantity`] && (
                        <div
                          style={{ color: "crimson" }}
                          className="text-xs mt-1"
                        >
                          {errors[`item_${idx}_quantity`]}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={invoiceKind === "rectificativa" ? -999999 : 0}
                        step={0.01}
                        className="w-28 rounded px-2 py-1 panel text-right"
                        value={it.price as unknown as number}
                        onChange={(e) =>
                          updateItem(idx, {
                            price: e.target.value as unknown as number,
                          })
                        }
                      />
                      {errors[`item_${idx}_price`] && (
                        <div
                          style={{ color: "crimson" }}
                          className="text-xs mt-1"
                        >
                          {errors[`item_${idx}_price`]}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="rounded px-2 py-1 panel"
                        onClick={() => removeItem(idx)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Impuestos y Totales */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="rounded p-4 panel text-sm flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Impuestos</div>
            <button
              type="button"
              className="sm:hidden rounded px-2 py-1 panel text-xs"
              aria-expanded={impuestosOpen}
              onClick={() => setImpuestosOpen((v) => !v)}
            >
              {impuestosOpen ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <div
            className={`${
              impuestosOpen ? "grid" : "hidden"
            } sm:grid grid-cols-1 sm:grid-cols-2 gap-3`}
          >
            <div>
              <label className="muted block mb-1" htmlFor="vat">
                IVA (%)
              </label>
              <input
                id="vat"
                type="number"
                step={0.1}
                className="w-full rounded px-3 py-2 panel"
                value={vatPercentage}
                onChange={(e) => setVatPercentage(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="muted block mb-1" htmlFor="irpf">
                IRPF (%)
              </label>
              <input
                id="irpf"
                type="number"
                step={0.1}
                className="w-full rounded px-3 py-2 panel"
                value={irpfPercentage}
                onChange={(e) => setIrpfPercentage(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="rounded p-4 panel text-sm w-full lg:w-[420px]">
          <div className="font-semibold mb-2">Totales</div>
          <div className="flex justify-between py-1">
            <span className="muted">Base imponible</span>
            <span>{formatCurrency(totals.taxableBase)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="muted">IVA ({vatPercentage}%)</span>
            <span>{formatCurrency(totals.vatAmount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="muted">Base + IVA</span>
            <span>{formatCurrency(totals.taxableBasePlusVat)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="muted">IRPF ({irpfPercentage}%)</span>
            <span>-{formatCurrency(totals.irpfAmount)}</span>
          </div>
          <div className="border-t border-[var(--panel-border)] my-2" />
          <div className="flex justify-between py-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totals.totalAmount)}</span>
          </div>

          <div className="flex gap-2 pt-3 flex-col sm:flex-row">
            <button
              className="rounded px-3 py-2 panel w-full sm:w-auto"
              onClick={async () => {
                const e = validate();
                setErrors(e);
                if (Object.keys(e).length === 0) {
                  if (!user) {
                    alert("Debes iniciar sesión para guardar la factura");
                    return;
                  }
                  const stamp: Stamp =
                    issuerMode === "stamp"
                      ? (stampsList.find(
                          (s: Stamp) => s.id === selectedStampId
                        ) as Stamp)
                      : {
                          name: issuerName,
                          companyName: issuerCompany,
                          address: issuerAddress,
                          taxId: issuerTaxId,
                          imgUrl: issuerImgUrl || undefined,
                        };
                  const invoice: Invoice = {
                    invoiceId,
                    stamp,
                    invoiceDate,
                    expirationDate,
                    customer: customer || { name: "", address: "", taxId: "" },
                    items,
                    totals,
                    invoiceKind,
                    rectifiedRef:
                      invoiceKind === "rectificativa"
                        ? rectifiedRef
                        : undefined,
                    rectifiedDate:
                      invoiceKind === "rectificativa"
                        ? rectifiedDate
                        : undefined,
                    rectificationReason:
                      invoiceKind === "rectificativa"
                        ? rectificationReason
                        : undefined,
                  };
                  try {
                    await addInvoice(user.uid, invoice);
                    navigate("/invoices");
                  } catch (err) {
                    console.error(err);
                    alert("No se pudo guardar la factura");
                  }
                }
              }}
            >
              Guardar
            </button>
            <button
              className="rounded px-3 py-2 panel w-full sm:w-auto"
              onClick={() => navigate("/invoices")}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
