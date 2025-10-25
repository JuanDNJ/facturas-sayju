import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
  Timestamp,
  addDoc,
  serverTimestamp,
  limit,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore'
import { appFirebase } from './firebase'
import type { Invoice } from '../types/invoice.types'

const db = getFirestore(appFirebase)

function mapInvoice(doc: QueryDocumentSnapshot<DocumentData>): Invoice {
  const d = doc.data()
  const hasToDate = (v: unknown): v is Timestamp =>
    typeof v === 'object' && v !== null && v instanceof Timestamp

  const toDateStrict = (v: unknown): Date | undefined => {
    if (hasToDate(v)) return v.toDate()
    if (v instanceof Date) return v
    if (typeof v === 'string' && v) return parseDateInput(v)
    return undefined
  }

  const invoiceDate = toDateStrict(d.invoiceDate) || new Date()
  const expirationDate = toDateStrict(d.expirationDate)

  return {
    id: doc.id,
    invoiceId: (d.invoiceId as string) || '',
    stamp: (d.stamp as Invoice['stamp']) || {
      name: '',
      address: '',
      taxId: '',
    },
    invoiceDate,
    expirationDate: expirationDate || invoiceDate,
    customer: (d.customer as Invoice['customer']) || {
      name: '',
      address: '',
      taxId: '',
    },
    items: (d.items as Invoice['items']) || [],
    totals: (d.totals as Invoice['totals']) || {
      taxableBase: 0,
      vatPercentage: 0,
      vatAmount: 0,
      taxableBasePlusVat: 0,
      irpfPercentage: 0,
      irpfAmount: 0,
      totalAmount: 0,
    },
    // Estado de pago
    status: (d.status as Invoice['status']) || 'pending',
    paidDate: toDateStrict(d.paidDate),
    paymentNotes: (d.paymentNotes as string) || undefined,
    // Facturas rectificativas
    invoiceKind: (d.invoiceKind as Invoice['invoiceKind']) || 'normal',
    rectifiedRef: (d.rectifiedRef as string) || undefined,
    rectifiedDate: toDateStrict(d.rectifiedDate),
    rectificationReason: (d.rectificationReason as string) || undefined,
    createdAt: toDateStrict(d.createdAt),
    updatedAt: toDateStrict(d.updatedAt),
  }
}

export type InvoicesPage = {
  items: Invoice[]
  nextCursor?: QueryDocumentSnapshot<DocumentData>
  total?: number
}

export async function getInvoices(
  uid: string,
  opts?: {
    pageSize?: number
    cursor?: QueryDocumentSnapshot<DocumentData> | null
    withTotal?: boolean
    fromDate?: Date | string
    toDate?: Date | string
    orderDirection?: 'asc' | 'desc'
    orderByField?: 'invoiceDate' | 'invoiceId'
  }
): Promise<InvoicesPage> {
  const colRef = collection(db, 'users', uid, 'invoices')
  const pageSize = opts?.pageSize ?? 10
  const from = opts?.fromDate ? parseDateInput(opts.fromDate) : undefined
  const to = opts?.toDate ? parseDateInput(opts.toDate) : undefined

  const whereConstraints: QueryConstraint[] = []
  if (from) whereConstraints.push(where('invoiceDate', '>=', Timestamp.fromDate(from)))
  if (to) whereConstraints.push(where('invoiceDate', '<=', Timestamp.fromDate(to)))

  const dir = opts?.orderDirection ?? 'desc'
  // Si no hay filtros de fecha y se solicita ordenar por número, ordenamos por invoiceId.
  // Si hay filtros de fecha, mantenemos orden por invoiceDate para cumplir restricciones de Firestore.
  const field: 'invoiceDate' | 'invoiceId' =
    !from && !to && opts?.orderByField === 'invoiceId' ? 'invoiceId' : 'invoiceDate'
  const baseConstraints: QueryConstraint[] = [orderBy(field, dir), limit(pageSize)]
  const cursorConstraint: QueryConstraint[] = opts?.cursor ? [startAfter(opts.cursor)] : []
  const q = query(colRef, ...whereConstraints, ...baseConstraints, ...cursorConstraint)
  const snap = await getDocs(q)
  const items = snap.docs.map(mapInvoice)
  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined
  let total: number | undefined = undefined
  if (opts?.withTotal) {
    // apply same where constraints to count (without order/limit)
    const countQ = query(colRef, ...whereConstraints)
    const agg = await getCountFromServer(countQ)
    total = agg.data().count
  }
  return { items, nextCursor, total }
}

function parseDateInput(v: Date | string): Date | undefined {
  if (v instanceof Date) return v
  if (typeof v === 'string' && v) {
    // Preferir YYYY-MM-DD como fecha local (evitar parse UTC por defecto que puede restar un día)
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) {
      const year = Number(m[1])
      const month = Number(m[2])
      const day = Number(m[3])
      const d = new Date(year, month - 1, day, 0, 0, 0, 0) // local midnight
      return isNaN(d.getTime()) ? undefined : d
    }
    // Fallback: intentar parsear ISO u otros formatos
    const d = new Date(v)
    return isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}

// elimina propiedades undefined para cumplir con restricciones de Firestore
function clean<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

export async function addInvoice(uid: string, invoice: Invoice): Promise<string> {
  const colRef = collection(db, 'users', uid, 'invoices')
  const invoiceDate = parseDateInput(invoice.invoiceDate)
  const expirationDate = parseDateInput(invoice.expirationDate)

  const stampClean = clean({
    name: invoice.stamp?.name,
    companyName: invoice.stamp?.companyName,
    address: invoice.stamp?.address,
    taxId: invoice.stamp?.taxId,
    imgUrl: invoice.stamp?.imgUrl,
  })

  const customerClean = clean({
    name: invoice.customer?.name,
    address: invoice.customer?.address,
    taxId: invoice.customer?.taxId,
    email: invoice.customer?.email,
    phone: invoice.customer?.phone,
  })

  const docToSave: DocumentData = {
    invoiceId: invoice.invoiceId,
    stamp: stampClean,
    invoiceDate: invoiceDate ? Timestamp.fromDate(invoiceDate) : serverTimestamp(),
    expirationDate: expirationDate ? Timestamp.fromDate(expirationDate) : null,
    customer: customerClean,
    items: invoice.items.map((it) => ({
      ...it,
      price: typeof it.price === 'string' ? Number(it.price || 0) : it.price,
      code: typeof it.code === 'string' && !isNaN(Number(it.code)) ? Number(it.code) : it.code,
    })),
    totals: invoice.totals,
    invoiceKind: invoice.invoiceKind ?? 'normal',
    rectifiedRef: invoice.rectifiedRef ?? null,
    rectifiedDate: invoice.rectifiedDate
      ? Timestamp.fromDate(parseDateInput(invoice.rectifiedDate)!)
      : null,
    rectificationReason: invoice.rectificationReason ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const res = await addDoc(colRef, docToSave)
  return res.id
}

import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'

export async function getInvoice(uid: string, id: string): Promise<Invoice | null> {
  const ref = doc(db, 'users', uid, 'invoices', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  // Adapt mapInvoice to work with a QueryDocumentSnapshot signature by creating a shim
  const shim = {
    id: snap.id,
    data: () => snap.data() as DocumentData,
  } as unknown as QueryDocumentSnapshot<DocumentData>
  return mapInvoice(shim)
}

export async function deleteInvoice(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'invoices', id)
  await deleteDoc(ref)
}

export async function updateInvoice(
  uid: string,
  id: string,
  invoice: Partial<Invoice>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'invoices', id)
  const patch: Record<string, unknown> = {}

  if (invoice.invoiceId !== undefined) patch.invoiceId = invoice.invoiceId
  if (invoice.stamp !== undefined) {
    patch.stamp = clean({
      name: invoice.stamp?.name,
      companyName: invoice.stamp?.companyName,
      address: invoice.stamp?.address,
      taxId: invoice.stamp?.taxId,
      imgUrl: invoice.stamp?.imgUrl,
    })
  }
  if (invoice.invoiceDate !== undefined) {
    const d = parseDateInput(invoice.invoiceDate)
    patch.invoiceDate = d ? Timestamp.fromDate(d) : null
  }
  if (invoice.expirationDate !== undefined) {
    const d = parseDateInput(invoice.expirationDate)
    patch.expirationDate = d ? Timestamp.fromDate(d) : null
  }
  if (invoice.customer !== undefined) {
    patch.customer = clean({
      name: invoice.customer?.name,
      address: invoice.customer?.address,
      taxId: invoice.customer?.taxId,
      email: invoice.customer?.email,
      phone: invoice.customer?.phone,
    })
  }
  if (invoice.items !== undefined) {
    patch.items = invoice.items.map((it) => ({
      ...it,
      price: typeof it.price === 'string' ? Number(it.price || 0) : it.price,
      code: typeof it.code === 'string' && !isNaN(Number(it.code)) ? Number(it.code) : it.code,
    }))
  }
  if (invoice.totals !== undefined) patch.totals = invoice.totals
  if (invoice.invoiceKind !== undefined) patch.invoiceKind = invoice.invoiceKind
  if (invoice.rectifiedRef !== undefined) patch.rectifiedRef = invoice.rectifiedRef ?? null
  if (invoice.rectifiedDate !== undefined) {
    const d = parseDateInput(invoice.rectifiedDate)
    patch.rectifiedDate = d ? Timestamp.fromDate(d) : null
  }
  if (invoice.rectificationReason !== undefined)
    patch.rectificationReason = invoice.rectificationReason ?? null

  // Estado de pago
  if (invoice.status !== undefined) patch.status = invoice.status
  if (invoice.paidDate !== undefined) {
    const d = parseDateInput(invoice.paidDate)
    patch.paidDate = d ? Timestamp.fromDate(d) : null
  }
  if (invoice.paymentNotes !== undefined) patch.paymentNotes = invoice.paymentNotes ?? null

  patch.updatedAt = serverTimestamp()
  // Dev-only: validar que no enviamos undefined en el patch
  if (import.meta.env.DEV) {
    const hasUndefined = Object.values(patch).some((v) => v === undefined)
    if (hasUndefined) {
      console.warn('[updateInvoice] Patch contiene undefined:', patch)
    } else {
      console.debug('[updateInvoice] Patch listo:', patch)
    }
  }
  await updateDoc(ref, patch)
}

/**
 * Actualiza solo el estado de pago de una factura
 */
export async function updateInvoiceStatus(
  uid: string,
  invoiceId: string,
  status: Invoice['status'],
  notes?: string
): Promise<void> {
  const ref = doc(db, 'users', uid, 'invoices', invoiceId)
  const patch: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  }

  if (status === 'paid') {
    patch.paidDate = serverTimestamp()
  } else {
    patch.paidDate = null
  }

  if (notes !== undefined) {
    patch.paymentNotes = notes || null
  }

  await updateDoc(ref, patch)
}
