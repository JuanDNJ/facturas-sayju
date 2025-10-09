import { useRef } from 'react'
import Modal from './Modal'

type ConfirmDialogProps = {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = 'Confirmar',
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) onCancel()
      }}
      title={title}
      size="sm"
      initialFocusRef={confirmBtnRef}
    >
      <div className="space-y-3">
        {description ? <p className="text-sm">{description}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            className={`btn ${danger ? 'btn-danger' : 'btn-secondary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
