import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/layout/Layout";
import RequireAuth from "./components/routing/RequireAuth";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Settings from "./pages/Settings";
import Clients from "./pages/Clients";
import Stamps from "./pages/Stamps";
import InvoiceView from "./pages/InvoiceView";
import ClientView from "./pages/ClientView";
import NewClient from "./pages/NewClient";
import NewInvoice from "./pages/NewInvoice";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import Login from "./pages/Login";
import Suggestions from "./pages/Suggestions";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Públicas */}
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Register />} />

          {/* Protegidas */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<NewInvoice />} />
              <Route path="invoices/:id" element={<InvoiceView />} />
              <Route path="clientes/:id" element={<ClientView />} />
              <Route path="clientes/nuevo" element={<NewClient />} />
              {/* Ruta antigua de ejemplo 'factura' ya no es necesaria */}
              <Route path="clientes" element={<Clients />} />
              <Route path="sellos" element={<Stamps />} />
              <Route path="sugerencias" element={<Suggestions />} />
              <Route path="settings" element={<Settings />} />
              <Route path="registro/datos" element={<CompleteProfile />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
