# UI Kit – Plan inicial

## Objetivo

Crear un conjunto de componentes reutilizables que unifiquen estilos, mejoren la accesibilidad y reduzcan repetición de código.

## Alcance Fase 1 (bajo riesgo, alto impacto)

- FormField (+ FieldError integrado)
  - Label, control, help, error accesible (aria-describedby)
  - Variantes: input, textarea, select
- Modal (Dialog)
  - Overlay, ESC para cerrar, bloqueo de scroll, role=dialog, aria-modal
- Disclosure (Collapsible)
  - Botón con aria-expanded y contenido asociado aria-controls
- Spinner (ya existente) – se usará por defecto en fallbacks
- PanelHeader & EmptyState (presentacional)

## Alcance Fase 2

- Table primitives (Table, Thead, Tbody, Tr, Th, Td)
- Pagination/Pager y PageSizeSelect
- FilterToolbar (layout de filtros)
- FileInput con vista previa
- ConfirmDialog / useConfirm (para borrar con modal en vez de window.confirm)

## Criterios de aceptación

- Accesibilidad: labels, aria-\*, roles correctos
- Estilos coherentes con variables del tema (panel, muted, etc.)
- Tipado estricto en TS para evitar regresiones
- Integración incremental (una pantalla piloto por componente)

## Estimación

- Fase 1: 7–10 h desarrollo + 3–4 h integración/pruebas
- Fase 2: 6–8 h desarrollo + 4–5 h integración/pruebas

## Riesgos y mitigación

- Cambios visuales mínimos: migración por pantallas
- Validación continua: lint + build + smoke tests tras cada bloque

## Pilotos sugeridos

- FormField: `src/pages/NewClient.tsx`
- Modal: modal de cliente en `src/pages/NewInvoice.tsx`
- Disclosure: secciones colapsables en `InvoiceView`/`NewInvoice`
- Table+Pagination: `Invoices` o `Clients`
