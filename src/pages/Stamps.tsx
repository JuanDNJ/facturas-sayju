import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import StampMark from '../components/ui/Stamp'
import type { Stamp as StampModel } from '../types/invoice.types'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import DniHelp from '../components/DniHelp'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CustomSelect from '../components/ui/CustomSelect'
import {
  addStamp as addStampFs,
  getStamps as getStampsFs,
  removeStamp as removeStampFs,
  updateStamp as updateStampFs,
  type StampsPage,
} from '../apis/stamps'
import { uploadStampLogo } from '../apis/storage'
import { isValidDNI } from '../utils/validators'
import Icon from '../components/atomic/atoms/Icon'
import EditIcon from '../components/icons/EditIcon'
import TrashIcon from '../components/icons/TrashIcon'
import { ViewEyeIcon } from '../components/icons/ViewEyeIcon'
import { Link } from 'react-router-dom'
import { AddInvoiceIcon } from '../components/icons/AddInvoiceIcon'

export default function Stamps() {
  const { user } = useAuth()
  const { show } = useToast()
  const [stampsList, setStampsList] = useState<StampModel[]>([])
  const [hasNext, setHasNext] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  // (eliminado didInit de migración)
  // Paginación
  const [pageSize, setPageSize] = useState<number>(() => {
    const v = localStorage.getItem('st_pageSize')
    const n = v ? Number(v) : 12
    return Number.isFinite(n) && n > 0 ? n : 12
  })
  const [pageStarts, setPageStarts] = useState<Array<QueryDocumentSnapshot<DocumentData> | null>>([
    null,
  ])
  const [pageIndex, setPageIndex] = useState<number>(0)

  // Filtros/orden
  const [query, setQuery] = useState<string>(() => localStorage.getItem('st_query') || '')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>(
    () => (localStorage.getItem('st_orderDirection') as 'asc' | 'desc') || 'asc'
  )
  // Filtros avanzados eliminados (solo queda búsqueda y orden)
  const [filtersOpen, setFiltersOpen] = useState(false)

  async function loadPage(reset = false) {
    if (!user?.uid) return
    setLoading(true)
    try {
      if (reset) {
        const page: StampsPage = await getStampsFs(user.uid, {
          pageSize,
          cursor: null,
          withTotal: false,
          orderByField: 'name',
          direction: orderDirection,
        })
        setStampsList(page.items)
        setHasNext(Boolean(page.nextCursor))
        setPageStarts([null, page.nextCursor ?? null])
        setPageIndex(0)
      } else {
        // Siguiente página
        const nextIdx = pageIndex + 1
        const start = pageStarts[nextIdx] ?? null
        const page: StampsPage = await getStampsFs(user.uid, {
          pageSize,
          cursor: start,
          withTotal: false,
          orderByField: 'name',
          direction: orderDirection,
        })
        setStampsList(page.items)
        setHasNext(Boolean(page.nextCursor))
        setPageStarts((prev) => {
          const arr = [...prev]
          arr[nextIdx + 1] = page.nextCursor ?? null
          return arr
        })
        setPageIndex(nextIdx)
      }
    } finally {
      setLoading(false)
    }
  }

  async function goToPage(index: number) {
    if (!user?.uid) return
    setLoading(true)
    try {
      const start = pageStarts[index] ?? null
      const page: StampsPage = await getStampsFs(user.uid, {
        pageSize,
        cursor: start,
        withTotal: false,
        orderByField: 'name',
        direction: orderDirection,
      })
      setStampsList(page.items)
      setHasNext(Boolean(page.nextCursor))
      setPageStarts((prev) => {
        const arr = [...prev]
        arr[index + 1] = page.nextCursor ?? null
        return arr
      })
      setPageIndex(index)
    } finally {
      setLoading(false)
    }
  }

  async function resetWithSize(size: number) {
    if (!user?.uid) return
    setLoading(true)
    try {
      const page: StampsPage = await getStampsFs(user.uid, {
        pageSize: size,
        cursor: null,
        withTotal: false,
        orderByField: 'name',
        direction: orderDirection,
      })
      setStampsList(page.items)
      setHasNext(Boolean(page.nextCursor))
      setPageStarts([null, page.nextCursor ?? null])
      setPageIndex(0)
    } finally {
      setLoading(false)
    }
  }

  // Persistir preferencias
  useEffect(() => {
    localStorage.setItem('st_query', query)
  }, [query])
  useEffect(() => {
    localStorage.setItem('st_pageSize', String(pageSize))
  }, [pageSize])
  useEffect(() => {
    localStorage.setItem('st_orderDirection', orderDirection)
  }, [orderDirection])
  // Persistencia de filtros avanzados eliminada

  // Datos filtrados en cliente
  const data = useMemo(() => {
    const q = query.trim().toLowerCase()
    let res = stampsList
    if (q) {
      res = res.filter((s) =>
        [s.name, s.companyName, s.taxId, s.address]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      )
    }
    // Sin filtros avanzados (solo búsqueda)
    return res
  }, [stampsList, query])

  // Reset de paginación visual al cambiar filtros client-side
  useEffect(() => {
    setPageIndex(0)
  }, [query])

  // (Eliminada migración desde datos mock)

  // Carga inicial desde Firestore (independiente de la migración mock)
  useEffect(() => {
    if (!user?.uid) return
    void loadPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const [stampDraft, setStampDraft] = useState<StampModel>({
    name: '',
    companyName: '',
    address: '',
    taxId: '',
    imgUrl: undefined,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string>('')
  const [variant, setVariant] = useState<
    'pagado' | 'anulado' | 'vencido' | 'borrador' | 'personalizado'
  >('personalizado')
  const [angled, setAngled] = useState(false)
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [fontPx, setFontPx] = useState<number>(12)
  const [designerOpen, setDesignerOpen] = useState<boolean>(false)
  // Confirmación de borrado
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)
  const [pendingDelete, setPendingDelete] = useState<StampModel | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

  // Imagen (opcional)
  const [useImage, setUseImage] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      // Revocar URL anterior para evitar fugas
      if (fileUrl) URL.revokeObjectURL(fileUrl)
      const url = URL.createObjectURL(f)
      setFileUrl(url)
      setImageFile(f)
    }
  }

  const previewText = useMemo(() => {
    if (variant !== 'personalizado') return variant.toUpperCase()
    return stampDraft.name || 'LOGO'
  }, [stampDraft.name, variant])

  const activeImage = useMemo(() => {
    if (!useImage) return null
    const url = fileUrl || (imageUrl.trim() ? imageUrl.trim() : null)
    return url
  }, [useImage, fileUrl, imageUrl])

  const imgBoxSize = useMemo(() => {
    // Alinear con Stamp: sm 96x40, md 128x48, lg 160x64
    return size === 'sm' ? 'w-24 h-10' : size === 'lg' ? 'w-40 h-16' : 'w-32 h-12'
  }, [size])

  // Cerrar con tecla ESC cuando el modal está abierto
  useEffect(() => {
    if (!designerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDesignerOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [designerOpen])

  // Evitar scroll del fondo cuando el modal está abierto
  useEffect(() => {
    const original = document.body.style.overflow
    if (designerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = original || ''
    }
    return () => {
      document.body.style.overflow = original || ''
    }
  }, [designerOpen])

  return (
    <section className="space-y-4">
      {/* Modal del diseñador */}
      {designerOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-[var(--bg)]" onClick={() => setDesignerOpen(false)} />
          <div className="panel relative z-50 max-h-[90vh] w-[95vw] max-w-5xl overflow-auto rounded p-4 shadow-lg">
            <div className="mb-3 flex items-start justify-between">
              <h1 className="text-xl font-semibold">Diseñador de sellos</h1>
              <button
                className="btn btn-ghost"
                onClick={() => setDesignerOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Configuración */}
              <div className="panel w-full rounded p-4 lg:max-w-md">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="useImage"
                      type="checkbox"
                      checked={useImage}
                      onChange={(e) => setUseImage(e.target.checked)}
                    />
                    <label htmlFor="useImage" className="text-sm">
                      Usar imagen como logo
                    </label>
                  </div>

                  {useImage && (
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="muted text-sm">URL de la imagen</label>
                        <input
                          className="panel mt-1 w-full rounded px-3 py-2"
                          placeholder="https://..."
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="muted text-sm" htmlFor="uploadImage">
                          Subir imagen
                        </label>
                        <input
                          id="uploadImage"
                          className="panel mt-1 w-full rounded px-3 py-2 file:mr-2 file:rounded file:border-0 file:px-3 file:py-2"
                          type="file"
                          accept="image/*"
                          onChange={onPickFile}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="muted text-sm">Texto del sello</label>
                    <input
                      className="panel mt-1 w-full rounded px-3 py-2"
                      placeholder="Texto / logo"
                      value={stampDraft.name}
                      onChange={(e) =>
                        setStampDraft((s) => ({
                          ...s,
                          name: e.target.value.toUpperCase(),
                        }))
                      }
                      disabled={variant !== 'personalizado' || useImage}
                    />
                    {errors.name && <div className="mt-1 text-xs text-red-600">{errors.name}</div>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="muted text-sm" htmlFor="stampVariant">
                        Variante
                      </label>
                      <CustomSelect
                        id="stampVariant"
                        className="mt-1"
                        value={variant}
                        onChange={(value) => setVariant(value as typeof variant)}
                        options={[
                          { value: 'personalizado', label: 'Personalizado' },
                          { value: 'pagado', label: 'Pagado' },
                          { value: 'anulado', label: 'Anulado' },
                          { value: 'vencido', label: 'Vencido' },
                          { value: 'borrador', label: 'Borrador' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="muted text-sm" htmlFor="stampSize">
                        Tamaño
                      </label>
                      <CustomSelect
                        id="stampSize"
                        className="mt-1"
                        value={size}
                        onChange={(value) => setSize(value as typeof size)}
                        options={[
                          { value: 'sm', label: 'Pequeño' },
                          { value: 'md', label: 'Medio' },
                          { value: 'lg', label: 'Grande' },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Control de tamaño del texto del sello */}
                  <div>
                    <label
                      htmlFor="fontPx"
                      className="muted flex items-center justify-between gap-2 text-sm"
                    >
                      <span>Tamaño del texto</span>
                      <span className="muted text-xs">{fontPx}px</span>
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        className="btn btn-secondary px-2 py-1"
                        onClick={() => setFontPx((v) => Math.max(8, v - 1))}
                        disabled={useImage}
                        title={useImage ? 'No aplica cuando se usa imagen' : 'Disminuir tamaño'}
                      >
                        −
                      </button>
                      <input
                        id="fontPx"
                        type="range"
                        min={8}
                        max={28}
                        step={1}
                        value={fontPx}
                        onChange={(e) => setFontPx(Number(e.target.value))}
                        className="flex-1"
                        disabled={useImage}
                      />
                      <button
                        className="btn btn-secondary px-2 py-1"
                        onClick={() => setFontPx((v) => Math.min(28, v + 1))}
                        disabled={useImage}
                        title={useImage ? 'No aplica cuando se usa imagen' : 'Aumentar tamaño'}
                      >
                        +
                      </button>
                    </div>
                    {useImage && (
                      <div className="muted mt-1 text-xs">
                        El tamaño de texto no aplica cuando se usa imagen.
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={angled}
                      onChange={(e) => setAngled(e.target.checked)}
                    />
                    Inclinación tipo tampón
                  </label>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="muted text-sm">Razón social (opcional)</label>
                      <input
                        className="panel mt-1 w-full rounded px-3 py-2"
                        placeholder="Razón social"
                        value={stampDraft.companyName ?? ''}
                        onChange={(e) =>
                          setStampDraft((s) => ({
                            ...s,
                            companyName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="muted text-sm">DNI</label>
                        <input
                          className="panel mt-1 w-full rounded px-3 py-2"
                          placeholder="77777777A o X1234567L"
                          value={stampDraft.taxId}
                          onChange={(e) =>
                            setStampDraft((s) => ({
                              ...s,
                              taxId: e.target.value,
                            }))
                          }
                          aria-describedby="dni-help"
                        />
                        <DniHelp id="dni-help" />
                        {errors.taxId && (
                          <div className="mt-1 text-xs text-red-600">{errors.taxId}</div>
                        )}
                      </div>
                      <div>
                        <label className="muted text-sm">Dirección</label>
                        <input
                          className="panel mt-1 w-full rounded px-3 py-2"
                          placeholder="Dirección fiscal"
                          value={stampDraft.address}
                          onChange={(e) =>
                            setStampDraft((s) => ({
                              ...s,
                              address: e.target.value,
                            }))
                          }
                        />
                        {errors.address && (
                          <div className="mt-1 text-xs text-red-600">{errors.address}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        if (!user?.uid) return
                        const e: Record<string, string> = {}
                        const hasName = Boolean(stampDraft.name?.trim())
                        const hasCompany = Boolean(stampDraft.companyName?.trim())
                        if (!hasName && !hasCompany) e.name = 'Nombre o razón social requerido'
                        if (!stampDraft.taxId?.trim()) e.taxId = 'DNI requerido'
                        else if (!isValidDNI(stampDraft.taxId)) e.taxId = 'DNI/NIE no válido'
                        if (!stampDraft.address?.trim()) e.address = 'Dirección requerida'
                        setErrors(e)
                        if (Object.keys(e).length > 0) return
                        try {
                          let imgUrlToSave = stampDraft.imgUrl || undefined
                          if (useImage) {
                            if (imageFile) {
                              // Subir a Storage
                              imgUrlToSave = await uploadStampLogo(user.uid, imageFile)
                            } else if (imageUrl.trim()) {
                              imgUrlToSave = imageUrl.trim()
                            }
                          } else {
                            imgUrlToSave = undefined
                          }
                          if (editingId) {
                            await updateStampFs(user.uid, editingId, {
                              ...stampDraft,
                              imgUrl: imgUrlToSave,
                            })
                          } else {
                            await addStampFs(user.uid, {
                              ...stampDraft,
                              imgUrl: imgUrlToSave,
                            } as StampModel)
                          }
                          setEditingId(null)
                          setToast('Sello guardado')
                          setTimeout(() => setToast(''), 1600)
                          await loadPage(true)
                          setDesignerOpen(false)
                        } catch {
                          show('Error al guardar el sello')
                        }
                      }}
                    >
                      Guardar sello
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setStampDraft({
                          name: 'SAYJU',
                          companyName: 'Sayju S.A.',
                          address: 'C/ Ejemplo 123, Madrid',
                          taxId: 'B-12345678',
                        })
                        setUseImage(false)
                        setImageUrl('')
                        setFileUrl(null)
                        setEditingId(null)
                        setErrors({})
                        setToast('')
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>

              {/* Vista previa */}
              <div className="panel min-h-[280px] flex-1 rounded p-4">
                <div className="panel relative aspect-[1.4/1] w-full max-w-xl rounded p-4">
                  <div className="flex h-full w-full items-start justify-start gap-4">
                    {/* Columna del logo/sello, anclada arriba-izquierda */}
                    {activeImage ? (
                      <div
                        className={`${imgBoxSize} flex shrink-0 items-center justify-center overflow-hidden ${
                          angled ? 'origin-top-left -rotate-6' : ''
                        }`}
                      >
                        <img
                          src={activeImage}
                          alt="Logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <StampMark
                        text={previewText}
                        variant={variant}
                        angled={angled}
                        size={size}
                        fontPx={fontPx}
                        className="shrink-0 origin-top-left"
                      />
                    )}

                    {/* Columna de información del emisor */}
                    <div className="muted text-xs sm:text-sm">
                      <div className="font-medium text-[var(--text)] not-italic">
                        {stampDraft.companyName || stampDraft.name}
                      </div>
                      <div>{stampDraft.taxId}</div>
                      <div className="max-w-[260px] truncate">{stampDraft.address}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="panel fixed right-4 bottom-4 rounded px-3 py-2 text-sm shadow"
          role="status"
        >
          {toast}
        </div>
      )}

      {/* Listado de sellos creados */}
      <div className="p-4">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold">Mis sellos</h1>
          <button
            className="flex w-full items-center justify-center gap-2 text-center md:w-auto"
            onClick={() => {
              setDesignerOpen(true)
              setEditingId(null)
              setStampDraft({
                name: 'SAYJU',
                companyName: 'Sayju S.A.',
                address: 'C/ Ejemplo 123, Madrid',
                taxId: 'B-12345678',
                imgUrl: undefined,
              })
              setUseImage(false)
              setImageUrl('')
              setFileUrl(null)
              setErrors({})
            }}
          >
            <Icon className="w-6 text-blue-300">
              <AddInvoiceIcon />
            </Icon>
            <strong className="text-sm">Nuevo sello</strong>
          </button>
        </div>

        {/* Botón de filtros para móvil */}
        <div className="mb-3 md:hidden">
          <button
            className="btn btn-secondary flex w-full items-center justify-center gap-2"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <span>{filtersOpen ? '🔼' : '🔽'}</span>
            <span>{filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
          </button>
        </div>

        {/* Panel de filtros */}
        <div
          className={`${
            filtersOpen ? 'flex' : 'hidden'
          } mb-3 flex-col gap-3 md:flex md:flex-row md:flex-wrap md:items-center`}
        >
          <input
            type="text"
            placeholder="Buscar por nombre, email, DNI, teléfono..."
            className="panel w-full rounded px-3 py-2 md:w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <CustomSelect
            className="w-full text-sm md:w-auto"
            value={orderDirection}
            onChange={(value) => {
              setOrderDirection(value as 'asc' | 'desc')
              setPageIndex(0)
              void loadPage(true)
            }}
            aria-label="Orden por nombre"
            options={[
              { value: 'asc', label: 'Nombre A–Z' },
              { value: 'desc', label: 'Nombre Z–A' },
            ]}
          />
          <div className="flex items-center gap-2">
            <label className="muted text-xs" htmlFor="pageSize">
              Por página
            </label>
            <CustomSelect
              id="pageSize"
              className="text-sm"
              value={pageSize.toString()}
              onChange={(value) => {
                const size = Number(value)
                setPageSize(size)
                setPageIndex(0)
                resetWithSize(size)
              }}
              options={[
                { value: '6', label: '6' },
                { value: '12', label: '12' },
                { value: '24', label: '24' },
              ]}
            />
          </div>
          {loading && <span className="muted text-xs">Cargando…</span>}
        </div>

        {/* Filtros avanzados eliminados */}
        {data.length === 0 ? (
          <div className="muted text-sm">No hay sellos aún.</div>
        ) : (
          <>
            {/* Tabla (md+) */}
            <div className="panel hidden overflow-x-auto rounded md:block">
              <table className="w-full text-sm">
                <thead className="muted text-left">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">DNI</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((s) => (
                    <tr key={s.id} className="border-t border-[var(--panel-border)]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text)]">
                          {s.companyName || s.name}
                        </div>
                        <div className="muted max-w-[360px] truncate text-xs">{s.address}</div>
                      </td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3">{s.taxId || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link to={`/sellos/${s.id}`} className="flex h-8 items-center gap-1 px-3">
                            <Icon className="w-8">
                              <ViewEyeIcon />
                            </Icon>
                          </Link>
                          <button
                            className="flex cursor-pointer items-center gap-1 px-3"
                            onClick={() => {
                              setStampDraft({
                                name: s.name,
                                companyName: s.companyName,
                                address: s.address,
                                taxId: s.taxId,
                                imgUrl: s.imgUrl,
                              })
                              setUseImage(Boolean(s.imgUrl))
                              setImageUrl(s.imgUrl || '')
                              setFileUrl(null)
                              setEditingId(s.id || null)
                              setDesignerOpen(true)
                            }}
                          >
                            <Icon className="w-8">
                              <EditIcon />
                            </Icon>
                          </button>
                          <button
                            className="flex cursor-pointer items-center gap-1 px-3"
                            onClick={() => {
                              setPendingDelete(s)
                              setConfirmOpen(true)
                            }}
                          >
                            <Icon className="w-8">
                              <TrashIcon />
                            </Icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lista en tarjetas (móvil) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {data.map((s) => (
                <div key={s.id} className="panel rounded p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-[var(--text)]">
                        {s.companyName || s.name}
                      </div>
                      <div className="muted max-w-[220px] truncate text-xs">{s.address}</div>
                      <div className="muted text-xs">{s.taxId || '—'}</div>
                    </div>
                    <div className="flex w-[120px] flex-wrap gap-2 sm:w-auto">
                      <button
                        className="btn btn-outline-edit flex h-8 w-full items-center justify-center gap-1 px-3 text-center sm:w-auto"
                        onClick={() => {
                          setStampDraft({
                            name: s.name,
                            companyName: s.companyName,
                            address: s.address,
                            taxId: s.taxId,
                            imgUrl: s.imgUrl,
                          })
                          setUseImage(Boolean(s.imgUrl))
                          setImageUrl(s.imgUrl || '')
                          setFileUrl(null)
                          setEditingId(s.id || null)
                          setDesignerOpen(true)
                        }}
                      >
                        <span>✏️</span>
                        <span>Editar</span>
                      </button>
                      <button
                        className="btn btn-outline-delete flex h-8 w-full items-center justify-center gap-1 px-3 text-center sm:w-auto"
                        onClick={() => {
                          setPendingDelete(s)
                          setConfirmOpen(true)
                        }}
                      >
                        <span>🗑️</span>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Paginación al pie, mismo estilo que Clientes */}
        <div className="mt-3 flex flex-col items-center justify-between gap-2 sm:flex-row sm:items-center">
          <div className="muted w-full text-center text-sm sm:w-auto sm:text-left">
            Página {pageIndex + 1}
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              className="btn btn-secondary w-full sm:w-auto"
              disabled={pageIndex <= 0 || loading}
              onClick={() => {
                if (pageIndex > 0) void goToPage(pageIndex - 1)
              }}
            >
              Anterior
            </button>
            <button
              className="btn btn-secondary w-full sm:w-auto"
              disabled={!hasNext || loading}
              onClick={() => void loadPage(false)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
      {/* Confirmación para eliminar sello */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar sello"
        description={
          pendingDelete
            ? `¿Eliminar el sello "${pendingDelete.companyName || pendingDelete.name}"? Esta acción no se puede deshacer.`
            : '¿Eliminar este sello? Esta acción no se puede deshacer.'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        loading={deleting}
        onCancel={() => {
          if (deleting) return
          setConfirmOpen(false)
          setPendingDelete(null)
        }}
        onConfirm={async () => {
          if (!user?.uid || !pendingDelete?.id) return
          setDeleting(true)
          try {
            await removeStampFs(user.uid, pendingDelete.id)
            if (editingId === pendingDelete.id) setEditingId(null)
            await loadPage(true)
            show('Sello eliminado')
          } catch {
            show('No se pudo eliminar el sello')
          } finally {
            setDeleting(false)
            setConfirmOpen(false)
            setPendingDelete(null)
          }
        }}
      />
    </section>
  )
}
