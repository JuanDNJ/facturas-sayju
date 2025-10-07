import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Customer } from "../types/invoice.types";
import { useAuth } from "../hooks/useAuth";
import { addCustomer } from "../apis/customers";
import { isValidDNI, isValidEmail } from "../utils/validators";
import DniHelp from "../components/DniHelp";

const empty: Customer = {
  name: "",
  address: "",
  taxId: "",
  email: "",
  phone: "",
};

export default function NewClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [draft, setDraft] = useState<Customer>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (d: Customer) => {
    const e: Record<string, string> = {};
    if (!d.name?.trim()) e.name = "Requerido";
    if (!d.address?.trim()) e.address = "Requerido";
    if (!d.taxId?.trim()) e.taxId = "Requerido";
    else if (!isValidDNI(d.taxId)) e.taxId = "DNI no válido";
    if (d.email && !isValidEmail(d.email)) e.email = "Email no válido";
    return e;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
        <Link to="/clientes" className="rounded px-3 py-2 panel">
          Volver
        </Link>
      </div>

      <div className="rounded p-4 panel text-sm space-y-3">
        <div>
          <label htmlFor="name" className="muted block mb-1">
            Nombre / Razón social
          </label>
          <input
            id="name"
            className="w-full rounded px-3 py-2 panel"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          {errors.name && (
            <div style={{ color: "crimson" }} className="text-xs mt-1">
              {errors.name}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="address" className="muted block mb-1">
            Dirección
          </label>
          <textarea
            id="address"
            rows={2}
            className="w-full rounded px-3 py-2 panel"
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
          />
          {errors.address && (
            <div style={{ color: "crimson" }} className="text-xs mt-1">
              {errors.address}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="taxId" className="muted block mb-1">
              DNI
            </label>
            <input
              id="taxId"
              className="w-full rounded px-3 py-2 panel"
              placeholder="77777777A o X1234567L"
              value={draft.taxId}
              onChange={(e) => setDraft({ ...draft, taxId: e.target.value })}
              aria-describedby="dni-help"
            />
            <DniHelp id="dni-help" />
            {errors.taxId && (
              <div style={{ color: "crimson" }} className="text-xs mt-1">
                {errors.taxId}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="email" className="muted block mb-1">
              Email (opcional)
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded px-3 py-2 panel"
              value={draft.email ?? ""}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            {errors.email && (
              <div style={{ color: "crimson" }} className="text-xs mt-1">
                {errors.email}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="muted block mb-1">
              Teléfono (opcional)
            </label>
            <input
              id="phone"
              className="w-full rounded px-3 py-2 panel"
              value={draft.phone ?? ""}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            className="rounded px-3 py-2 panel"
            disabled={saving}
            onClick={async () => {
              const e = validate(draft);
              setErrors(e);
              if (Object.keys(e).length === 0 && user) {
                try {
                  setSaving(true);
                  await addCustomer(user.uid, draft);
                  navigate("/clientes", {
                    replace: true,
                    state: { toast: "Cliente creado" },
                  });
                } catch (err) {
                  // opcionalmente mostrar toast
                  console.error(err);
                } finally {
                  setSaving(false);
                }
              }
            }}
          >
            Guardar
          </button>
          <button
            className="rounded px-3 py-2 panel"
            onClick={() => navigate("/clientes")}
          >
            Cancelar
          </button>
        </div>

        {saving && <p className="muted text-xs">Guardando…</p>}
      </div>
    </section>
  );
}
