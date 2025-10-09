import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore'
import { appFirebase } from './firebase'
import type { Customer } from '../types/invoice.types'

const db = getFirestore(appFirebase)

function mapCustomer(snap: QueryDocumentSnapshot<DocumentData>): Customer {
  const d = snap.data()
  const tsToDate = (v: unknown): Date | undefined =>
    v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : undefined
  return {
    id: snap.id,
    name: String(d.name || ''),
    email: d.email ? String(d.email) : undefined,
    address: String(d.address || ''),
    taxId: String(d.taxId || ''),
    phone: d.phone ? String(d.phone) : undefined,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  }
}

export type CustomersPage = {
  items: Customer[]
  nextCursor?: QueryDocumentSnapshot<DocumentData>
  total?: number
}

export async function getCustomers(
  uid: string,
  opts?: {
    pageSize?: number
    cursor?: QueryDocumentSnapshot<DocumentData> | null
    withTotal?: boolean
    orderByField?: 'name' | 'createdAt'
    direction?: 'asc' | 'desc'
  }
): Promise<CustomersPage> {
  const colRef = collection(db, 'users', uid, 'customers')
  const pageSize = opts?.pageSize ?? 10
  const field = opts?.orderByField ?? 'name'
  const dir = opts?.direction ?? (field === 'name' ? 'asc' : 'desc')
  const base = getDocs(
    (await import('firebase/firestore')).query(colRef, orderBy(field, dir), limit(pageSize))
  )
  // Nota: usamos import dinámico para query para evitar import circular en algunos bundlers
  const snap = await base
  const items = snap.docs.map(mapCustomer)
  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined
  let total: number | undefined
  if (opts?.withTotal) {
    const agg = await getCountFromServer(colRef)
    total = agg.data().count
  }
  return { items, nextCursor, total }
}

export async function getCustomersPage(
  uid: string,
  cursor: QueryDocumentSnapshot<DocumentData> | null,
  opts?: { pageSize?: number; orderByField?: 'name' | 'createdAt'; direction?: 'asc' | 'desc' }
): Promise<CustomersPage> {
  const colRef = collection(db, 'users', uid, 'customers')
  const pageSize = opts?.pageSize ?? 10
  const field = opts?.orderByField ?? 'name'
  const dir = opts?.direction ?? (field === 'name' ? 'asc' : 'desc')
  const { query } = await import('firebase/firestore')
  const q = cursor
    ? query(colRef, orderBy(field, dir), startAfter(cursor), limit(pageSize))
    : query(colRef, orderBy(field, dir), limit(pageSize))
  const snap = await getDocs(q)
  const items = snap.docs.map(mapCustomer)
  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined
  return { items, nextCursor }
}

export async function addCustomer(uid: string, customer: Customer): Promise<string> {
  const colRef = collection(db, 'users', uid, 'customers')
  const docToSave: DocumentData = {
    name: customer.name,
    email: customer.email || null,
    address: customer.address,
    taxId: customer.taxId,
    phone: customer.phone || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const res = await addDoc(colRef, docToSave)
  return res.id
}

export async function updateCustomer(
  uid: string,
  id: string,
  patch: Partial<Customer>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'customers', id)
  const docToUpdate: DocumentData = {
    ...('name' in patch ? { name: patch.name } : {}),
    ...('email' in patch ? { email: patch.email ?? null } : {}),
    ...('address' in patch ? { address: patch.address } : {}),
    ...('taxId' in patch ? { taxId: patch.taxId } : {}),
    ...('phone' in patch ? { phone: patch.phone ?? null } : {}),
    updatedAt: serverTimestamp(),
  }
  await updateDoc(ref, docToUpdate)
}

export async function getCustomer(uid: string, id: string): Promise<Customer | null> {
  const ref = doc(db, 'users', uid, 'customers', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const shim = {
    id: snap.id,
    data: () => snap.data() as DocumentData,
  } as unknown as QueryDocumentSnapshot<DocumentData>
  return mapCustomer(shim)
}

export async function removeCustomer(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'customers', id)
  await deleteDoc(ref)
}
