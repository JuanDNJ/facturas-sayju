# Facturas Sayju – Dashboard mínimo

Proyecto React + TypeScript + Vite con Tailwind, autenticación con Firebase y routing con protección de rutas.

## Estructura principal

- `src/components/layout/`
  - `Sidebar.tsx`: navegación lateral.
  - `Topbar.tsx`: barra superior con buscador/avatar.
  - `Layout.tsx`: contenedor general con `<Sidebar/>`, `<Topbar/>` y `<Outlet/>`.
- `src/pages/`
  - `Dashboard.tsx`
  - `Invoices.tsx`
  - `Settings.tsx`
- `src/App.tsx`: define las rutas con `react-router-dom`.

## Cómo ejecutar

Requisitos: Node 18+.

```bash
npm i
npm run dev
```

Build de producción:

```bash
npm run build
npm run preview
```

## Rutas

- `/` → Dashboard
- `/invoices` → Facturas
- `/settings` → Ajustes

Rutas públicas: `/login`, `/registro`.
Rutas protegidas: resto del dashboard bajo guard.

## Estilos

Tailwind 4 vía `@tailwindcss/vite` ya configurado en `vite.config.ts`. Estilos base en `src/assets/css/root.css`.

## Firebase

Autenticación: registro, login, logout y recuperación de contraseña.
Perfiles de usuario en Firestore: `users/{uid}` con `createAt` y `updateAt` vía `serverTimestamp`.

### Reglas de seguridad de Firestore

Se incluye `firestore.rules` con el siguiente modelo:

- Solo el propietario (mismo `uid`) puede leer y escribir su documento `users/{uid}`.
- Validación básica de campos obligatorios en escritura: `displayName`, `email`, `address`, `nifDni`.

Para desplegar las reglas (requiere Firebase CLI inicializado en el proyecto):

```bash
# Opcional: iniciar Firebase en el proyecto si aún no lo está
firebase init firestore

# Desplegar reglas
firebase deploy --only firestore:rules
```

Nota: asegúrate de tener configuradas las variables de entorno `VITE_...` de Firebase en `.env`.

### Reglas de seguridad de Storage y subida de avatar

Se incluye `storage.rules` para permitir que cada usuario cargue su avatar en `users/{uid}/avatar/*` (máx. 5MB, tipo `image/*`) y lo lea.

Despliegue de reglas de Storage:

```bash
firebase deploy --only storage
```

La vista Perfil en `/settings` permite:

- Pegar una URL pública en el campo "URL de avatar"
- O seleccionar un archivo (PNG/JPG/WEBP/GIF/SVG) para subir a Storage automáticamente; se actualiza `photoURL` en Firebase Auth y la previsualización.
