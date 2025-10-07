import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import StampMark from "../components/ui/Stamp";
import type { Stamp as StampModel } from "../types/invoice.types";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DniHelp from "../components/DniHelp";
import {
  addStamp as addStampFs,
  getStamps as getStampsFs,
  removeStamp as removeStampFs,
  updateStamp as updateStampFs,
  type StampsPage,
} from "../apis/stamps";
import { getUserProfile, saveUserProfile } from "../apis/user";
import { getStamps as getFakeStamps } from "../data/fakeStamps";
import { uploadStampLogo } from "../apis/storage";
import { isValidDNI } from "../utils/validators";

export default function Stamps() {
  const { user } = useAuth();
  const { show } = useToast();
  const [stampsList, setStampsList] = useState<StampModel[]>([]);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const didInit = useRef(false);
  // Paginación
  const [pageSize, setPageSize] = useState<number>(() => {
    const v = localStorage.getItem("st_pageSize");
    const n = v ? Number(v) : 12;
    return Number.isFinite(n) && n > 0 ? n : 12;
  });
  const [pageStarts, setPageStarts] = useState<
    Array<QueryDocumentSnapshot<DocumentData> | null>
  >([null]);
  const [pageIndex, setPageIndex] = useState<number>(0);

  // Filtros/orden
  const [query, setQuery] = useState<string>(
    () => localStorage.getItem("st_query") || ""
  );
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">(
    () => (localStorage.getItem("st_orderDirection") as "asc" | "desc") || "asc"
  );
  const [filtersOpen, setFiltersOpen] = useState<boolean>(() => {
    const v = localStorage.getItem("st_filtersOpen");
    return v ? v === "true" : false;
  });
  const [filterHasImage, setFilterHasImage] = useState<boolean>(() => {
    const v = localStorage.getItem("st_filterHasImage");
    return v ? v === "true" : false;
  });
  const [filterInitial, setFilterInitial] = useState<string>(
    () => localStorage.getItem("st_filterInitial") || ""
  );

  async function loadPage(reset = false) {
    if (!user?.uid) return;
    setLoading(true);
    try {
      if (reset) {
        const page: StampsPage = await getStampsFs(user.uid, {
          pageSize,
          cursor: null,
          withTotal: false,
          orderByField: "name",
          direction: orderDirection,
        });
        setStampsList(page.items);
        setHasNext(Boolean(page.nextCursor));
        setPageStarts([null, page.nextCursor ?? null]);
        setPageIndex(0);
      } else {
        // Siguiente página
        const nextIdx = pageIndex + 1;
        const start = pageStarts[nextIdx] ?? null;
        const page: StampsPage = await getStampsFs(user.uid, {
          pageSize,
          cursor: start,
          withTotal: false,
          orderByField: "name",
          direction: orderDirection,
        });
        setStampsList(page.items);
        setHasNext(Boolean(page.nextCursor));
        setPageStarts((prev) => {
          const arr = [...prev];
          arr[nextIdx + 1] = page.nextCursor ?? null;
          return arr;
        });
        setPageIndex(nextIdx);
      }
    } finally {
      setLoading(false);
    }
  }

  async function goToPage(index: number) {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const start = pageStarts[index] ?? null;
      const page: StampsPage = await getStampsFs(user.uid, {
        pageSize,
        cursor: start,
        withTotal: false,
        orderByField: "name",
        direction: orderDirection,
      });
      setStampsList(page.items);
      setHasNext(Boolean(page.nextCursor));
      setPageStarts((prev) => {
        const arr = [...prev];
        arr[index + 1] = page.nextCursor ?? null;
        return arr;
      });
      setPageIndex(index);
    } finally {
      setLoading(false);
    }
  }

  async function resetWithSize(size: number) {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const page: StampsPage = await getStampsFs(user.uid, {
        pageSize: size,
        cursor: null,
        withTotal: false,
        orderByField: "name",
        direction: orderDirection,
      });
      setStampsList(page.items);
      setHasNext(Boolean(page.nextCursor));
      setPageStarts([null, page.nextCursor ?? null]);
      setPageIndex(0);
    } finally {
      setLoading(false);
    }
  }

  // Persistir preferencias
  useEffect(() => {
    localStorage.setItem("st_query", query);
  }, [query]);
  useEffect(() => {
    localStorage.setItem("st_pageSize", String(pageSize));
  }, [pageSize]);
  useEffect(() => {
    localStorage.setItem("st_orderDirection", orderDirection);
  }, [orderDirection]);
  useEffect(() => {
    localStorage.setItem("st_filtersOpen", String(filtersOpen));
  }, [filtersOpen]);
  useEffect(() => {
    localStorage.setItem("st_filterHasImage", String(filterHasImage));
  }, [filterHasImage]);
  useEffect(() => {
    localStorage.setItem("st_filterInitial", filterInitial);
  }, [filterInitial]);

  // Datos filtrados en cliente
  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    let res = stampsList;
    if (q) {
      res = res.filter((s) =>
        [s.name, s.companyName, s.taxId, s.address]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (filterHasImage) res = res.filter((s) => Boolean(s.imgUrl));
    if (filterInitial) {
      const prefix = filterInitial.toLowerCase();
      res = res.filter((s) =>
        (s.companyName || s.name || "").toLowerCase().startsWith(prefix)
      );
    }
    return res;
  }, [stampsList, query, filterHasImage, filterInitial]);

  // Reset de paginación visual al cambiar filtros client-side
  useEffect(() => {
    setPageIndex(0);
  }, [query, filterHasImage, filterInitial]);

  // Migración inicial desde datos mock si el usuario no tiene sellos aún
  useEffect(() => {
    if (!user?.uid || didInit.current) return;
    didInit.current = true;
    (async () => {
      try {
        // Comprobamos si ya existen sellos; si no, importamos los mock una sola vez
        const existing = await getStampsFs(user.uid, {
          pageSize: 1,
          withTotal: false,
        });
        if (existing.items.length === 0) {
          const profile = await getUserProfile(user.uid);
          if (!profile || !profile.stampsImported) {
            const legacy = getFakeStamps();
            for (const s of legacy) {
              await addStampFs(user.uid, {
                name: s.name,
                companyName: s.companyName,
                address: s.address,
                taxId: s.taxId,
                imgUrl: s.imgUrl,
              } as StampModel);
            }
            await saveUserProfile(user.uid, { stampsImported: true });
            show("Sellos importados");
          }
        }
      } catch {
        // Ignorar silenciosamente errores de migración
      } finally {
        await loadPage(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const [stampDraft, setStampDraft] = useState<StampModel>({
    name: "SAYJU",
    companyName: "Sayju S.A.",
    address: "C/ Ejemplo 123, Madrid",
    taxId: "B-12345678",
    imgUrl: undefined,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string>("");
  const [variant, setVariant] = useState<
    "pagado" | "anulado" | "vencido" | "borrador" | "personalizado"
  >("personalizado");
  const [angled, setAngled] = useState(false);
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [fontPx, setFontPx] = useState<number>(12);
  const [designerOpen, setDesignerOpen] = useState<boolean>(false);

  // Imagen (opcional)
  const [useImage, setUseImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      // Revocar URL anterior para evitar fugas
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      const url = URL.createObjectURL(f);
      setFileUrl(url);
      setImageFile(f);
    }
  };

  const previewText = useMemo(() => {
    if (variant !== "personalizado") return variant.toUpperCase();
    return stampDraft.name || "LOGO";
  }, [stampDraft.name, variant]);

  const activeImage = useMemo(() => {
    if (!useImage) return null;
    const url = fileUrl || (imageUrl.trim() ? imageUrl.trim() : null);
    return url;
  }, [useImage, fileUrl, imageUrl]);

  const imgBoxSize = useMemo(() => {
    // Alinear con Stamp: sm 96x40, md 128x48, lg 160x64
    return size === "sm"
      ? "w-24 h-10"
      : size === "lg"
      ? "w-40 h-16"
      : "w-32 h-12";
  }, [size]);

  // Cerrar con tecla ESC cuando el modal está abierto
  useEffect(() => {
    if (!designerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDesignerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [designerOpen]);

  // Evitar scroll del fondo cuando el modal está abierto
  useEffect(() => {
    const original = document.body.style.overflow;
    if (designerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original || "";
    }
    return () => {
      document.body.style.overflow = original || "";
    };
  }, [designerOpen]);

  return (
    <section className="space-y-4">
      {/* Modal del diseñador */}
      {designerOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-[var(--bg)]"
            onClick={() => setDesignerOpen(false)}
          />
          <div className="relative z-50 w-[95vw] max-w-5xl max-h-[90vh] overflow-auto rounded panel p-4 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-xl font-semibold">Diseñador de sellos</h1>
              <button
                className="rounded px-3 py-2 panel"
                onClick={() => setDesignerOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Configuración */}
              <div className="rounded p-4 panel w-full lg:max-w-md">
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
                        <label className="text-sm muted">
                          URL de la imagen
                        </label>
                        <input
                          className="mt-1 w-full rounded px-3 py-2 panel"
                          placeholder="https://..."
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm muted">Subir imagen</label>
                        <input
                          className="mt-1 w-full rounded px-3 py-2 panel file:mr-2 file:rounded file:border-0 file:px-3 file:py-2"
                          type="file"
                          accept="image/*"
                          onChange={onPickFile}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm muted">Texto del sello</label>
                    <input
                      className="mt-1 w-full rounded px-3 py-2 panel"
                      placeholder="Texto / logo"
                      value={stampDraft.name}
                      onChange={(e) =>
                        setStampDraft((s) => ({
                          ...s,
                          name: e.target.value.toUpperCase(),
                        }))
                      }
                      disabled={variant !== "personalizado" || useImage}
                    />
                    {errors.name && (
                      <div
                        className="text-xs mt-1"
                        style={{ color: "crimson" }}
                      >
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm muted">Variante</label>
                      <select
                        className="mt-1 w-full rounded px-3 py-2 panel"
                        value={variant}
                        onChange={(e) =>
                          setVariant(e.target.value as typeof variant)
                        }
                      >
                        <option value="personalizado">Personalizado</option>
                        <option value="pagado">Pagado</option>
                        <option value="anulado">Anulado</option>
                        <option value="vencido">Vencido</option>
                        <option value="borrador">Borrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm muted">Tamaño</label>
                      <select
                        className="mt-1 w-full rounded px-3 py-2 panel"
                        value={size}
                        onChange={(e) => setSize(e.target.value as typeof size)}
                      >
                        <option value="sm">Pequeño</option>
                        <option value="md">Medio</option>
                        <option value="lg">Grande</option>
                      </select>
                    </div>
                  </div>

                  {/* Control de tamaño del texto del sello */}
                  <div>
                    <label className="text-sm muted flex items-center justify-between gap-2">
                      <span>Tamaño del texto</span>
                      <span className="muted text-xs">{fontPx}px</span>
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        className="rounded px-2 py-1 panel"
                        onClick={() => setFontPx((v) => Math.max(8, v - 1))}
                        disabled={useImage}
                        title={
                          useImage
                            ? "No aplica cuando se usa imagen"
                            : "Disminuir tamaño"
                        }
                      >
                        −
                      </button>
                      <input
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
                        className="rounded px-2 py-1 panel"
                        onClick={() => setFontPx((v) => Math.min(28, v + 1))}
                        disabled={useImage}
                        title={
                          useImage
                            ? "No aplica cuando se usa imagen"
                            : "Aumentar tamaño"
                        }
                      >
                        +
                      </button>
                    </div>
                    {useImage && (
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--muted)" }}
                      >
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
                      <label className="text-sm muted">
                        Razón social (opcional)
                      </label>
                      <input
                        className="mt-1 w-full rounded px-3 py-2 panel"
                        placeholder="Razón social"
                        value={stampDraft.companyName ?? ""}
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
                        <label className="text-sm muted">DNI</label>
                        <input
                          className="mt-1 w-full rounded px-3 py-2 panel"
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
                          <div
                            className="text-xs mt-1"
                            style={{ color: "crimson" }}
                          >
                            {errors.taxId}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm muted">Dirección</label>
                        <input
                          className="mt-1 w-full rounded px-3 py-2 panel"
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
                          <div
                            className="text-xs mt-1"
                            style={{ color: "crimson" }}
                          >
                            {errors.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      className="rounded px-3 py-2 panel"
                      onClick={async () => {
                        if (!user?.uid) return;
                        const e: Record<string, string> = {};
                        const hasName = Boolean(stampDraft.name?.trim());
                        const hasCompany = Boolean(
                          stampDraft.companyName?.trim()
                        );
                        if (!hasName && !hasCompany)
                          e.name = "Nombre o razón social requerido";
                        if (!stampDraft.taxId?.trim())
                          e.taxId = "DNI requerido";
                        else if (!isValidDNI(stampDraft.taxId))
                          e.taxId = "DNI/NIE no válido";
                        if (!stampDraft.address?.trim())
                          e.address = "Dirección requerida";
                        setErrors(e);
                        if (Object.keys(e).length > 0) return;
                        try {
                          let imgUrlToSave = stampDraft.imgUrl || undefined;
                          if (useImage) {
                            if (imageFile) {
                              // Subir a Storage
                              imgUrlToSave = await uploadStampLogo(
                                user.uid,
                                imageFile
                              );
                            } else if (imageUrl.trim()) {
                              imgUrlToSave = imageUrl.trim();
                            }
                          } else {
                            imgUrlToSave = undefined;
                          }
                          if (editingId) {
                            await updateStampFs(user.uid, editingId, {
                              ...stampDraft,
                              imgUrl: imgUrlToSave,
                            });
                          } else {
                            await addStampFs(user.uid, {
                              ...stampDraft,
                              imgUrl: imgUrlToSave,
                            } as StampModel);
                          }
                          setEditingId(null);
                          setToast("Sello guardado");
                          setTimeout(() => setToast(""), 1600);
                          await loadPage(true);
                          setDesignerOpen(false);
                        } catch {
                          show("Error al guardar el sello");
                        }
                      }}
                    >
                      Guardar sello
                    </button>
                    <button
                      className="rounded px-3 py-2 panel"
                      onClick={() => {
                        setStampDraft({
                          name: "SAYJU",
                          companyName: "Sayju S.A.",
                          address: "C/ Ejemplo 123, Madrid",
                          taxId: "B-12345678",
                        });
                        setUseImage(false);
                        setImageUrl("");
                        setFileUrl(null);
                        setEditingId(null);
                        setErrors({});
                        setToast("");
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </div>

              {/* Vista previa */}
              <div className="flex-1 rounded p-4 panel min-h-[280px]">
                <div className="relative w-full max-w-xl aspect-[1.4/1] rounded panel p-4">
                  <div className="h-full w-full flex items-start justify-start gap-4">
                    {/* Columna del logo/sello, anclada arriba-izquierda */}
                    {activeImage ? (
                      <div
                        className={`${imgBoxSize} flex items-center justify-center overflow-hidden shrink-0 ${
                          angled ? "-rotate-6 origin-top-left" : ""
                        }`}
                      >
                        <img
                          src={activeImage}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
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
                    <div className="text-xs sm:text-sm muted">
                      <div className="font-medium not-italic text-[var(--text)]">
                        {stampDraft.companyName || stampDraft.name}
                      </div>
                      <div>{stampDraft.taxId}</div>
                      <div className="truncate max-w-[260px]">
                        {stampDraft.address}
                      </div>
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
          className="fixed bottom-4 right-4 rounded panel px-3 py-2 text-sm shadow"
          role="status"
        >
          {toast}
        </div>
      )}

      {/* Listado de sellos creados */}
      <div className="rounded p-4 panel">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold">Mis sellos</h2>
            <button
              className="rounded px-3 py-2 panel"
              onClick={() => {
                setDesignerOpen(true);
                setEditingId(null);
                setStampDraft({
                  name: "SAYJU",
                  companyName: "Sayju S.A.",
                  address: "C/ Ejemplo 123, Madrid",
                  taxId: "B-12345678",
                  imgUrl: undefined,
                });
                setUseImage(false);
                setImageUrl("");
                setFileUrl(null);
                setErrors({});
              }}
            >
              Nuevo sello
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre, razón social, NIF..."
              className="rounded px-3 py-2 panel w-full sm:w-64"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="rounded px-2 py-1 panel text-sm w-full sm:w-auto"
              value={orderDirection}
              onChange={(e) => {
                setOrderDirection(e.target.value as "asc" | "desc");
                setPageIndex(0);
                void loadPage(true);
              }}
              aria-label="Orden por nombre"
            >
              <option value="asc">Nombre A–Z</option>
              <option value="desc">Nombre Z–A</option>
            </select>
            <button
              type="button"
              className="rounded px-3 py-2 panel sm:hidden w-full"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
            <label className="muted text-xs">Por página</label>
            <select
              className="rounded px-2 py-1 panel text-sm"
              value={pageSize}
              onChange={(e) => {
                const size = Number(e.target.value);
                setPageSize(size);
                setPageIndex(0);
                resetWithSize(size);
              }}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
            <div className="flex items-center gap-1">
              <button
                className="rounded px-2 py-1 panel text-sm"
                onClick={() => {
                  if (pageIndex > 0) void goToPage(pageIndex - 1);
                }}
                disabled={loading || pageIndex === 0}
                title="Anterior"
              >
                ←
              </button>
              <span className="muted text-xs">Página {pageIndex + 1}</span>
              <button
                className="rounded px-2 py-1 panel text-sm"
                onClick={() => void loadPage(false)}
                disabled={loading || !hasNext}
                title="Siguiente"
              >
                →
              </button>
            </div>
            {loading && <span className="muted text-xs">Cargando…</span>}
          </div>
        </div>

        {/* Filtros avanzados */}
        <div
          className={`${
            filtersOpen ? "grid" : "hidden"
          } sm:grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3`}
        >
          <label className="flex items-center gap-2 rounded px-3 py-2 panel">
            <input
              type="checkbox"
              checked={filterHasImage}
              onChange={(e) => setFilterHasImage(e.target.checked)}
            />
            <span className="text-sm">Solo con imagen</span>
          </label>
          <div className="rounded px-3 py-2 panel">
            <label className="muted block mb-1 text-sm" htmlFor="initialFilter">
              Inicial del nombre
            </label>
            <select
              id="initialFilter"
              className="w-full rounded px-3 py-2 panel"
              value={filterInitial}
              onChange={(e) => setFilterInitial(e.target.value)}
            >
              <option value="">Todas</option>
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="button"
              className="rounded px-3 py-2 panel w-full sm:w-auto"
              aria-label="Limpiar filtros"
              onClick={async () => {
                setQuery("");
                setFilterHasImage(false);
                setFilterInitial("");
                await loadPage(true);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
        {data.length === 0 ? (
          <div className="muted text-sm">
            No hay sellos aún. Crea uno con el formulario.
          </div>
        ) : (
          <div className="flex flex-col gap-3 lg:max-w-3xl mx-auto">
            {data.map((s) => (
              <div
                key={s.id}
                className="rounded p-3 panel text-sm flex items-center gap-3 justify-between"
              >
                <div className="flex items-center gap-3">
                  {s.imgUrl ? (
                    <img
                      src={s.imgUrl}
                      alt={s.companyName || s.name}
                      className="w-16 h-10 object-contain"
                    />
                  ) : (
                    <StampMark text={s.name} size="sm" angled={false} />
                  )}
                  <div>
                    <div className="font-medium">{s.companyName || s.name}</div>
                    <div className="muted text-xs">{s.taxId}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded px-2 py-1 panel"
                    onClick={() => {
                      setStampDraft({
                        name: s.name,
                        companyName: s.companyName,
                        address: s.address,
                        taxId: s.taxId,
                        imgUrl: s.imgUrl,
                      });
                      setUseImage(Boolean(s.imgUrl));
                      setImageUrl(s.imgUrl || "");
                      setFileUrl(null);
                      setEditingId(s.id || null);
                      setDesignerOpen(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded px-2 py-1 panel"
                    onClick={async () => {
                      if (!user?.uid || !s.id) return;
                      if (!confirm("¿Eliminar este sello?")) return;
                      try {
                        await removeStampFs(user.uid, s.id);
                        if (editingId === s.id) setEditingId(null);
                        await loadPage(true);
                        show("Sello eliminado");
                      } catch {
                        show("No se pudo eliminar el sello");
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
