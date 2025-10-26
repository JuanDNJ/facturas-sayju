import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getInvoices } from '../apis/invoices'
import SuggestionsIcon from '../components/icons/SuggestionsIcon'
import Icon from '../components/atomic/atoms/Icon'
import ClientsIcon from '../components/icons/ClienstIcon'
import InvoicesIcon from '../components/icons/InvoicesIcon'
import CompanySealIcons from '../components/icons/CompanySealIcons'
import SettingsIcon from '../components/icons/SettingsIcon'
import SummaryBookIcon from '../components/icons/SummaryBookIcon'

interface MonthlyMetrics {
  totalInvoices: number
  totalAmount: number
  paidInvoices: number
  paidAmount: number
  pendingInvoices: number
  pendingAmount: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [alertSystem, setAlertSystem] = useState<boolean | undefined>(undefined)

  const toggleAlertSystem = () => {
    const newValue = !alertSystem
    globalThis?.localStorage?.setItem('viewedAlerts', `${newValue}`)
    setAlertSystem(newValue)
  }

  useEffect(() => {
    setAlertSystem(() => globalThis?.localStorage?.getItem('viewedAlerts') === 'true')
  }, [])

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Obtener facturas del mes actual
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const page = await getInvoices(user.uid, {
          fromDate: startOfMonth,
          toDate: endOfMonth,
          pageSize: 100, // Suficiente para la mayoría de usuarios
        })

        const invoices = page.items
        const totalInvoices = invoices.length
        const totalAmount = invoices.reduce((sum, inv) => sum + (inv.totals?.totalAmount || 0), 0)

        const paidInvoices = invoices.filter((inv) => (inv.status || 'pending') === 'paid')
        const paidAmount = paidInvoices.reduce(
          (sum, inv) => sum + (inv.totals?.totalAmount || 0),
          0
        )

        const pendingInvoices = invoices.filter((inv) => (inv.status || 'pending') === 'pending')
        const pendingAmount = pendingInvoices.reduce(
          (sum, inv) => sum + (inv.totals?.totalAmount || 0),
          0
        )

        setMetrics({
          totalInvoices,
          totalAmount,
          paidInvoices: paidInvoices.length,
          paidAmount,
          pendingInvoices: pendingInvoices.length,
          pendingAmount,
        })
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [user])
  return (
    <section>
      {/* NOTIFICACIONES */}

      <article className="mb-4 grid items-center gap-12 rounded py-3 md:grid-cols-2 md:justify-between">
        <aside className="flex justify-end md:col-span-2">
          <button
            onClick={toggleAlertSystem}
            className="inline-flex items-center gap-2"
            title="Abrir Notificaciones"
          >
            {alertSystem && (
              <div className="flex items-center gap-2">
                <i className="w-6 sm:w-8">
                  <svg
                    fill="#000000"
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    id="notification-bell"
                    data-name="Flat Line"
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon flat-line"
                  >
                    <path
                      id="secondary"
                      d="M19.38,14.38a2.12,2.12,0,0,1,.62,1.5h0A2.12,2.12,0,0,1,17.88,18H6.12A2.12,2.12,0,0,1,4,15.88H4a2.12,2.12,0,0,1,.62-1.5L6,13V9a6,6,0,0,1,6-6h0a6,6,0,0,1,6,6v4Z"
                      style={{
                        fill: 'red',
                        strokeWidth: 2,
                      }}
                    ></path>
                    <path
                      id="primary"
                      d="M12,21h0a3,3,0,0,1-3-3h6A3,3,0,0,1,12,21Zm6-8V9a6,6,0,0,0-6-6h0A6,6,0,0,0,6,9v4L4.62,14.38A2.12,2.12,0,0,0,4,15.88H4A2.12,2.12,0,0,0,6.12,18H17.88A2.12,2.12,0,0,0,20,15.88h0a2.12,2.12,0,0,0-.62-1.5Z"
                      style={{
                        fill: 'none',
                        stroke: 'rgb(0, 0, 0)',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                      }}
                    ></path>
                  </svg>
                </i>
                <small>Cerrar</small>
              </div>
            )}
            {!alertSystem && (
              <div className="flex items-center gap-2">
                <i className="w-6 sm:w-8">
                  <svg
                    fill="#000000"
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    id="notification-bell"
                    data-name="Flat Line"
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon flat-line"
                  >
                    <path
                      id="secondary"
                      d="M19.38,14.38a2.12,2.12,0,0,1,.62,1.5h0A2.12,2.12,0,0,1,17.88,18H6.12A2.12,2.12,0,0,1,4,15.88H4a2.12,2.12,0,0,1,.62-1.5L6,13V9a6,6,0,0,1,6-6h0a6,6,0,0,1,6,6v4Z"
                      style={{
                        fill: 'rgb(44, 169, 188)',
                        strokeWidth: 2,
                      }}
                    ></path>
                    <path
                      id="primary"
                      d="M12,21h0a3,3,0,0,1-3-3h6A3,3,0,0,1,12,21Zm6-8V9a6,6,0,0,0-6-6h0A6,6,0,0,0,6,9v4L4.62,14.38A2.12,2.12,0,0,0,4,15.88H4A2.12,2.12,0,0,0,6.12,18H17.88A2.12,2.12,0,0,0,20,15.88h0a2.12,2.12,0,0,0-.62-1.5Z"
                      style={{
                        fill: 'none',
                        stroke: 'rgb(0, 0, 0)',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                      }}
                    ></path>
                  </svg>
                </i>
                <small>Abrir</small>
              </div>
            )}
          </button>
        </aside>
        {alertSystem && (
          <>
            <section className="text-under-construction h-full flex-wrap gap-2 border border-red-400 bg-amber-50 p-3">
              <section className="flex flex-row">
                <article className="flex items-center justify-center gap-2 p-3">
                  <span aria-hidden className="max-w-14 min-w-12">
                    <svg
                      fill="currentColor"
                      height="100%"
                      width="100%"
                      version="1.1"
                      id="Capa_1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="-4.92 -4.92 42.65 42.65"
                      stroke="#F3EDD7"
                      strokeWidth="0.00032811000000000006"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0" />

                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="#050505"
                        strokeWidth="5.381003999999999"
                      >
                        {' '}
                        <g>
                          {' '}
                          <path d="M0,1.356v16.743h5.249v7.154v3.617v2.586h3.61v-2.586h15.423v2.586h3.606V18.098h4.923V1.356H0z M31.136,2.281 l-7.764,14.658h-4.783l7.762-14.658C26.351,2.281,31.136,2.281,31.136,2.281z M23.016,2.245l-7.766,14.66h-4.785l7.767-14.66 C18.232,2.245,23.016,2.245,23.016,2.245z M1.31,2.429l5.617-0.017L1.281,12.99L1.31,2.429z M7.468,17.06H2.684l7.763-14.658h4.785 L7.468,17.06z M24.282,25.252H8.859v-7.154h15.423C24.282,18.098,24.282,25.252,24.282,25.252z M32.149,16.811l-5.616-0.006 l5.646-10.576L32.149,16.811z" />{' '}
                          <path d="M0,1.356v16.743h5.249v7.154v3.617v2.586h3.61v-2.586h15.423v2.586h3.606V18.098h4.923V1.356H0z M31.136,2.281 l-7.764,14.658h-4.783l7.762-14.658C26.351,2.281,31.136,2.281,31.136,2.281z M23.016,2.245l-7.766,14.66h-4.785l7.767-14.66 C18.232,2.245,23.016,2.245,23.016,2.245z M1.31,2.429l5.617-0.017L1.281,12.99L1.31,2.429z M7.468,17.06H2.684l7.763-14.658h4.785 L7.468,17.06z M24.282,25.252H8.859v-7.154h15.423C24.282,18.098,24.282,25.252,24.282,25.252z M32.149,16.811l-5.616-0.006 l5.646-10.576L32.149,16.811z" />{' '}
                          <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{' '}
                          <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{' '}
                        </g>{' '}
                      </g>

                      <g id="SVGRepo_iconCarrier">
                        {' '}
                        <g>
                          {' '}
                          <path d="M0,1.356v16.743h5.249v7.154v3.617v2.586h3.61v-2.586h15.423v2.586h3.606V18.098h4.923V1.356H0z M31.136,2.281 l-7.764,14.658h-4.783l7.762-14.658C26.351,2.281,31.136,2.281,31.136,2.281z M23.016,2.245l-7.766,14.66h-4.785l7.767-14.66 C18.232,2.245,23.016,2.245,23.016,2.245z M1.31,2.429l5.617-0.017L1.281,12.99L1.31,2.429z M7.468,17.06H2.684l7.763-14.658h4.785 L7.468,17.06z M24.282,25.252H8.859v-7.154h15.423C24.282,18.098,24.282,25.252,24.282,25.252z M32.149,16.811l-5.616-0.006 l5.646-10.576L32.149,16.811z" />{' '}
                          <path d="M0,1.356v16.743h5.249v7.154v3.617v2.586h3.61v-2.586h15.423v2.586h3.606V18.098h4.923V1.356H0z M31.136,2.281 l-7.764,14.658h-4.783l7.762-14.658C26.351,2.281,31.136,2.281,31.136,2.281z M23.016,2.245l-7.766,14.66h-4.785l7.767-14.66 C18.232,2.245,23.016,2.245,23.016,2.245z M1.31,2.429l5.617-0.017L1.281,12.99L1.31,2.429z M7.468,17.06H2.684l7.763-14.658h4.785 L7.468,17.06z M24.282,25.252H8.859v-7.154h15.423C24.282,18.098,24.282,25.252,24.282,25.252z M32.149,16.811l-5.616-0.006 l5.646-10.576L32.149,16.811z" />{' '}
                          <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{' '}
                          <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{' '}
                        </g>{' '}
                      </g>
                    </svg>
                  </span>
                </article>
                <article className="flex flex-1 items-center justify-center gap-2 p-3">
                  <span className="text-primary font-weight-black text-xs sm:text-xl">
                    Esta página está en construcción. Las métricas son ficticias y están sujetas a
                    cambios.
                  </span>
                </article>
              </section>
            </section>
            <section className="border-under-construction flex h-full flex-col justify-between gap-3 rounded border bg-amber-50 p-3 sm:flex-1 sm:flex-row">
              <article className="mb-2 flex flex-col items-center gap-1 sm:items-start">
                <span className="text-dark p-2 text-sm font-medium md:text-xl">
                  ¿Tienes ideas, necesidades o detectaste un error?
                </span>
                <small className="text-dark p-2 text-xs font-bold sm:text-sm">
                  Puedes sugerir cualquier cosa y ayudarnos a mejorar.
                </small>
              </article>
              <aside className="text-dark flex items-center justify-around p-2 sm:justify-end sm:gap-2">
                <span aria-hidden className="w-10">
                  <svg
                    fill="currentColor"
                    width="100%"
                    height="100%"
                    viewBox="-3.2 -3.2 38.40 38.40"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="black"
                    strokeWidth="0.00032"
                  >
                    <g
                      id="SVGRepo_bgCarrier"
                      strokeWidth="0"
                      transform="translate(6.720000000000001,6.720000000000001), scale(0.58)"
                    />

                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#000000"
                      strokeWidth="0.384"
                    >
                      {' '}
                      <title>lightbulb-on</title>{' '}
                      <path d="M20 24.75h-8c-0.69 0-1.25 0.56-1.25 1.25v2c0 0 0 0 0 0 0 0.345 0.14 0.658 0.366 0.885l2 2c0.226 0.226 0.538 0.365 0.883 0.365 0 0 0.001 0 0.001 0h4c0 0 0.001 0 0.002 0 0.345 0 0.657-0.14 0.883-0.365l2-2c0.226-0.226 0.365-0.538 0.365-0.883 0-0.001 0-0.001 0-0.002v0-2c-0.001-0.69-0.56-1.249-1.25-1.25h-0zM18.75 27.482l-1.268 1.268h-2.965l-1.268-1.268v-0.232h5.5zM27.125 12.558c0.003-0.098 0.005-0.214 0.005-0.329 0-2.184-0.654-4.216-1.778-5.91l0.025 0.040c-1.919-3.252-5.328-5.447-9.263-5.644l-0.027-0.001h-0.071c-3.934 0.165-7.338 2.292-9.274 5.423l-0.028 0.049c-1.17 1.687-1.869 3.777-1.869 6.031 0 0.012 0 0.025 0 0.037v-0.002c0.184 2.294 0.923 4.383 2.081 6.176l-0.032-0.052c0.322 0.555 0.664 1.102 1.006 1.646 0.671 0.991 1.314 2.13 1.862 3.322l0.062 0.151c0.194 0.455 0.637 0.768 1.153 0.768 0 0 0.001 0 0.001 0h-0c0.173-0 0.338-0.035 0.489-0.099l-0.008 0.003c0.455-0.194 0.768-0.638 0.768-1.155 0-0.174-0.036-0.34-0.1-0.49l0.003 0.008c-0.669-1.481-1.374-2.739-2.173-3.929l0.060 0.095c-0.327-0.523-0.654-1.044-0.962-1.575-0.939-1.397-1.557-3.083-1.71-4.901l-0.003-0.038c0.019-1.735 0.565-3.338 1.485-4.662l-0.018 0.027c1.512-2.491 4.147-4.17 7.185-4.332l0.022-0.001h0.052c3.071 0.212 5.697 1.934 7.162 4.423l0.023 0.042c0.864 1.293 1.378 2.883 1.378 4.593 0 0.053-0 0.107-0.002 0.16l0-0.008c-0.22 1.839-0.854 3.496-1.807 4.922l0.026-0.041c-0.287 0.487-0.588 0.968-0.889 1.446-0.716 1.066-1.414 2.298-2.020 3.581l-0.074 0.175c-0.067 0.148-0.106 0.321-0.106 0.503 0 0.69 0.56 1.25 1.25 1.25 0.512 0 0.952-0.308 1.146-0.749l0.003-0.008c0.625-1.33 1.264-2.452 1.978-3.52l-0.060 0.096c0.313-0.498 0.625-0.998 0.924-1.502 1.131-1.708 1.891-3.756 2.12-5.961l0.005-0.058zM15.139 5.687c-0.199-0.438-0.633-0.737-1.136-0.737-0.188 0-0.365 0.041-0.525 0.116l0.008-0.003c-2.463 1.415-4.215 3.829-4.711 6.675l-0.008 0.057c-0.011 0.061-0.017 0.132-0.017 0.204 0 0.617 0.447 1.129 1.035 1.231l0.007 0.001c0.063 0.011 0.135 0.018 0.209 0.018h0c0.615-0.001 1.126-0.446 1.23-1.031l0.001-0.008c0.366-2.067 1.575-3.797 3.252-4.852l0.030-0.017c0.437-0.2 0.735-0.634 0.735-1.138 0-0.187-0.041-0.364-0.115-0.523l0.003 0.008zM1.441 3.118l4 2c0.16 0.079 0.348 0.126 0.546 0.126 0.69 0 1.25-0.56 1.25-1.25 0-0.482-0.273-0.9-0.672-1.109l-0.007-0.003-4-2c-0.16-0.079-0.348-0.126-0.546-0.126-0.69 0-1.25 0.56-1.25 1.25 0 0.482 0.273 0.9 0.672 1.109l0.007 0.003zM26 5.25c0.001 0 0.001 0 0.002 0 0.203 0 0.395-0.049 0.564-0.135l-0.007 0.003 4-2c0.407-0.212 0.679-0.63 0.679-1.112 0-0.69-0.56-1.25-1.25-1.25-0.199 0-0.387 0.046-0.554 0.129l0.007-0.003-4 2c-0.413 0.21-0.69 0.631-0.69 1.118 0 0.69 0.559 1.25 1.249 1.25h0zM30.559 20.883l-4-2c-0.163-0.083-0.355-0.132-0.559-0.132-0.69 0-1.249 0.559-1.249 1.249 0 0.486 0.278 0.908 0.683 1.114l0.007 0.003 4 2c0.163 0.083 0.355 0.132 0.559 0.132 0.69 0 1.249-0.559 1.249-1.249 0-0.486-0.278-0.908-0.683-1.114l-0.007-0.003zM5.561 18.867l-3.913 1.83c-0.428 0.205-0.718 0.634-0.718 1.131 0 0.691 0.56 1.25 1.25 1.25 0.191 0 0.372-0.043 0.534-0.119l-0.008 0.003 3.913-1.83c0.428-0.205 0.718-0.634 0.718-1.131 0-0.691-0.56-1.25-1.25-1.25-0.191 0-0.372 0.043-0.534 0.119l0.008-0.003zM2 13.25h1c0.69 0 1.25-0.56 1.25-1.25s-0.56-1.25-1.25-1.25v0h-1c-0.69 0-1.25 0.56-1.25 1.25s0.56 1.25 1.25 1.25v0zM30 10.75h-1c-0.69 0-1.25 0.56-1.25 1.25s0.56 1.25 1.25 1.25v0h1c0.69 0 1.25-0.56 1.25-1.25s-0.56-1.25-1.25-1.25v0z" />{' '}
                    </g>

                    <g id="SVGRepo_iconCarrier">
                      {' '}
                      <title>lightbulb-on</title>{' '}
                      <path d="M20 24.75h-8c-0.69 0-1.25 0.56-1.25 1.25v2c0 0 0 0 0 0 0 0.345 0.14 0.658 0.366 0.885l2 2c0.226 0.226 0.538 0.365 0.883 0.365 0 0 0.001 0 0.001 0h4c0 0 0.001 0 0.002 0 0.345 0 0.657-0.14 0.883-0.365l2-2c0.226-0.226 0.365-0.538 0.365-0.883 0-0.001 0-0.001 0-0.002v0-2c-0.001-0.69-0.56-1.249-1.25-1.25h-0zM18.75 27.482l-1.268 1.268h-2.965l-1.268-1.268v-0.232h5.5zM27.125 12.558c0.003-0.098 0.005-0.214 0.005-0.329 0-2.184-0.654-4.216-1.778-5.91l0.025 0.040c-1.919-3.252-5.328-5.447-9.263-5.644l-0.027-0.001h-0.071c-3.934 0.165-7.338 2.292-9.274 5.423l-0.028 0.049c-1.17 1.687-1.869 3.777-1.869 6.031 0 0.012 0 0.025 0 0.037v-0.002c0.184 2.294 0.923 4.383 2.081 6.176l-0.032-0.052c0.322 0.555 0.664 1.102 1.006 1.646 0.671 0.991 1.314 2.13 1.862 3.322l0.062 0.151c0.194 0.455 0.637 0.768 1.153 0.768 0 0 0.001 0 0.001 0h-0c0.173-0 0.338-0.035 0.489-0.099l-0.008 0.003c0.455-0.194 0.768-0.638 0.768-1.155 0-0.174-0.036-0.34-0.1-0.49l0.003 0.008c-0.669-1.481-1.374-2.739-2.173-3.929l0.060 0.095c-0.327-0.523-0.654-1.044-0.962-1.575-0.939-1.397-1.557-3.083-1.71-4.901l-0.003-0.038c0.019-1.735 0.565-3.338 1.485-4.662l-0.018 0.027c1.512-2.491 4.147-4.17 7.185-4.332l0.022-0.001h0.052c3.071 0.212 5.697 1.934 7.162 4.423l0.023 0.042c0.864 1.293 1.378 2.883 1.378 4.593 0 0.053-0 0.107-0.002 0.16l0-0.008c-0.22 1.839-0.854 3.496-1.807 4.922l0.026-0.041c-0.287 0.487-0.588 0.968-0.889 1.446-0.716 1.066-1.414 2.298-2.020 3.581l-0.074 0.175c-0.067 0.148-0.106 0.321-0.106 0.503 0 0.69 0.56 1.25 1.25 1.25 0.512 0 0.952-0.308 1.146-0.749l0.003-0.008c0.625-1.33 1.264-2.452 1.978-3.52l-0.060 0.096c0.313-0.498 0.625-0.998 0.924-1.502 1.131-1.708 1.891-3.756 2.12-5.961l0.005-0.058zM15.139 5.687c-0.199-0.438-0.633-0.737-1.136-0.737-0.188 0-0.365 0.041-0.525 0.116l0.008-0.003c-2.463 1.415-4.215 3.829-4.711 6.675l-0.008 0.057c-0.011 0.061-0.017 0.132-0.017 0.204 0 0.617 0.447 1.129 1.035 1.231l0.007 0.001c0.063 0.011 0.135 0.018 0.209 0.018h0c0.615-0.001 1.126-0.446 1.23-1.031l0.001-0.008c0.366-2.067 1.575-3.797 3.252-4.852l0.030-0.017c0.437-0.2 0.735-0.634 0.735-1.138 0-0.187-0.041-0.364-0.115-0.523l0.003 0.008zM1.441 3.118l4 2c0.16 0.079 0.348 0.126 0.546 0.126 0.69 0 1.25-0.56 1.25-1.25 0-0.482-0.273-0.9-0.672-1.109l-0.007-0.003-4-2c-0.16-0.079-0.348-0.126-0.546-0.126-0.69 0-1.25 0.56-1.25 1.25 0 0.482 0.273 0.9 0.672 1.109l0.007 0.003zM26 5.25c0.001 0 0.001 0 0.002 0 0.203 0 0.395-0.049 0.564-0.135l-0.007 0.003 4-2c0.407-0.212 0.679-0.63 0.679-1.112 0-0.69-0.56-1.25-1.25-1.25-0.199 0-0.387 0.046-0.554 0.129l0.007-0.003-4 2c-0.413 0.21-0.69 0.631-0.69 1.118 0 0.69 0.559 1.25 1.249 1.25h0zM30.559 20.883l-4-2c-0.163-0.083-0.355-0.132-0.559-0.132-0.69 0-1.249 0.559-1.249 1.249 0 0.486 0.278 0.908 0.683 1.114l0.007 0.003 4 2c0.163 0.083 0.355 0.132 0.559 0.132 0.69 0 1.249-0.559 1.249-1.249 0-0.486-0.278-0.908-0.683-1.114l-0.007-0.003zM5.561 18.867l-3.913 1.83c-0.428 0.205-0.718 0.634-0.718 1.131 0 0.691 0.56 1.25 1.25 1.25 0.191 0 0.372-0.043 0.534-0.119l-0.008 0.003 3.913-1.83c0.428-0.205 0.718-0.634 0.718-1.131 0-0.691-0.56-1.25-1.25-1.25-0.191 0-0.372 0.043-0.534 0.119l0.008-0.003zM2 13.25h1c0.69 0 1.25-0.56 1.25-1.25s-0.56-1.25-1.25-1.25v0h-1c-0.69 0-1.25 0.56-1.25 1.25s0.56 1.25 1.25 1.25v0zM30 10.75h-1c-0.69 0-1.25 0.56-1.25 1.25s0.56 1.25 1.25 1.25v0h1c0.69 0 1.25-0.56 1.25-1.25s-0.56-1.25-1.25-1.25v0z" />{' '}
                    </g>
                  </svg>
                </span>
                <NavLink
                  to="/sugerencias"
                  className={(isActive) =>
                    `flex max-h-12 min-w-32 items-center justify-between rounded border border-blue-500/50 p-4 text-sm ${isActive ? 'active' : ''}`
                  }
                >
                  <strong className="text-[currentColor]">Enviar</strong>
                  <Icon className="w-6 min-w-2 text-white sm:w-7 lg:w-8 xl:w-9">
                    <SuggestionsIcon />
                  </Icon>
                </NavLink>
              </aside>
            </section>
          </>
        )}
      </article>

      {/* RESUMEN DEL MES */}
      <article>
        <h1 className="mb-4 flex items-center justify-between gap-4 text-2xl font-semibold sm:justify-start">
          <span>Resumen del mes</span>
          <Icon className="w-8">
            <SummaryBookIcon />
          </Icon>
        </h1>
        {loading ? (
          <div className="panel rounded p-4 text-center">
            <div className="text-sm">Cargando métricas...</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="panel rounded p-4">
              <div className="muted text-sm">Facturas del mes</div>
              <div className="text-3xl font-bold">{metrics?.totalInvoices || 0}</div>
            </div>
            <div className="panel rounded p-4">
              <div className="muted text-sm">Importe total</div>
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(metrics?.totalAmount || 0)}
              </div>
            </div>
            <div className="panel rounded bg-green-50 p-4">
              <div className="muted text-sm text-green-700">Cobradas</div>
              <div className="text-3xl font-bold text-green-800">{metrics?.paidInvoices || 0}</div>
              <div className="text-xs text-green-600">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(metrics?.paidAmount || 0)}
              </div>
            </div>
            <div className="panel rounded bg-yellow-50 p-4">
              <div className="muted text-sm text-yellow-700">Pendientes</div>
              <div className="text-3xl font-bold text-yellow-800">
                {metrics?.pendingInvoices || 0}
              </div>
              <div className="text-xs text-yellow-600">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(metrics?.pendingAmount || 0)}
              </div>
            </div>
          </div>
        )}
      </article>
      {/* SECCIONES RÁPIDAS */}
      <article>
        <h2 className="mt-8 mb-4 text-xl font-semibold">Secciones rápidas</h2>
        <div className="grid gap-4 md:grid-cols-12">
          {/* Facturas - bloque principal */}
          <div className="panel relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded p-4 md:col-span-7">
            <div className="flex items-start gap-3">
              <Icon className="w-10">
                <InvoicesIcon />
              </Icon>
              <div>
                <div className="text-lg font-semibold">Facturas</div>
                <p className="muted text-sm">Crea, gestiona y revisa el estado de tus facturas.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link to="/invoices" className="btn btn-secondary text-sm">
                Ir a facturas
              </Link>
              <span className="muted text-xs">Borradores, enviadas, pendientes</span>
            </div>
          </div>

          {/* Clientes */}
          <div className="panel relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded p-4 md:col-span-5">
            <div className="flex items-start gap-3">
              <Icon className="w-10">
                <ClientsIcon />
              </Icon>
              <div>
                <div className="text-lg font-semibold">Clientes</div>
                <p className="muted text-sm">Gestiona tu cartera de clientes y sus datos.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link to="/clientes" className="btn btn-secondary text-sm">
                Ir a clientes
              </Link>
              <span className="muted text-xs">Altas, edición, historial</span>
            </div>
          </div>

          {/* Sugerencias */}
          <div className="panel relative flex min-h-[140px] flex-col justify-between rounded p-4 md:col-span-5">
            <div className="flex items-start gap-3">
              <span className="w-10">
                <SuggestionsIcon />
              </span>
              <div>
                <div className="text-lg font-semibold">Sugerencias</div>
                <p className="muted text-sm">Cuéntanos qué mejorar o qué necesitas.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link to="/sugerencias" className="btn btn-secondary text-sm">
                Enviar sugerencia
              </Link>
              <span className="muted text-xs">Gracias por tu feedback</span>
            </div>
          </div>

          {/* Sellos */}
          <div className="panel relative flex min-h-[140px] flex-col justify-between rounded p-4 md:col-span-4">
            <div className="flex items-start gap-3">
              <Icon className="w-10">
                <CompanySealIcons />
              </Icon>
              <div>
                <div className="text-lg font-semibold">Sellos</div>
                <p className="muted text-sm">Crea y reutiliza textos frecuentes en facturas.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link to="/sellos" className="btn btn-secondary text-sm">
                Ir a sellos
              </Link>
            </div>
          </div>

          {/* Ajustes */}
          <div className="panel relative flex min-h-[140px] flex-col justify-between rounded p-4 md:col-span-3">
            <div className="flex items-start gap-3">
              <Icon className="w-10">
                <SettingsIcon />
              </Icon>
              <div>
                <div className="text-lg font-semibold">Ajustes</div>
                <p className="muted text-sm">Configura tu perfil y preferencias.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link to="/settings" className="btn btn-secondary text-sm">
                Ir a ajustes
              </Link>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
