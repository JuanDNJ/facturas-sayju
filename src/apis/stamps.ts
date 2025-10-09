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
import type { Stamp } from '../types/invoice.types'

const db = getFirestore(appFirebase)

function mapStamp(snap: QueryDocumentSnapshot<DocumentData>): Stamp {
  const d = snap.data()
  const tsToDate = (v: unknown): Date | undefined =>
    v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : undefined
  return {
    id: snap.id,
    imgUrl: d.imgUrl ? String(d.imgUrl) : undefined,
    name: String(d.name || ''),
    companyName: d.companyName ? String(d.companyName) : undefined,
    address: String(d.address || ''),
    taxId: String(d.taxId || ''),
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
  }
}

export type StampsPage = {
  items: Stamp[]
  nextCursor?: QueryDocumentSnapshot<DocumentData>
  total?: number
}

export async function getStamps(
  uid: string,
  opts?: {
    pageSize?: number
    cursor?: QueryDocumentSnapshot<DocumentData> | null
    withTotal?: boolean
    orderByField?: 'createdAt' | 'name'
    direction?: 'asc' | 'desc'
  }
): Promise<StampsPage> {
  const colRef = collection(db, 'users', uid, 'stamps')
  const pageSize = opts?.pageSize ?? 12
  const field = opts?.orderByField ?? 'createdAt'
  const dir = opts?.direction ?? (field === 'name' ? 'asc' : 'desc')
  const { query } = await import('firebase/firestore')
  const base = query(colRef, orderBy(field, dir), limit(pageSize))
  const q = opts?.cursor ? query(base, startAfter(opts.cursor)) : base
  const snap = await getDocs(q)
  const items = snap.docs.map(mapStamp)
  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined
  let total: number | undefined
  if (opts?.withTotal) {
    const agg = await getCountFromServer(colRef)
    total = agg.data().count
  }
  return { items, nextCursor, total }
}

export async function getStamp(uid: string, id: string): Promise<Stamp | null> {
  const ref = doc(db, 'users', uid, 'stamps', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const shim = {
    id: snap.id,
    data: () => snap.data() as DocumentData,
  } as unknown as QueryDocumentSnapshot<DocumentData>
  return mapStamp(shim)
}

export async function addStamp(uid: string, stamp: Stamp): Promise<string> {
  const colRef = collection(db, 'users', uid, 'stamps')
  const docToSave: DocumentData = {
    imgUrl: stamp.imgUrl || null,
    name: stamp.name,
    companyName: stamp.companyName || null,
    address: stamp.address,
    taxId: stamp.taxId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const res = await addDoc(colRef, docToSave)
  return res.id
}

export async function updateStamp(uid: string, id: string, patch: Partial<Stamp>): Promise<void> {
  const ref = doc(db, 'users', uid, 'stamps', id)
  const docToUpdate: DocumentData = {
    ...('imgUrl' in patch ? { imgUrl: patch.imgUrl ?? null } : {}),
    ...('name' in patch ? { name: patch.name } : {}),
    ...('companyName' in patch ? { companyName: patch.companyName ?? null } : {}),
    ...('address' in patch ? { address: patch.address } : {}),
    ...('taxId' in patch ? { taxId: patch.taxId } : {}),
    updatedAt: serverTimestamp(),
  }
  await updateDoc(ref, docToUpdate)
}

export async function removeStamp(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'stamps', id)
  await deleteDoc(ref)
}
