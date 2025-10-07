import { useState } from "react";
import { addSuggestion } from "../apis/suggestions";
import { useAuth } from "../hooks/useAuth";

export default function Suggestions() {
  const { user } = useAuth();
  const [category, setCategory] = useState<
    "mejora" | "error" | "necesidad" | "otro"
  >("mejora");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setErr(null);
    if (!user) {
      setErr("Debes iniciar sesión para enviar sugerencias.");
      return;
    }
    if (!message.trim()) {
      setErr("El mensaje es obligatorio.");
      return;
    }
    setSending(true);
    try {
      await addSuggestion({
        category,
        title: title.trim() || undefined,
        message: message.trim(),
        userId: user.uid,
        userDisplay: user.displayName || undefined,
        userEmail: user.email || undefined,
      });
      setOk("¡Gracias! Hemos registrado tu sugerencia.");
      setTitle("");
      setMessage("");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "No se pudo enviar la sugerencia.";
      setErr(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Sugerencias</h1>
      <form className="max-w-xl space-y-3" onSubmit={onSubmit}>
        {ok && <div className="text-green-600 text-sm">{ok}</div>}
        {err && <div className="text-danger text-sm">{err}</div>}
        <div>
          <label className="muted block mb-1" htmlFor="category">
            Categoría
          </label>
          <select
            id="category"
            className="w-full rounded px-3 py-2 panel"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
          >
            <option value="mejora">Mejora</option>
            <option value="necesidad">Necesidad</option>
            <option value="error">Error</option>
            <option value="otro">Otra</option>
          </select>
        </div>
        <div>
          <label className="muted block mb-1" htmlFor="title">
            Título (opcional)
          </label>
          <input
            id="title"
            className="w-full rounded px-3 py-2 panel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="muted block mb-1" htmlFor="message">
            Mensaje
          </label>
          <textarea
            id="message"
            rows={5}
            className="w-full rounded px-3 py-2 panel"
            placeholder="Describe tu sugerencia o necesidad..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" disabled={sending}>
            {sending ? "Enviando..." : "Enviar"}
          </button>
          <button
            type="reset"
            className="btn btn-ghost"
            onClick={() => {
              setTitle("");
              setMessage("");
              setErr(null);
              setOk(null);
            }}
          >
            Limpiar
          </button>
        </div>
      </form>
    </section>
  );
}
