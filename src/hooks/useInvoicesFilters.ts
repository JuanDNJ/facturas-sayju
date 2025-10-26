import { useCallback, useState } from 'react'

export type SortBy = 'date' | 'customer' | 'id'
export type SortDir = 'asc' | 'desc'

export type UseInvoicesFiltersState = {
  // Filtros de búsqueda local
  qInvoiceId: string
  qCustomer: string
  qFrom: string // YYYY-MM-DD
  qTo: string
  // Ordenación
  sortBy: SortBy
  sortDir: SortDir
  // Aviso UX cuando se limpia fecha al cambiar a orden por id
  dateClearedNotice: boolean
  // Derivados para el backend
  serverOrderByField: 'invoiceDate' | 'invoiceId'
  serverOrderDirection?: 'asc' | 'desc'
  // Derivado para la UI
  datesDisabled: boolean
}

export type UseInvoicesFilters = UseInvoicesFiltersState & {
  setQInvoiceId: (v: string) => void
  setQCustomer: (v: string) => void
  setQFrom: (v: string) => void
  setQTo: (v: string) => void
  setSortDir: (v: SortDir) => void
  setSortBy: (v: SortBy) => void
  reset: () => void
}

export function useInvoicesFilters(initial?: Partial<UseInvoicesFiltersState>): UseInvoicesFilters {
  // Estado base
  const [qInvoiceId, setQInvoiceId] = useState(initial?.qInvoiceId ?? '')
  const [qCustomer, setQCustomer] = useState(initial?.qCustomer ?? '')
  const [qFrom, setQFrom] = useState(initial?.qFrom ?? '')
  const [qTo, setQTo] = useState(initial?.qTo ?? '')
  // Por defecto: fecha desc => más recientes primero
  const [sortBy, _setSortBy] = useState<SortBy>(initial?.sortBy ?? 'date')
  const [sortDir, setSortDir] = useState<SortDir>(initial?.sortDir ?? 'desc')
  const [dateClearedNotice, setDateClearedNotice] = useState(false)

  // Cambiar sortBy con la lógica de limpieza de fechas al ordenar por id
  const setSortBy = useCallback(
    (next: SortBy) => {
      if (next === 'id' && (qFrom || qTo)) {
        setQFrom('')
        setQTo('')
        setDateClearedNotice(true)
        window.setTimeout(() => setDateClearedNotice(false), 3500)
      }
      _setSortBy(next)
    },
    [qFrom, qTo]
  )

  // Derivados para backend/UI
  const serverOrderByField: 'invoiceDate' | 'invoiceId' =
    sortBy === 'id' ? 'invoiceId' : 'invoiceDate'
  const serverOrderDirection: 'asc' | 'desc' | undefined =
    sortBy === 'customer' ? undefined : sortDir
  const datesDisabled = sortBy === 'id'

  const reset = useCallback(() => {
    setQInvoiceId('')
    setQCustomer('')
    setQFrom('')
    setQTo('')
    _setSortBy('date')
    setSortDir('desc')
    setDateClearedNotice(false)
  }, [])

  return {
    qInvoiceId,
    qCustomer,
    qFrom,
    qTo,
    sortBy,
    sortDir,
    dateClearedNotice,
    serverOrderByField,
    serverOrderDirection,
    datesDisabled,

    setQInvoiceId,
    setQCustomer,
    setQFrom,
    setQTo,
    setSortDir,
    setSortBy,
    reset,
  }
}
