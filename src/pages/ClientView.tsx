import { useEffect, useState } from "react";
import {
  useParams,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import type { Customer } from "../types/invoice.types";
import { useAuth } from "../hooks/useAuth";
import { getCustomer, updateCustomer, removeCustomer } from "../apis/customers";
import { isValidDNI, isValidEmail } from "../utils/validators";
import DniHelp from "../components/DniHelp";
import { useToast } from "../hooks/useToast";

export default function ClientView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldEdit = searchParams.get("edit") === "1";

  const [current, setCurrent] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user || !id) return;
      setLoading(true);
      try {
        const c = await getCustomer(user.uid, id);
        if (!active) return;
        if (c) {
          setCurrent(c);
          setDraft(c);
          setEditing(shouldEdit);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [user, id, shouldEdit]);

  const validate = (d: Customer) => {
    const e: Record<string, string> = {};
    if (!d.name?.trim()) e.name = "Requerido";
    if (!d.address?.trim()) e.address = "Requerido";
    if (!d.taxId?.trim()) e.taxId = "Requerido";
    else if (!isValidDNI(d.taxId)) e.taxId = "DNI no válido";
    if (d.email && !isValidEmail(d.email)) e.email = "Email no válido";
    return e;
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="rounded p-4 panel">Cargando cliente…</div>
      </section>
    );
  }

  if (!current) {
    return (
      <section className="space-y-4">
        <div className="rounded p-4 panel">
          <div className="font-semibold mb-2">Cliente no encontrado</div>
          <Link className="underline" to="/clientes">
            Volver a clientes
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cliente</h1>
        <div className="flex items-center gap-2">
          <Link className="btn btn-ghost" to="/clientes">
            Volver
          </Link>
          {!editing && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditing(true)}
            >
              Editar
            </button>
          )}
          {!editing && current?.id && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                if (!user || !current?.id) return;
                const ok = window.confirm(
                  `¿Eliminar cliente "${current.name}"? Esta acción no se puede deshacer.`
                );
                if (!ok) return;
                try {
                  await removeCustomer(user.uid, current.id);
                  navigate("/clientes", {
                    replace: true,
                    state: { toast: "Cliente eliminado" },
                  });
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              Borrar
            </button>
          )}
        </div>
      </div>

      <div className="rounded p-4 panel">
        <div className="space-y-2 text-sm">
          <div>
            <span className="muted">Nombre / Razón social: </span>
            <span className="font-medium text-[var(--text)]">
              {current?.name}
            </span>
          </div>
          <div>
            <span className="muted">Dirección: </span>
            <span>{current?.address}</span>
          </div>
          <div>
            <span className="muted">DNI: </span>
            <span>{current?.taxId}</span>
          </div>
          {(current?.email || current?.phone) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {current?.email && (
                <div>
                  <span className="muted">Email: </span>
                  <span>{current.email}</span>
                </div>
              )}
              {current?.phone && (
                <div>
                  <span className="muted">Teléfono: </span>
                  <span>{current.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && draft && (
        <div className="rounded p-4 panel">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Editar cliente</div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDraft(current!);
                  setErrors({});
                  setEditing(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={async () => {
                  if (!user || !current?.id) return;
                  const d = { ...draft, id: current?.id } as Customer;
                  const e = validate(d);
                  setErrors(e);
                  if (Object.keys(e).length === 0) {
                    try {
                      setSaving(true);
                      await updateCustomer(user.uid, current.id!, d);
                      setCurrent(d);
                      setEditing(false);
                      show("Cliente guardado", { type: "success" });
                    } catch (err) {
                      console.error(err);
                      show("Error al guardar", { type: "error" });
                    } finally {
                      setSaving(false);
                    }
                  }
                }}
              >
                Guardar
              </button>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <label className="muted block mb-1" htmlFor="name">
                Nombre / Razón social
              </label>
              <input
                id="name"
                className="w-full rounded px-3 py-2 panel"
                value={draft.name}
                onChange={(e) =>
                  setDraft({ ...(draft as Customer), name: e.target.value })
                }
              />
              {errors.name && (
                <div style={{ color: "crimson" }} className="text-xs mt-1">
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <label className="muted block mb-1" htmlFor="address">
                Dirección
              </label>
              <textarea
                id="address"
                rows={2}
                className="w-full rounded px-3 py-2 panel"
                value={draft.address}
                onChange={(e) =>
                  setDraft({ ...(draft as Customer), address: e.target.value })
                }
              />
              {errors.address && (
                <div style={{ color: "crimson" }} className="text-xs mt-1">
                  {errors.address}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="muted block mb-1" htmlFor="taxId">
                  DNI
                </label>
                <input
                  id="taxId"
                  className="w-full rounded px-3 py-2 panel"
                  value={draft.taxId}
                  onChange={(e) =>
                    setDraft({ ...(draft as Customer), taxId: e.target.value })
                  }
                  placeholder="77777777A o X1234567L"
                  aria-describedby="cv-dni-help"
                />
                <DniHelp id="cv-dni-help" />
                {errors.taxId && (
                  <div style={{ color: "crimson" }} className="text-xs mt-1">
                    {errors.taxId}
                  </div>
                )}
              </div>
              <div>
                <label className="muted block mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded px-3 py-2 panel"
                  value={draft.email ?? ""}
                  onChange={(e) =>
                    setDraft({ ...(draft as Customer), email: e.target.value })
                  }
                />
                {errors.email && (
                  <div style={{ color: "crimson" }} className="text-xs mt-1">
                    {errors.email}
                  </div>
                )}
              </div>
              <div>
                <label className="muted block mb-1" htmlFor="phone">
                  Teléfono
                </label>
                <input
                  id="phone"
                  className="w-full rounded px-3 py-2 panel"
                  value={draft.phone ?? ""}
                  onChange={(e) =>
                    setDraft({ ...(draft as Customer), phone: e.target.value })
                  }
                />
              </div>
            </div>

            {saving && <p className="muted text-xs pt-1">Guardando…</p>}
          </div>
        </div>
      )}

      {/* Toasts globales renderizados por ToastProvider */}
    </section>
  );
}
