import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ToastProvider } from './context/ToastContext'
import Spinner from './components/ui/Spinner'
import Layout from './components/layout/Layout'
import RequireAuth from './components/routing/RequireAuth'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Settings = lazy(() => import('./pages/Settings'))
const Clients = lazy(() => import('./pages/Clients'))
const Stamps = lazy(() => import('./pages/Stamps'))
const StampView = lazy(() => import('./pages/StampView'))
const InvoiceView = lazy(() => import('./pages/InvoiceView'))
const ClientView = lazy(() => import('./pages/ClientView'))
const NewClient = lazy(() => import('./pages/NewClient'))
const NewInvoice = lazy(() => import('./pages/NewInvoice'))
const EditInvoice = lazy(() => import('./pages/EditInvoice'))
const Register = lazy(() => import('./pages/Register'))
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'))
const Login = lazy(() => import('./pages/Login'))
const Suggestions = lazy(() => import('./pages/Suggestions'))

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<Spinner className="p-4" />}>
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
                <Route path="invoices/:id/edit" element={<EditInvoice />} />
                <Route path="invoices/:id" element={<InvoiceView />} />
                <Route path="clientes/:id" element={<ClientView />} />
                <Route path="clientes/nuevo" element={<NewClient />} />
                {/* Ruta antigua de ejemplo 'factura' ya no es necesaria */}
                <Route path="clientes" element={<Clients />} />
                <Route path="sellos" element={<Stamps />} />
                <Route path="sellos/:id" element={<StampView />} />
                <Route path="sugerencias" element={<Suggestions />} />
                <Route path="settings" element={<Settings />} />
                <Route path="registro/datos" element={<CompleteProfile />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
