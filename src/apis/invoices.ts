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
    statusFilter?: 'pending' | 'paid' | 'overdue'
  }
): Promise<InvoicesPage> {
  const colRef = collection(db, 'users', uid, 'invoices')
  const pageSize = opts?.pageSize ?? 10
  const from = opts?.fromDate ? parseDateInput(opts.fromDate) : undefined
  const to = opts?.toDate ? parseDateInput(opts.toDate) : undefined

  const whereConstraints: QueryConstraint[] = []
  if (from) whereConstraints.push(where('invoiceDate', '>=', Timestamp.fromDate(from)))
  if (to) whereConstraints.push(where('invoiceDate', '<=', Timestamp.fromDate(to)))
  if (opts?.statusFilter) whereConstraints.push(where('status', '==', opts.statusFilter))

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