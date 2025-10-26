import { useEffect, useState } from 'react'
import { useAuth } from '../useAuth'
import { getInvoices } from '../../apis/invoices'
interface MonthlyMetrics {
  totalInvoices: number
  totalAmount: number
  paidInvoices: number
  paidAmount: number
  pendingInvoices: number
  pendingAmount: number
}

export const useDashboardPage = () => {
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
  return {
    metrics,
    loading,
    alertSystem,
    toggleAlertSystem,
  }
}
