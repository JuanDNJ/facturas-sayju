import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Invoice, Item, Stamp } from "../types/invoice.types";
import { useAuth } from "../hooks/useAuth";
import { getInvoice, updateInvoice } from "../apis/invoices";
import { getStamps as getStampsFs } from "../apis/stamps";
import { useToast } from "../hooks/useToast";
import InvoiceForm from "../components/invoices/InvoiceForm";

function toNumber(n: string | number): number {
  if (typeof n === "number") return n;
  const parsed = parseFloat(n);
  return Number.isFinite(parsed) ? parsed : 0;
}

// formato de moneda lo maneja InvoiceForm; no se necesita aquí

function toInputDate(value: Date | string | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identificación
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(""); // YYYY-MM-DD
  const [expirationDate, setExpirationDate] = useState("");

  // Tipo de factura
  const [invoiceKind, setInvoiceKind] = useState<"normal" | "rectificativa">(
    "normal"
  );
  const [rectifiedRef, setRectifiedRef] = useState("");
  const [rectifiedDate, setRectifiedDate] = useState("");
  const [rectificationReason, setRectificationReason] = useState("");

  // Emisor (sello / manual)
  const [issuerMode, setIssuerMode] = useState<"stamp" | "manual">("manual");
  const [issuerName, setIssuerName] = useState("");
  const [issuerCompany, setIssuerCompany] = useState("");
  const [issuerAddress, setIssuerAddress] = useState("");
  const [issuerTaxId, setIssuerTaxId] = useState("");
  const [issuerImgUrl, setIssuerImgUrl] = useState<string>("");

  const [stampsList, setStampsList] = useState<Stamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string>("");

  // Cliente (editable directo en edición)
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Items e impuestos
  const [items, setItems] = useState<Item[]>([]);
  const [vatPercentage, setVatPercentage] = useState<number>(21);
  const [irpfPercentage, setIrpfPercentage] = useState<number>(0);

  const totals = useMemo(() => {
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

  useEffect(() => {
    (async () => {
      if (!user?.uid || !id) return;
      setLoading(true);
      setError(null);
      try {
        const inv = await getInvoice(user.uid, id);
        if (!inv) {
          setError("Factura no encontrada");
          setLoading(false);
          return;
        }
        // Prefill
        setInvoiceId(inv.invoiceId || "");
        setInvoiceDate(toInputDate(inv.invoiceDate));
        setExpirationDate(toInputDate(inv.expirationDate));
        setInvoiceKind(inv.invoiceKind || "normal");
        setRectifiedRef(inv.rectifiedRef || "");
        setRectifiedDate(toInputDate(inv.rectifiedDate));
        setRectificationReason(inv.rectificationReason || "");

        setIssuerName(inv.stamp?.name || "");
        setIssuerCompany(inv.stamp?.companyName || "");
        setIssuerAddress(inv.stamp?.address || "");
        setIssuerTaxId(inv.stamp?.taxId || "");
        setIssuerImgUrl(inv.stamp?.imgUrl || "");
        setIssuerMode("manual");

        setCustomerName(inv.customer?.name || "");
        setCustomerAddress(inv.customer?.address || "");
        setCustomerTaxId(inv.customer?.taxId || "");
        setCustomerEmail(inv.customer?.email || "");
        setCustomerPhone(inv.customer?.phone || "");

        setItems(
          (inv.items || []).map((it) => ({
            code: it.code,
            description: it.description,
            quantity: it.quantity,
            price: typeof it.price === "number" ? it.price : String(it.price),
          }))
        );
        setVatPercentage(inv.totals?.vatPercentage ?? 21);
        setIrpfPercentage(inv.totals?.irpfPercentage ?? 0);

        // Stamps
        try {
          const page = await getStampsFs(user.uid, {
            pageSize: 50,
            orderByField: "name",
            direction: "asc",
          });
          setStampsList(page.items);
          setSelectedStampId("");
        } catch {
          // ignorar error de carga de sellos
        }
      } catch (e: unknown) {
        const msg =
          typeof e === "object" && e && "message" in e
            ? String((e as { message?: unknown }).message)
            : "No se pudo cargar la factura";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid, id]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  function validate() {
    const e: Record<string, string> = {};
    if (!invoiceId.trim()) e.invoiceId = "Requerido";
    if (!customerName.trim()) e.customerName = "Requerido";
    if (!customerAddress.trim()) e.customerAddress = "Requerido";
    if (!customerTaxId.trim()) e.customerTaxId = "Requerido";
    if (items.length === 0) e.items = "Añade al menos una línea";
    items.forEach((it, idx) => {
      if (!it.description || !it.description.trim())
        e[`item_${idx}_description`] = "Descripción requerida";
      if (!it.quantity || it.quantity <= 0)
        e[`item_${idx}_quantity`] = "Cantidad > 0";
      if (invoiceKind !== "rectificativa" && toNumber(it.price) < 0)
        e[`item_${idx}_price`] = "Precio >= 0";
    });
    if (invoiceKind === "rectificativa") {
      if (!rectifiedRef.trim()) e.rectifiedRef = "Referencia requerida";
      if (!rectificationReason.trim())
        e.rectificationReason = "Motivo requerido";
    }
    return e;
  }

  // Gestión de items delegada al InvoiceForm mediante callbacks

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="rounded p-6 panel">Cargando factura…</div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="space-y-4">
        <div className="rounded p-6 panel" style={{ color: "crimson" }}>
          {error}
        </div>
        <Link to="/invoices" className="btn btn-ghost inline-block">
          Volver
        </Link>
      </section>
    );
  }
  if (!id) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-semibold">Editar factura</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link
            to={`/invoices/${id}`}
            className="btn btn-secondary w-full sm:w-auto text-center"
          >
            Ver
          </Link>
          <Link
            to="/invoices"
            className="btn btn-ghost w-full sm:w-auto text-center"
          >
            Volver
          </Link>
        </div>
      </div>
      <InvoiceForm
        values={{
          invoiceId,
          invoiceDate,
          expirationDate,
          invoiceKind,
          rectifiedRef,
          rectifiedDate,
          rectificationReason,
          issuerMode,
          issuer: {
            name: issuerName,
            companyName: issuerCompany,
            address: issuerAddress,
            taxId: issuerTaxId,
            imgUrl: issuerImgUrl,
          },
          selectedStampId,
          items,
          vatPercentage,
          irpfPercentage,
        }}
        errors={errors}
        stampsList={stampsList}
        onValuesChange={(patch) => {
          // Mapear cambios a estados locales
          if (patch.invoiceId !== undefined) setInvoiceId(patch.invoiceId);
          if (patch.invoiceDate !== undefined)
            setInvoiceDate(patch.invoiceDate);
          if (patch.expirationDate !== undefined)
            setExpirationDate(patch.expirationDate);
          if (patch.invoiceKind !== undefined)
            setInvoiceKind(patch.invoiceKind);
          if (patch.rectifiedRef !== undefined)
            setRectifiedRef(patch.rectifiedRef);
          if (patch.rectifiedDate !== undefined)
            setRectifiedDate(patch.rectifiedDate);
          if (patch.rectificationReason !== undefined)
            setRectificationReason(patch.rectificationReason);
          if (patch.issuerMode !== undefined) setIssuerMode(patch.issuerMode);
          if (patch.issuer !== undefined) {
            setIssuerName(patch.issuer.name);
            setIssuerCompany(patch.issuer.companyName || "");
            setIssuerAddress(patch.issuer.address);
            setIssuerTaxId(patch.issuer.taxId);
            setIssuerImgUrl(patch.issuer.imgUrl || "");
          }
          if (patch.selectedStampId !== undefined)
            setSelectedStampId(patch.selectedStampId);
          if (patch.vatPercentage !== undefined)
            setVatPercentage(patch.vatPercentage);
          if (patch.irpfPercentage !== undefined)
            setIrpfPercentage(patch.irpfPercentage);
        }}
        onItemChange={(index, patch) =>
          setItems((arr) =>
            arr.map((it, i) => (i === index ? { ...it, ...patch } : it))
          )
        }
        onAddItem={() =>
          setItems((arr) => [
            ...arr,
            { code: "", description: "", quantity: 1, price: "0" },
          ])
        }
        onRemoveItem={(index) =>
          setItems((arr) => arr.filter((_, i) => i !== index))
        }
        submitting={saving}
        submitLabel="Guardar cambios"
        customerSection={
          <div className="rounded p-4 panel text-sm space-y-2">
            <div className="font-semibold mb-1">Cliente</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="muted block mb-1" htmlFor="c_name">
                  Nombre
                </label>
                <input
                  id="c_name"
                  className="w-full rounded px-3 py-2 panel"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                {errors.customerName && (
                  <div className="text-xs mt-1" style={{ color: "crimson" }}>
                    {errors.customerName}
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
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                />
                {errors.customerTaxId && (
                  <div className="text-xs mt-1" style={{ color: "crimson" }}>
                    {errors.customerTaxId}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="muted block mb-1" htmlFor="c_address">
                  Dirección
                </label>
                <textarea
                  id="c_address"
                  rows={2}
                  className="w-full rounded px-3 py-2 panel"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
                {errors.customerAddress && (
                  <div className="text-xs mt-1" style={{ color: "crimson" }}>
                    {errors.customerAddress}
                  </div>
                )}
              </div>
              <div>
                <label className="muted block mb-1" htmlFor="c_email">
                  Email (opcional)
                </label>
                <input
                  id="c_email"
                  type="email"
                  className="w-full rounded px-3 py-2 panel"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="muted block mb-1" htmlFor="c_phone">
                  Teléfono (opcional)
                </label>
                <input
                  id="c_phone"
                  className="w-full rounded px-3 py-2 panel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        }
        onSubmit={async () => {
          const e = validate();
          setErrors(e);
          if (Object.keys(e).length > 0) return;
          if (!user?.uid || !id) return;
          setSaving(true);
          try {
            const stamp: Stamp = {
              name: issuerName,
              companyName: issuerCompany || undefined,
              address: issuerAddress,
              taxId: issuerTaxId,
              imgUrl: issuerImgUrl || undefined,
            };
            const patch: Partial<Invoice> = {
              invoiceId,
              stamp,
              invoiceDate,
              expirationDate,
              customer: {
                name: customerName,
                address: customerAddress,
                taxId: customerTaxId,
                email: customerEmail || undefined,
                phone: customerPhone || undefined,
              },
              items,
              totals,
              invoiceKind,
              rectifiedRef:
                invoiceKind === "rectificativa" ? rectifiedRef : undefined,
              rectifiedDate:
                invoiceKind === "rectificativa" ? rectifiedDate : undefined,
              rectificationReason:
                invoiceKind === "rectificativa"
                  ? rectificationReason
                  : undefined,
            };
            await updateInvoice(user.uid, id, patch);
            show("Factura actualizada", { type: "success" });
            navigate(`/invoices/${id}`);
          } catch (err) {
            console.error(err);
            show("No se pudo guardar", { type: "error" });
          } finally {
            setSaving(false);
          }
        }}
      />
    </section>
  );
}
