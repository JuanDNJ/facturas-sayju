# UI Kit – Pull Request Template

## Resumen

- Objetivo: Unificar estilos, accesibilidad y reducir repetición mediante componentes reutilizables.
- Alcance inicial: FormField, Modal (Dialog), Disclosure, PanelHeader/EmptyState y uso de Spinner.
- Enfoque: Integración incremental por pantallas con validación (lint + build) tras cada bloque.

## Cambios propuestos (Fase 1)

- FormField (+FieldError): label, help, error accesible (aria-describedby). Variantes: input, textarea, select.
- Modal: overlay, cierre con ESC, bloqueo de scroll, role=dialog, aria-modal.
- Disclosure: botón controlado con aria-expanded y aria-controls.
- PanelHeader/EmptyState: componentes presentacionales comunes.
- Fallbacks: usar Spinner existente por defecto.

## Plan de adopción

- Piloto FormField: src/pages/NewClient.tsx
- Piloto Modal: flujo en src/pages/NewInvoice.tsx
- Piloto Disclosure: secciones en InvoiceView/NewInvoice
- Piloto Table+Pagination (Fase 2): Invoices o Clients

## Checklist

- [ ] Lint (ESLint/Prettier) sin errores
- [ ] Build de producción pasa
- [ ] A11y: labels/roles/aria conformes
- [ ] Tipado TS estricto
- [ ] Cambios visuales acordes al tema

## Pruebas y validación

- Navegación y formularios básicos en las vistas piloto.
- Verificar focus-trap, scroll lock y cierre por ESC en Modal.

## Riesgos y mitigación

- Cambios visuales mínimos: migración por pantallas.
- Validación continua tras cada componente.

## Documentación

- Ver docs/ui-kit-plan.md para detalles, criterios y estimaciones.
