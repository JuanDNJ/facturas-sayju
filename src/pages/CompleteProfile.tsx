import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getUserProfile, saveUserProfile } from "../apis/user";
import { isValidEmail, isValidDNI } from "../utils/validators";
import DniHelp from "../components/DniHelp";
import type { User as AppUser } from "../types/user.type";

export default function CompleteProfile() {
  const location = useLocation();
  const welcome = useMemo(() => {
    const state = (location.state || {}) as {
      fromRegister?: boolean;
      welcome?: string;
    };
    return state.fromRegister ? state.welcome || "Bienvenido" : null;
  }, [location.state]);
  const auth = getAuth();
  const current = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<AppUser>>({
    address: "",
    companyName: "",
    zipcode: "",
    displayName: current?.displayName || "",
    email: current?.email || "",
    nifDni: "",
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!current?.uid) {
        setLoading(false);
        return;
      }
      try {
        const data = await getUserProfile(current.uid);
        if (mounted && data) {
          setForm((f) => ({
            ...f,
            ...(data as Partial<AppUser>),
          }));
        }
      } catch {
        // no-op
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [current?.uid]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.address?.trim() || !form.nifDni?.trim()) {
      setError("Dirección y DNI son requeridos");
      return;
    }
    if (form.nifDni && !isValidDNI(form.nifDni)) {
      setError("DNI no válido");
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      setError("Email no válido");
      return;
    }
    if (!current?.uid) {
      setError("No hay usuario autenticado");
      return;
    }
    try {
      await saveUserProfile(current.uid, {
        address: form.address,
        companyName: form.companyName || undefined,
        zipcode: form.zipcode || undefined,
        displayName: form.displayName || current.displayName || "",
        email: form.email || current.email || "",
        nifDni: form.nifDni,
      });
      setSuccess("Datos guardados correctamente");
    } catch {
      setError("Error al guardar datos");
    }
  };

  if (loading) {
    return <div className="rounded p-4 panel">Cargando…</div>;
  }

  return (
    <section className="rounded p-4 panel max-w-xl">
      <h1 className="text-xl font-semibold mb-3">Datos adicionales</h1>
      {welcome && (
        <div className="mb-3 text-sm" style={{ color: "seagreen" }}>
          {welcome}
        </div>
      )}
      <form onSubmit={onSave} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm muted">Nombre</label>
            <input
              className="mt-1 w-full rounded px-3 py-2 panel"
              value={form.displayName || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, displayName: e.target.value }))
              }
              placeholder="Nombre para mostrar"
            />
          </div>
          <div>
            <label className="text-sm muted">Email</label>
            <input
              className="mt-1 w-full rounded px-3 py-2 panel"
              type="email"
              value={form.email || ""}
              onChange={(e) =>
                setForm((f) => {
                  const v = e.target.value;
                  // Si el error general era de email y el usuario escribe, lo limpiamos
                  if (error === "Email no válido") setError(null);
                  return { ...f, email: v };
                })
              }
              placeholder="email@ejemplo.com"
            />
            {error === "Email no válido" && (
              <div className="text-xs mt-1" style={{ color: "crimson" }}>
                Email no válido
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm muted">Dirección</label>
          <input
            className="mt-1 w-full rounded px-3 py-2 panel"
            value={form.address || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            placeholder="Calle y número"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm muted">DNI</label>
            <input
              className="mt-1 w-full rounded px-3 py-2 panel"
              value={form.nifDni || ""}
              onChange={(e) =>
                setForm((f) => {
                  const v = e.target.value;
                  if (error === "DNI no válido") setError(null);
                  return { ...f, nifDni: v };
                })
              }
              placeholder="77777777A o X1234567L"
              aria-describedby="profile-dni-help"
            />
            <DniHelp id="profile-dni-help" />
            {error === "DNI no válido" && (
              <div className="text-xs mt-1" style={{ color: "crimson" }}>
                DNI no válido
              </div>
            )}
          </div>
          <div>
            <label className="text-sm muted">Código postal (opcional)</label>
            <input
              className="mt-1 w-full rounded px-3 py-2 panel"
              value={form.zipcode || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, zipcode: e.target.value }))
              }
              placeholder="28001"
            />
          </div>
        </div>

        <div>
          <label className="text-sm muted">Razón social (opcional)</label>
          <input
            className="mt-1 w-full rounded px-3 py-2 panel"
            value={form.companyName || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyName: e.target.value }))
            }
            placeholder="Mi Empresa S.L."
          />
        </div>

        {error && (
          <div className="text-sm" style={{ color: "crimson" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm" style={{ color: "seagreen" }}>
            {success}
          </div>
        )}

        <button className="rounded px-3 py-2 panel" type="submit">
          Guardar
        </button>
      </form>
    </section>
  );
}
