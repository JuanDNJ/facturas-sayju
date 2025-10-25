# Facturas Sayju — Dashboard de facturación

Aplicación web de facturación con React + TypeScript + Vite y Firebase (Auth, Firestore, Storage, Functions). Permite gestionar clientes, sellos (datos fiscales/plantillas), facturas y recoger sugerencias de usuarios. Incluye guard de autenticación, tema claro/oscuro y vistas optimizadas con carga diferida.

## Características

- Autenticación con Firebase (registro, login, logout, reset de contraseña)
- CRUD de clientes, sellos y facturas (con totales, IVA/IRPF, estados de pago)
- Subida de avatar y logos a Firebase Storage
- Panel con métricas del mes y secciones rápidas
- Impresión de facturas con CSS `@media print`
- Sugerencias de usuario (colección `suggestions`)
- Theming con `data-theme` persistido en `localStorage`
- Carga diferida (React.lazy) y prefetch en el menú lateral

## Stack

- React 19, TypeScript 5, Vite 7, TailwindCSS 4
- Firebase Web SDK (Auth, Firestore, Storage)
- Firebase Hosting + Functions (Node/TS)

## Estructura del proyecto

```
src/
  apis/            # Integraciones con Firebase (auth, firestore, storage)
  components/      # UI (layout, ui, routing)
  context/         # Contextos (auth, toast)
  pages/           # Páginas (Dashboard, Invoices, Clients, Stamps, Settings, ...)
  theme/           # Soporte de tema (light/dark)
  utils/           # Utilidades (totales, validadores)
public/            # Estáticos (favicons, imágenes)
functions/         # Firebase Functions (TypeScript)
```

## Requisitos

- Node.js 18 o superior
- Firebase CLI (opcional para deploy): `npm i -g firebase-tools`

## Puesta en marcha

1) Instalar dependencias

```bash
npm i
```

2) Variables de entorno

Copia `/.env.example` a `/.env` y rellena tus credenciales de Firebase Web App:

```
VITE_API_KEY="..."
VITE_AUTH_DOMAIN="..."
VITE_PROJECT_ID="..."
VITE_STORAGE_BUCKET="..."
VITE_MESSAGING_SENDER_ID="..."
VITE_APP_ID="..."
VITE_MEASUREMENT_ID="..." # opcional
```

3) Desarrollo

```bash
npm run dev
```

4) Build y preview de producción

```bash
npm run build
npm run preview
```

## Scripts útiles

- `npm run dev`: arranca Vite con hot reload
- `npm run build`: compila TypeScript y genera `dist/`
- `npm run preview`: sirve la build de producción
- `npm run lint` / `npm run lint:fix`: ESLint con configuración moderna
- `npm run format` / `npm run format:check`: Prettier (incluye plugin Tailwind)
- `npm run deploy`: build + `firebase deploy`

## Firebase

1) Autenticación

- Habilita el proveedor Email/Password en tu proyecto de Firebase.
- Crea una Web App y copia la configuración al `.env` (variables `VITE_...`).

2) Firestore y Storage (reglas)

Las reglas incluidas implementan un modelo “owner-only” bajo `users/{uid}` y colecciones relacionadas.

Despliegue (requiere Firebase CLI inicializado):

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

3) Functions (opcional)

- Entra a `functions/` y ejecuta `npm i` la primera vez.
- El proyecto incluye un ejemplo `getServerTimestamp` y `setGlobalOptions` para limitar instancias.
- Deploy:

```bash
npm --prefix functions run build
firebase deploy --only functions
```

## Rutas principales

- `/` Dashboard (privada)
- `/invoices`, `/invoices/new`, `/invoices/:id`, `/invoices/:id/edit`
- `/clientes`, `/clientes/nuevo`, `/clientes/:id`
- `/sellos`, `/settings`, `/sugerencias`
- Públicas: `/login`, `/registro`

## Datos en Firestore (modelo)

- `users/{uid}`: perfil del usuario (datos básicos y timestamps)
- `users/{uid}/customers`: clientes
- `users/{uid}/stamps`: sellos (identidad fiscal/plantilla)
- `users/{uid}/invoices`: facturas (items, totales, estado de pago, rectificativas)
- `suggestions`: sugerencias (solo `create` autenticado)

Nota sobre índices/ordenación: Firestore restringe el `orderBy` cuando hay filtros por rango. El listado de facturas alterna entre `invoiceDate` e `invoiceId` para cumplirlo. Si añades filtros adicionales, puede que sean necesarios índices compuestos.

## Estilos y tema

- Tailwind 4 configurado vía plugin `@tailwindcss/vite`.
- Estilos base bajo `src/assets/css/` y tema controlado con `data-theme`.

## Impresión de facturas

- La impresión se realiza desde la vista de factura utilizando `window.print()` y estilos `@media print`. La página `InvoicePrint` está deprecada.

## Contribuir

- Plantilla de PR en `.github/pull_request_template.md`.
- Antes de abrir PR: `npm run lint && npm run build`.

## Consejos y resolución de problemas

- Codificación: usa UTF‑8 para evitar glifos extraños en acentos/emoji.
- Imágenes: las imágenes en `public/png/` son pesadas; considera convertir a WebP/AVIF y cargar bajo demanda.
- Variables `.env`: asegúrate de que los nombres comienzan por `VITE_` para que Vite los exponga al cliente.

---

Si necesitas un pipeline de CI o más automatizaciones (tests de utilidades, optimización de imágenes, despliegue selectivo de funciones), abre un issue y lo planificamos.

