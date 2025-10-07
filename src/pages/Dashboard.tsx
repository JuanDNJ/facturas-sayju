export default function Dashboard() {
  return (
    <section>
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
    </section>
  );
}
