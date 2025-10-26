import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Invoice } from '../types/invoice.types'
import { getInvoices } from '../apis/invoices'
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore'

export type UseInvoicesPaginationOptions = {
  uid?: string
  pageSize?: number
  fromDate?: Date | string
  toDate?: Date | string
  orderDirection?: 'asc' | 'desc'
  orderByField?: 'invoiceDate' | 'invoiceId'
}

export type UseInvoicesPagination = {
  items: Invoice[]
  loading: boolean
  error: string | null
  currentPage: number
  hasNext: boolean
  pageSize: number
  setPageSize: (n: number) => void
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
  reloadFirstPage: () => Promise<void>
}

/**
 * Hook de paginación de facturas basado en cursores de Firestore.
 * Resetea a la página 1 cuando cambian los filtros/orden.
 */
export function useInvoicesPagination(
  options: UseInvoicesPaginationOptions
): UseInvoicesPagination {
  const {
    uid,
    pageSize: initialSize = 10,
    fromDate,
    toDate,
    orderDirection,
    orderByField,
  } = options

  const [items, setItems] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [pageSize, setPageSize] = useState(initialSize)
  const [currentPage, setCurrentPage] = useState(1)
  const cursorStackRef = useRef<QueryDocumentSnapshot<DocumentData>[]>([])

  // Memorizar dependencias para comparaciones en efectos
  const depsKey = useMemo(
    () => JSON.stringify({ uid, pageSize, fromDate, toDate, orderDirection, orderByField }),
    [uid, pageSize, fromDate, toDate, orderDirection, orderByField]
  )

  const loadFirst = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    setError(null)
    try {
      const page = await getInvoices(uid, {
        pageSize,
        fromDate,
        toDate,
        orderDirection,
        orderByField,
      })
      setItems(page.items)
      setHasNext(Boolean(page.nextCursor))
      cursorStackRef.current = page.nextCursor ? [page.nextCursor] : []
      setCurrentPage(1)
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'No se pudieron cargar las facturas'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [uid, pageSize, fromDate, toDate, orderDirection, orderByField])

  const nextPage = useCallback(async () => {
    if (!uid) return
    const lastCursor = cursorStackRef.current[cursorStackRef.current.length - 1]
    if (!lastCursor) return
    setLoading(true)
    setError(null)
    try {
      const page = await getInvoices(uid, {
        pageSize,
        cursor: lastCursor,
        fromDate,
        toDate,
        orderDirection,
        orderByField,
      })
      setItems(page.items)
      setHasNext(Boolean(page.nextCursor))
      if (page.nextCursor) cursorStackRef.current = [...cursorStackRef.current, page.nextCursor]
      setCurrentPage((p) => p + 1)
    } catch {
      setError('No se pudo cargar la siguiente página')
    } finally {
      setLoading(false)
    }
  }, [uid, pageSize, fromDate, toDate, orderDirection, orderByField])

  const prevPage = useCallback(async () => {
    if (!uid) return
    if (currentPage <= 1) return
    setLoading(true)
    setError(null)
    try {
      // Índice del cursor previo a la página objetivo (mismo cálculo que en la página original)
      const prevCursorIdx = currentPage - 3
      const prevCursor = prevCursorIdx >= 0 ? cursorStackRef.current[prevCursorIdx] : undefined
      const page = await getInvoices(uid, {
        pageSize,
        cursor: prevCursor ?? undefined,
        fromDate,
        toDate,
        orderDirection,
        orderByField,
      })
      setItems(page.items)
      setHasNext(Boolean(page.nextCursor))
      // Recortar la pila hasta la página previa y añadir el nextCursor actual si existe
      const nextLen = Math.max(0, currentPage - 1)
      const trimmed = cursorStackRef.current.slice(0, nextLen - 1)
      cursorStackRef.current = page.nextCursor ? [...trimmed, page.nextCursor] : trimmed
      setCurrentPage((p) => Math.max(1, p - 1))
    } catch {
      setError('No se pudo cargar la página anterior')
    } finally {
      setLoading(false)
    }
  }, [uid, pageSize, fromDate, toDate, orderDirection, orderByField, currentPage])

  // Recargar primera página cuando cambian dependencias clave
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!active) return
      await loadFirst()
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey])

  return {
    items,
    loading,
    error,
    currentPage,
    hasNext,
    pageSize,
    setPageSize,
    nextPage,
    prevPage,
    reloadFirstPage: loadFirst,
  }
}
