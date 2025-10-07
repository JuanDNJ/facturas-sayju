import React, { useMemo } from "react";
import type { Invoice, Item, Stamp } from "../../types/invoice.types";

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

export type InvoiceFormValues = {
  invoiceId: string;
  invoiceDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  invoiceKind: "normal" | "rectificativa";
  rectifiedRef: string;
  rectifiedDate: string; // YYYY-MM-DD
  rectificationReason: string;
  issuerMode: "stamp" | "manual";
  issuer: {
    name: string;
    companyName?: string;
    address: string;
    taxId: string;
    imgUrl?: string;
  };
  selectedStampId: string;
  items: Item[];
  vatPercentage: number;
  irpfPercentage: number;
};

export type InvoiceFormErrors = Record<string, string>;

export function InvoiceForm(props: {
  values: InvoiceFormValues;
  errors: InvoiceFormErrors;
  stampsList: Stamp[];
  onValuesChange: (patch: Partial<InvoiceFormValues>) => void;
  onItemChange: (index: number, patch: Partial<Item>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitting?: boolean;
  customerSection?: React.ReactNode;
  rightAside?: React.ReactNode; // Totales/acciones u otro panel lateral
}) {
  const {
    values,
    errors,
    stampsList,
    onValuesChange,
    onItemChange,
    onAddItem,
    onRemoveItem,
    onSubmit,
    submitLabel = "Guardar",
    submitting,
    customerSection,
    rightAside,
  } = props;

  const totals = useMemo(() => {
    const taxableBase = values.items.reduce(
      (sum, it) => sum + toNumber(it.price) * (it.quantity || 0),
      0
    );
    const vatAmount = taxableBase * (values.vatPercentage / 100);
    const taxableBasePlusVat = taxableBase + vatAmount;
    const irpfAmount = taxableBase * (values.irpfPercentage / 100);
    const totalAmount = taxableBasePlusVat - irpfAmount;
    return {
      taxableBase,
      vatPercentage: values.vatPercentage,
      vatAmount,
      taxableBasePlusVat,
      irpfPercentage: values.irpfPercentage,
      irpfAmount,
      totalAmount,
    } as Invoice["totals"];
  }, [values.items, values.vatPercentage, values.irpfPercentage]);

  return (
    <>
      {/* Identificación */}
      <div className="rounded p-4 panel text-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="muted block mb-1" htmlFor="invoiceKind">
              Tipo
            </label>
            <select
              id="invoiceKind"
              className="w-full rounded px-3 py-2 panel"
              value={values.invoiceKind}
              onChange={(e) =>
                onValuesChange({
                  invoiceKind: e.target.value as typeof values.invoiceKind,
                })
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
              value={values.invoiceId}
              onChange={(e) => onValuesChange({ invoiceId: e.target.value })}
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
              value={values.invoiceDate}
              onChange={(e) => onValuesChange({ invoiceDate: e.target.value })}
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
              value={values.expirationDate}
              onChange={(e) =>
                onValuesChange({ expirationDate: e.target.value })
              }
            />
          </div>
        </div>

        {values.invoiceKind === "rectificativa" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="muted block mb-1" htmlFor="rectifiedRef">
                Nº factura rectificada
              </label>
              <input
                id="rectifiedRef"
                className="w-full rounded px-3 py-2 panel"
                value={values.rectifiedRef}
                onChange={(e) =>
                  onValuesChange({ rectifiedRef: e.target.value })
                }
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
                value={values.rectifiedDate}
                onChange={(e) =>
                  onValuesChange({ rectifiedDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="muted block mb-1" htmlFor="rectificationReason">
                Motivo de rectificación
              </label>
              <input
                id="rectificationReason"
                className="w-full rounded px-3 py-2 panel"
                value={values.rectificationReason}
                onChange={(e) =>
                  onValuesChange({ rectificationReason: e.target.value })
                }
              />
              {errors.rectificationReason && (
                <div style={{ color: "crimson" }} className="text-xs mt-1">
                  {errors.rectificationReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emisor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Emisor</div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="issuerMode"
                  checked={values.issuerMode === "manual"}
                  onChange={() => onValuesChange({ issuerMode: "manual" })}
                />
                Manual
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="issuerMode"
                  checked={values.issuerMode === "stamp"}
                  onChange={() => onValuesChange({ issuerMode: "stamp" })}
                />
                Seleccionar sello
              </label>
            </div>

            {values.issuerMode === "stamp" ? (
              <div className="space-y-2">
                <div>
                  <label className="muted block mb-1" htmlFor="stampId">
                    Sello
                  </label>
                  <select
                    id="stampId"
                    className="w-full rounded px-3 py-2 panel"
                    value={values.selectedStampId}
                    onChange={(e) => {
                      const val = e.target.value;
                      const s = stampsList.find((x) => x.id === val);
                      onValuesChange({
                        selectedStampId: val,
                        issuer: {
                          name: s?.name || "",
                          companyName: s?.companyName || "",
                          address: s?.address || "",
                          taxId: s?.taxId || "",
                          imgUrl: s?.imgUrl || "",
                        },
                      });
                    }}
                  >
                    <option value="">— Selecciona —</option>
                    {stampsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName || s.name}
                      </option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const s = stampsList.find(
                    (x) => x.id === values.selectedStampId
                  );
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
                    value={values.issuer.name}
                    onChange={(e) =>
                      onValuesChange({
                        issuer: { ...values.issuer, name: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="muted block mb-1" htmlFor="issuerCompany">
                    Razón social
                  </label>
                  <input
                    id="issuerCompany"
                    className="w-full rounded px-3 py-2 panel"
                    value={values.issuer.companyName || ""}
                    onChange={(e) =>
                      onValuesChange({
                        issuer: {
                          ...values.issuer,
                          companyName: e.target.value,
                        },
                      })
                    }
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
                    value={values.issuer.address}
                    onChange={(e) =>
                      onValuesChange({
                        issuer: { ...values.issuer, address: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="muted block mb-1" htmlFor="issuerTaxId">
                    NIF/CIF
                  </label>
                  <input
                    id="issuerTaxId"
                    className="w-full rounded px-3 py-2 panel"
                    value={values.issuer.taxId}
                    onChange={(e) =>
                      onValuesChange({
                        issuer: { ...values.issuer, taxId: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="muted block mb-1" htmlFor="issuerImg">
                    Logo (URL opcional)
                  </label>
                  <input
                    id="issuerImg"
                    className="w-full rounded px-3 py-2 panel"
                    placeholder="https://..."
                    value={values.issuer.imgUrl || ""}
                    onChange={(e) =>
                      onValuesChange({
                        issuer: { ...values.issuer, imgUrl: e.target.value },
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sección de cliente inyectable */}
      {customerSection}

      {/* Items */}
      <div className="rounded p-4 panel text-sm">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="font-semibold">Conceptos</div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              className="rounded px-3 py-2 panel w-full sm:w-auto"
              onClick={onAddItem}
            >
              Añadir línea
            </button>
          </div>
        </div>

        {/* Móvil */}
        <div className="md:hidden space-y-3">
          {values.items.map((it, idx) => {
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
                        onItemChange(idx, { code: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="muted block mb-1">Cantidad</label>
                    <input
                      type="number"
                      min={values.invoiceKind === "rectificativa" ? -999999 : 0}
                      step={1}
                      className="w-full rounded px-2 py-1 panel text-right"
                      value={it.quantity}
                      onChange={(e) =>
                        onItemChange(idx, { quantity: Number(e.target.value) })
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
                        onItemChange(idx, { description: e.target.value })
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
                      min={values.invoiceKind === "rectificativa" ? -999999 : 0}
                      step={0.01}
                      className="w-full rounded px-2 py-1 panel text-right"
                      value={it.price as unknown as number}
                      onChange={(e) =>
                        onItemChange(idx, {
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
                      onClick={() => onRemoveItem(idx)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabla md+ */}
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
              {values.items.map((it, idx) => {
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
                          onItemChange(idx, { code: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        rows={2}
                        className="w-full rounded px-2 py-1 panel"
                        value={it.description}
                        onChange={(e) =>
                          onItemChange(idx, { description: e.target.value })
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
                        min={
                          values.invoiceKind === "rectificativa" ? -999999 : 0
                        }
                        step={1}
                        className="w-24 rounded px-2 py-1 panel text-right"
                        value={it.quantity}
                        onChange={(e) =>
                          onItemChange(idx, {
                            quantity: Number(e.target.value),
                          })
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
                        min={
                          values.invoiceKind === "rectificativa" ? -999999 : 0
                        }
                        step={0.01}
                        className="w-28 rounded px-2 py-1 panel text-right"
                        value={it.price as unknown as number}
                        onChange={(e) =>
                          onItemChange(idx, {
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
                        onClick={() => onRemoveItem(idx)}
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

      {/* Totales/Acciones o panel lateral personalizado */}
      {rightAside || (
        <div className="rounded p-4 panel text-sm w-full lg:w-[420px]">
          <div className="font-semibold mb-2">Impuestos</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="muted block mb-1" htmlFor="vat">
                IVA (%)
              </label>
              <input
                id="vat"
                type="number"
                step={0.1}
                className="w-full rounded px-3 py-2 panel"
                value={values.vatPercentage}
                onChange={(e) =>
                  onValuesChange({ vatPercentage: Number(e.target.value) })
                }
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
                value={values.irpfPercentage}
                onChange={(e) =>
                  onValuesChange({ irpfPercentage: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="font-semibold mb-2">Totales</div>
          <div className="flex justify-between py-1">
            <span className="muted">Base imponible</span>
            <span>{formatCurrency(totals.taxableBase)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="muted">IVA ({totals.vatPercentage}%)</span>
            <span>{formatCurrency(totals.vatAmount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="muted">Base + IVA</span>
            <span>{formatCurrency(totals.taxableBasePlusVat)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="muted">IRPF ({totals.irpfPercentage}%)</span>
            <span>-{formatCurrency(totals.irpfAmount)}</span>
          </div>
          <div className="border-t border-[var(--panel-border)] my-2" />
          <div className="flex justify-between py-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totals.totalAmount)}</span>
          </div>
          <div className="flex gap-2 pt-3">
            <button
              className="rounded px-3 py-2 panel"
              disabled={submitting}
              onClick={onSubmit}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default InvoiceForm;
