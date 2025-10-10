export interface Stamp {
  id?: string
  imgUrl?: string
  name: string
  companyName?: string
  address: string
  taxId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Customer {
  id?: string
  name: string
  email?: string
  address: string
  taxId: string
  phone?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Item {
  id?: string
  code: string | number
  description: string
  quantity: number
  price: string | number // String en formularios, number en cálculos
}

export interface Totals {
  taxableBase: number
  vatPercentage: number
  vatAmount: number
  taxableBasePlusVat: number
  irpfPercentage: number
  irpfAmount: number
  totalAmount: number
}

// Estados de pago de facturas
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'

export interface InvoiceStatusInfo {
  status: InvoiceStatus
  paidDate?: Date | string // Fecha cuando se marcó como cobrada
  notes?: string // Notas sobre el pago/estado
}

export interface Invoice {
  id?: string
  invoiceId: string
  stamp: Stamp
  invoiceDate: Date | string
  expirationDate: Date | string
  customer: Customer
  items: Item[]
  totals: Totals
  // Nuevos campos para facturas rectificativas
  invoiceKind?: 'normal' | 'rectificativa'
  rectifiedRef?: string // Nº factura rectificada
  rectifiedDate?: Date | string // Fecha factura rectificada
  rectificationReason?: string // Motivo de rectificación
  createdAt?: Date
  updatedAt?: Date
}
