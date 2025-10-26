import { Link } from 'react-router-dom'
import Icon from '../atomic/atoms/Icon'
import { ViewEyeIcon } from '../icons/ViewEyeIcon'
import EditIcon from '../icons/EditIcon'
import TrashIcon from '../icons/TrashIcon'
import type { InvoiceRow } from './types'

interface InvoicesListMobileProps {
  rows: InvoiceRow[]
  onDeleteRequest?: (id: string) => void
}

export default function InvoicesListMobile({ rows, onDeleteRequest }: InvoicesListMobileProps) {
  return (
    <div className="divide-y border-t border-[var(--panel-border)] md:hidden">
      {rows.map((row) => (
        <div key={row.id} className="px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{row.invoiceId}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${row.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                >
                  {row.isPaid ? '✓' : '⏳'}
                </span>
              </div>
              <div className="muted max-w-[70vw] truncate text-xs">{row.customer}</div>
            </div>
            <div className="text-right">
              <div className="text-sm">{row.date}</div>
              <div className="font-semibold">{row.total}</div>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Link to={`/invoices/${row.id}`} className="flex h-8 items-center gap-1 px-3">
              <Icon className="w-8">
                <ViewEyeIcon />
              </Icon>
            </Link>
            {!row.isPaid && (
              <Link to={`/invoices/${row.id}/edit`} className="flex h-8 items-center gap-1 px-3">
                <Icon className="w-8">
                  <EditIcon />
                </Icon>
              </Link>
            )}
            {!row.isPaid && onDeleteRequest && (
              <button
                onClick={() => onDeleteRequest(row.id)}
                className="flex h-8 items-center gap-1 px-3"
              >
                <Icon className="w-8">
                  <TrashIcon />
                </Icon>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
