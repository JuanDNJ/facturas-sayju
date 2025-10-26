import { Link } from 'react-router-dom'
import Icon from '../atomic/atoms/Icon'
import { ViewEyeIcon } from '../icons/ViewEyeIcon'
import EditIcon from '../icons/EditIcon'
import TrashIcon from '../icons/TrashIcon'
import type { InvoiceRow } from './types'

interface InvoicesTableProps {
  rows: InvoiceRow[]
  onDeleteRequest?: (id: string) => void
}

export default function InvoicesTable({ rows, onDeleteRequest }: InvoicesTableProps) {
  return (
    <div className="hidden md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-3 py-2">Factura</th>
            <th className="px-3 py-2">Cliente</th>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--panel-border)]">
              <td className="px-3 py-2">{row.invoiceId}</td>
              <td className="px-3 py-2">{row.customer}</td>
              <td className="px-3 py-2">{row.date}</td>
              <td className="px-3 py-2 text-right">{row.total}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${row.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                >
                  {row.isPaid ? '✓ Cobrada' : '⏳ Pendiente'}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Link to={`/invoices/${row.id}`} className="flex h-8 items-center gap-1 px-3">
                    <Icon className="w-8">
                      <ViewEyeIcon />
                    </Icon>
                  </Link>
                  {!row.isPaid && (
                    <Link
                      to={`/invoices/${row.id}/edit`}
                      className="btn btn-outline-edit flex h-8 items-center gap-1 px-3"
                    >
                      <Icon className="w-8">
                        <EditIcon />
                      </Icon>
                    </Link>
                  )}
                  {!row.isPaid && onDeleteRequest && (
                    <button
                      onClick={() => onDeleteRequest(row.id)}
                      className="btn btn-outline-delete flex h-8 items-center gap-1 px-3"
                    >
                      <Icon className="w-8">
                        <TrashIcon />
                      </Icon>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
