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
} from "firebase/firestore";
import { appFirebase } from "./firebase";
import type { Invoice } from "../types/invoice.types";

const db = getFirestore(appFirebase);

function mapInvoice(doc: QueryDocumentSnapshot<DocumentData>): Invoice {
  const d = doc.data();
  const hasToDate = (v: unknown): v is Timestamp =>
    typeof v === "object" && v !== null && v instanceof Timestamp;

  const toDateStrict = (v: unknown): Date | undefined =>
    hasToDate(v) ? v.toDate() : v instanceof Date ? v : undefined;

  const invoiceDate =
    toDateStrict(d.invoiceDate) || toDateStrict(d.createdAt) || new Date();
  const expirationDate = toDateStrict(d.expirationDate);

  return {
    id: doc.id,
    invoiceId: (d.invoiceId as string) || "",
    stamp: (d.stamp as Invoice["stamp"]) || {
      name: "",
      address: "",
      taxId: "",
    },
    invoiceDate,
    expirationDate: expirationDate || invoiceDate,
    customer: (d.customer as Invoice["customer"]) || {
      name: "",
      address: "",
      taxId: "",
    },
    items: (d.items as Invoice["items"]) || [],
    totals: (d.totals as Invoice["totals"]) || {
      taxableBase: 0,
      vatPercentage: 0,
      vatAmount: 0,
      taxableBasePlusVat: 0,
      irpfPercentage: 0,
      irpfAmount: 0,
      totalAmount: 0,
    },
    createdAt: toDateStrict(d.createdAt),
    updatedAt: toDateStrict(d.updatedAt),
  };
}

export type InvoicesPage = {
  items: Invoice[];
  nextCursor?: QueryDocumentSnapshot<DocumentData>;
  total?: number;
};

export async function getInvoices(
  uid: string,
  opts?: {
    pageSize?: number;
    cursor?: QueryDocumentSnapshot<DocumentData> | null;
    withTotal?: boolean;
    fromDate?: Date | string;
    toDate?: Date | string;
    orderDirection?: "asc" | "desc";
  }
): Promise<InvoicesPage> {
  const colRef = collection(db, "users", uid, "invoices");
  const pageSize = opts?.pageSize ?? 10;
  const from = opts?.fromDate ? parseDateInput(opts.fromDate) : undefined;
  const to = opts?.toDate ? parseDateInput(opts.toDate) : undefined;

  const whereConstraints: QueryConstraint[] = [];
  if (from) whereConstraints.push(where("invoiceDate", ">=", Timestamp.fromDate(from)));
  if (to) whereConstraints.push(where("invoiceDate", "<=", Timestamp.fromDate(to)));

  const dir = opts?.orderDirection ?? "desc";
  const baseConstraints: QueryConstraint[] = [orderBy("invoiceDate", dir), limit(pageSize)];
  const cursorConstraint: QueryConstraint[] = opts?.cursor ? [startAfter(opts.cursor)] : [];
  const q = query(colRef, ...whereConstraints, ...baseConstraints, ...cursorConstraint);
  const snap = await getDocs(q);
  const items = snap.docs.map(mapInvoice);
  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined;
  let total: number | undefined = undefined;
  if (opts?.withTotal) {
    // apply same where constraints to count (without order/limit)
    const countQ = query(colRef, ...whereConstraints);
    const agg = await getCountFromServer(countQ);
    total = agg.data().count;
  }
  return { items, nextCursor, total };
}

function parseDateInput(v: Date | string): Date | undefined {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v) {
    // Asumimos formato YYYY-MM-DD
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export async function addInvoice(uid: string, invoice: Invoice): Promise<string> {
  const colRef = collection(db, "users", uid, "invoices");
  const invoiceDate = parseDateInput(invoice.invoiceDate);
  const expirationDate = parseDateInput(invoice.expirationDate);

  // elimina propiedades undefined para cumplir con restricciones de Firestore
  const clean = <T extends Record<string, unknown>>(obj: T) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) out[k] = v;
    }
    return out;
  };

  const stampClean = clean({
    name: invoice.stamp?.name,
    companyName: invoice.stamp?.companyName,
    address: invoice.stamp?.address,
    taxId: invoice.stamp?.taxId,
    imgUrl: invoice.stamp?.imgUrl,
  });

  const customerClean = clean({
    name: invoice.customer?.name,
    address: invoice.customer?.address,
    taxId: invoice.customer?.taxId,
    email: invoice.customer?.email,
    phone: invoice.customer?.phone,
  });

  const docToSave: DocumentData = {
    invoiceId: invoice.invoiceId,
    stamp: stampClean,
    invoiceDate: invoiceDate ? Timestamp.fromDate(invoiceDate) : serverTimestamp(),
    expirationDate: expirationDate ? Timestamp.fromDate(expirationDate) : null,
    customer: customerClean,
    items: invoice.items.map((it) => ({
      ...it,
      price: typeof it.price === "string" ? Number(it.price || 0) : it.price,
      code: typeof it.code === "string" && !isNaN(Number(it.code)) ? Number(it.code) : it.code,
    })),
    totals: invoice.totals,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const res = await addDoc(colRef, docToSave);
  return res.id;
}

import { doc, getDoc } from "firebase/firestore";

export async function getInvoice(uid: string, id: string): Promise<Invoice | null> {
  const ref = doc(db, "users", uid, "invoices", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  // Adapt mapInvoice to work with a QueryDocumentSnapshot signature by creating a shim
  const shim = {
    id: snap.id,
    data: () => snap.data() as DocumentData,
  } as unknown as QueryDocumentSnapshot<DocumentData>;
  return mapInvoice(shim);
}
