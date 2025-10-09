import type { Item, Totals } from '../types/invoice.types'

function toNumber(n: string | number): number {
  if (typeof n === 'number') return n
  const parsed = parseFloat(n)
  return Number.isFinite(parsed) ? parsed : 0
}

export function computeTotals(
  items: Item[],
  vatPercentage: number,
  irpfPercentage: number
): Totals {
  const taxableBase = items.reduce((sum, it) => sum + toNumber(it.price) * (it.quantity || 0), 0)
  const vatAmount = taxableBase * (vatPercentage / 100)
  const taxableBasePlusVat = taxableBase + vatAmount
  const irpfAmount = taxableBase * (irpfPercentage / 100)
  const totalAmount = taxableBasePlusVat - irpfAmount
  return {
    taxableBase,
    vatPercentage,
    vatAmount,
    taxableBasePlusVat,
    irpfPercentage,
    irpfAmount,
    totalAmount,
  }
}
