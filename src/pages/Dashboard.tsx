import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <section>
      <div className="rounded p-3 mb-4 panel flex items-center gap-2">
        <span aria-hidden>🚧</span>
        <span className="muted text-sm">
          Esta página está en construcción. Las métricas son ficticias y están
          sujetas a cambios.
        </span>
      </div>
      <div className="rounded p-3 mb-4 panel flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden>💡</span>
          <div>
            <div className="font-medium">
              ¿Tienes ideas, necesidades o detectaste un error?
            </div>
            <div className="muted text-sm">
              Puedes sugerir cualquier cosa y ayudarnos a mejorar.
            </div>
          </div>
        </div>
        <Link
          to="/sugerencias"
          className="rounded px-3 py-2 panel text-sm whitespace-nowrap"
        >
          Enviar sugerencia
        </Link>
      </div>
      <h1 className="text-2xl font-semibold mb-4">Resumen</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded p-4 panel">
          <div className="text-sm muted">Facturas del mes</div>
          <div className="text-3xl font-bold">24</div>
        </div>
        <div className="rounded p-4 panel">
          <div className="text-sm muted">Importe total</div>
          <div className="text-3xl font-bold">$ 12,450.00</div>
        </div>
        <div className="rounded p-4 panel">
          <div className="text-sm muted">Pendientes</div>
          <div className="text-3xl font-bold">5</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Secciones rápidas</h2>
      <div className="grid gap-4 md:grid-cols-12">
        {/* Facturas - bloque principal */}
        <div className="relative rounded p-4 panel md:col-span-7 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">
              🧾
            </span>
            <div>
              <div className="text-lg font-semibold">Facturas</div>
              <p className="muted text-sm">
                Crea, gestiona y revisa el estado de tus facturas.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link to="/invoices" className="rounded px-3 py-2 panel text-sm">
              Ir a facturas
            </Link>
            <span className="muted text-xs">
              Borradores, enviadas, pendientes
            </span>
          </div>
          <div
            className="absolute right-3 bottom-2 text-6xl select-none pointer-events-none"
            style={{ opacity: 0.12 }}
            aria-hidden
          >
            🧾
          </div>
        </div>

        {/* Clientes */}
        <div className="relative rounded p-4 panel md:col-span-5 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">
              👥
            </span>
            <div>
              <div className="text-lg font-semibold">Clientes</div>
              <p className="muted text-sm">
                Gestiona tu cartera de clientes y sus datos.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link to="/clientes" className="rounded px-3 py-2 panel text-sm">
              Ir a clientes
            </Link>
            <span className="muted text-xs">Altas, edición, historial</span>
          </div>
          <div
            className="absolute right-3 bottom-2 text-6xl select-none pointer-events-none"
            style={{ opacity: 0.12 }}
            aria-hidden
          >
            👥
          </div>
        </div>

        {/* Sugerencias */}
        <div className="relative rounded p-4 panel md:col-span-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">
              💬
            </span>
            <div>
              <div className="text-lg font-semibold">Sugerencias</div>
              <p className="muted text-sm">
                Cuéntanos qué mejorar o qué necesitas.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link to="/sugerencias" className="rounded px-3 py-2 panel text-sm">
              Enviar sugerencia
            </Link>
            <span className="muted text-xs">Gracias por tu feedback</span>
          </div>
          <div
            className="absolute right-3 bottom-2 text-6xl select-none pointer-events-none"
            style={{ opacity: 0.12 }}
            aria-hidden
          >
            💬
          </div>
        </div>

        {/* Sellos */}
        <div className="relative rounded p-4 panel md:col-span-4 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">
              🏷️
            </span>
            <div>
              <div className="text-lg font-semibold">Sellos</div>
              <p className="muted text-sm">
                Crea y reutiliza textos frecuentes en facturas.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link to="/sellos" className="rounded px-3 py-2 panel text-sm">
              Ir a sellos
            </Link>
          </div>
          <div
            className="absolute right-3 bottom-2 text-6xl select-none pointer-events-none"
            style={{ opacity: 0.12 }}
            aria-hidden
          >
            🏷️
          </div>
        </div>

        {/* Ajustes */}
        <div className="relative rounded p-4 panel md:col-span-3 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">
              ⚙️
            </span>
            <div>
              <div className="text-lg font-semibold">Ajustes</div>
              <p className="muted text-sm">
                Configura tu perfil y preferencias.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link to="/settings" className="rounded px-3 py-2 panel text-sm">
              Ir a ajustes
            </Link>
          </div>
          <div
            className="absolute right-3 bottom-2 text-6xl select-none pointer-events-none"
            style={{ opacity: 0.12 }}
            aria-hidden
          >
            ⚙️
          </div>
        </div>
      </div>
    </section>
  );
}
