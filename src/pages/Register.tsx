import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../apis/auth";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Nombre, email y contraseña (mín. 6) son requeridos");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await registerUser({ name: name.trim(), email: email.trim(), password });
      // Redirigir al siguiente paso con mensaje de bienvenida
      navigate("/registro/datos", {
        state: { fromRegister: true, welcome: `Bienvenido, ${name.trim()}` },
        replace: true,
      });
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "message" in err
          ? String(
              (err as { message?: unknown }).message || "Error al registrar"
            )
          : "Error al registrar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <section className="rounded p-4 panel w-full max-w-md">
        <h1 className="text-xl font-semibold mb-3 text-center">Registro</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm muted">Nombre</label>
            <input
              className="mt-1 w-full rounded px-3 py-2 panel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="text-sm muted">Email</label>
            <input
              className="mt-1 w-full rounded px-3 py-2 panel"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="text-sm muted">Contraseña</label>
            <input
              className="mt-1 w-full rounded px-3 py-2 panel"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="text-sm muted">Repetir contraseña</label>
            <input
              className="mt-1 w-full rounded px-3 py-2 panel"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Vuelve a escribir la contraseña"
            />
            {password && confirmPassword && password !== confirmPassword && (
              <div className="text-xs mt-1" style={{ color: "crimson" }}>
                Las contraseñas no coinciden
              </div>
            )}
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

          <button
            className="w-full rounded px-3 py-2 panel"
            type="submit"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </button>
          <div className="text-xs mt-2 text-center">
            <span className="muted">¿Ya tienes cuenta? </span>
            <Link to="/login" className="underline hover:opacity-80">
              Iniciar sesión
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
