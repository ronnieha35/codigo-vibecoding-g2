# Auth Spec

**Status:** ✅ Validated

## Scope

Módulo de autenticación. Cubre:
- Página pública `/login` con formulario username + password
- Integración con `POST /api/v1/auth/token/` → tokens guardados en Zustand (persist)
- Next.js middleware para proteger todas las rutas bajo `/(dashboard)/`
- Redirect automático: sin token → `/login`; login exitoso → `/`
- Layout de dashboard con sidebar que incluye botón logout
- Placeholder de página dashboard home `/`

Auth no tiene tabla, no tiene CRUD. Es el módulo de infraestructura de acceso.

## shadcn components needed

```bash
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
```

> `button` ya instalado por el init de shadcn.

## Tasks

### Types & API — verificar existentes
- [x] 1. Verificar `lib/types/auth.types.ts` — confirmar que `TokenResponse`, `AuthUser`, `AuthState` cubren el contrato del backend. El backend devuelve `{ access, refresh }` en login. ✓ Ya existe y es correcto.
- [x] 2. Verificar `lib/api/auth.api.ts` — confirmar que `authApi.login()` llama `POST /auth/token/` y `authApi.refresh()` llama `POST /auth/token/refresh/`. ✓ Ya existe y es correcto.
- [x] 3. Verificar `lib/stores/auth.store.ts` — confirmar `setTokens`, `setUser`, `logout` + persistencia en localStorage bajo clave `logistaca-auth`. ✓ Ya existe y es correcto.

### Middleware
- [x] 4. Crear `middleware.ts` en raíz del proyecto — interceptar rutas `/(dashboard)/` (matcher: `/((?!login|_next|favicon).*)`) → si no hay token en cookie o header, redirect a `/login`

  > **Nota**: Zustand persiste en localStorage (client-only). El middleware de Next.js corre en Edge Runtime y no accede a localStorage. Solución: al hacer login, guardar el access token también en una cookie HTTP-only. El middleware lee esa cookie.

- [x] 5. Crear `lib/auth/cookies.ts` — helpers para set/get/delete cookie `logistaca-token` (usando `js-cookie` o `cookies-next`)

  > Instalar: `npm install cookies-next`

### Pages
- [x] 6. Crear `app/(auth)/login/page.tsx` — página pública de login (Server Component wrapper que renderiza `<LoginForm />`)
- [x] 7. Crear `app/(dashboard)/layout.tsx` — layout protegido con sidebar. Incluye: logo, links de navegación a cada módulo, botón logout al fondo
- [x] 8. Crear `app/(dashboard)/page.tsx` — dashboard home (placeholder: título "Dashboard" + bienvenida con nombre de usuario)

### Components
- [x] 9. Crear `components/auth/LoginForm.tsx` — `"use client"`. Formulario con React Hook Form + Zod:
  - Campos: `username` (string, required), `password` (string, min 1, required)
  - Submit: llama `authApi.login()` → `setTokens()` + `setUser()` + setea cookie → redirect `/`
  - Estado loading en botón durante submit
  - Error de credenciales inválidas mostrado bajo el formulario (mensaje del backend)

- [x] 10. Crear `components/layout/Sidebar.tsx` — `"use client"`. Sidebar de navegación:
  - Links: Dashboard, Warehouses, Suppliers, Customers, Transport, Drivers, Routes, Shipments
  - Botón logout: llama `useAuthStore.logout()` + elimina cookie + redirect `/login`
  - Resalta link activo con `usePathname()`

### Hooks
- [x] 11. Crear `lib/hooks/useLogin.ts` — `"use client"`. `useMutation` de TanStack Query que wrappea `authApi.login()`:
  - `onSuccess`: llama `setTokens`, `setUser`, setea cookie, router.push('/')
  - `onError`: extrae mensaje de error del backend shape `{ error: {...} }`

## Acceptance criteria

- [ ] Navegar a `http://localhost:3000/` sin token → redirige a `/login`
- [ ] Navegar a `http://localhost:3000/login` con token válido → redirige a `/` (dashboard)
- [ ] Login con credenciales correctas → redirige a dashboard, sidebar visible
- [ ] Login con credenciales incorrectas → muestra error bajo el formulario
- [ ] Botón logout → limpia store + cookie + redirige a `/login`
- [ ] Recarga de página en ruta protegida con token válido → permanece en la ruta
- [ ] Formulario en estado loading durante submit (botón deshabilitado)
- [ ] Sin errores TypeScript (`npm run build` limpio)

## Notas de implementación

- El backend **no tiene endpoint `/me`** — no podemos obtener datos del usuario post-login con el token solamente. Guardar en Zustand solo los datos disponibles: `{ token, refreshToken }`. Omitir `setUser` de momento o guardarlo vacío.
- La cookie debe ser accesible desde el middleware (no HTTP-only si usamos `cookies-next` client-side, o server-action para setearla HTTP-only).
- Usar `cookies-next` para simplicidad: setea cookie accesible desde Edge Runtime en el middleware.
