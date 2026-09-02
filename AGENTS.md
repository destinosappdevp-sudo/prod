# destinos (bt-travel)

> **Single Source of Truth:** este archivo es la configuración canónica para todos los agentes/IDEs.
> `docs/PROYECTO-ARQUITECTURA.md` se auto-carga (rutas, modelos, flujos) — no duplicar su contenido aquí.

Next.js 16 (App Router) + React 19 + Tailwind 3 + Prisma 5 + Supabase. **No hay test runner.**

---

## 🔴 Entornos / Bases de Datos (VERIFICAR ANTES DE CUALQUIER OPERACIÓN)

Hay 2 proyectos Supabase y 3 archivos env:

| Archivo | Supabase | Región | Site | Entorno |
|---------|----------|--------|------|---------|
| `.env` | `hxdhkbiwhrroeffxyxfz` | us-east-1 | verdemo.website | **STAGING** |
| `.env.local` | `rprwpvyubukjsqlcqdde` | us-west-2 | destinos.pro | **PRODUCCIÓN** |
| `.envviejo` | `hxdhkbiwhrroeffxyxfz` | us-east-1 | verdemo.website | **STAGING** (backup) |

### Decision Tree (memorizar)

```
npm run dev / npm run build     → .env.local gana → PRODUCCIÓN (rprw...)
node prisma/*.js / node scripts/*.js → Prisma lee .env → STAGING (hxdhk...)
npx prisma migrate dev / db push     → Prisma lee .env → STAGING (hxdhk...)
Vercel (origin main)            → variables de Vercel → STAGING
Vercel (client main)            → variables de Vercel → PRODUCCIÓN
```

### Reglas inquebrantables

1. **SIEMPRE indicar** en cada operación si se trabaja contra PROD (`rprw...`) o STAGING (`hxdhk...`).
2. **NUNCA ejecutar** `npx prisma db push` ni `migrate dev` sin confirmar explícitamente el entorno destino.
3. **NUNCA borrar datos** de PROD sin confirmación explícita del usuario con la palabra "producción".
4. Ante la duda: `grep NEXT_PUBLIC_SUPABASE_URL .env.local` (PROD) o `grep NEXT_PUBLIC_SUPABASE_URL .env` (STAGING).
5. Scripts standalone que hardcodean URL (ej: `scripts/check-staging.js`) → leer el archivo antes de ejecutar.

---

## 🔀 Flujo de Git

| Remote | Repo | Entorno | Deploy |
|--------|------|---------|--------|
| **origin** | `lord-daxul/zk.git` | **STAGING** (dev) | Vercel auto desde `main` |
| **client** | `destinosappdevp-sudo/prod.git` | **PRODUCCIÓN** | Vercel auto desde `main` |

### Reglas

- **SIEMPRE push solo a `origin main`** (staging/dev).
- **PROHIBIDO** push a `client` salvo orden explícita del usuario ("sube a client" / "deploy a producción").
- Trabajar en ramas `feat/`, `fix/`, `refactor/` → merge a `main` → push `origin main`.
- Para deploy a PROD: solo tras confirmación explícita → `git push client main`.
- **NUNCA** force-push a `main` en ningún remote.

```bash
# Flujo normal (staging)
git checkout main
git merge feat/mi-feature
git push origin main

# Deploy a producción (SOLO con orden explícita)
git push client main
```

---

## 🎚️ Clasificación de Cambios S/M/L

Todo cambio se clasifica **antes** de codear:

| Nivel | Criterio |
|-------|----------|
| **S** (fix-lite) | ≤50 líneas, sin nuevo modelo, sin nueva API route, sin schema change |
| **M** (fix-std) | Una sola capa (frontend XOR backend XOR admin), sin modelo nuevo, sin PII nueva |
| **L** (full) | Nuevo modelo Prisma, nueva API route, >200 líneas, toca 2+ capas, o cualquier Escalation Trigger |

### 🚨 Escalation Triggers (fuerzan nivel L)

1. **Schema change:** modifica `prisma/schema.prisma` (nuevo modelo, campo, enum, relación).
2. **PII:** agrega cédula, teléfono, email, dirección o dato personal a un modelo.
3. **Auth/RLS:** modifica lógica de autenticación, `proxy.ts`, o políticas RLS.
4. **Pagos:** toca `/api/checkout`, `/api/pagomovil/*`, webhooks R4, o flujo de Savings.
5. **Multi-capa:** toca 2+ capas (página pública + API admin, componente + server action, etc.).
6. **Cron jobs:** modifica `/api/cron/*` o `vercel.json`.

> **Regla de oro:** si dudas entre dos niveles, **sube al superior**.

### Requisitos por nivel

| Nivel | Requisitos |
|-------|-----------|
| S | `npx tsc --noEmit` pasa |
| M | `npx tsc --noEmit` + `npm run build` pasan |
| L | `npx tsc --noEmit` + `npm run build` + QA manual en STAGING + confirmación del usuario antes de push |

---

## ✅ Pre-commit Gate (obligatorio)

Antes de cada commit:

```bash
npx tsc --noEmit    # gate confiable, debe dar exit 0
npm run build       # compila todo (usa env PROD pero no muta DB)
```

Además verificar:
- [ ] No hay `console.log` en archivos de producción (permitido en scripts de `prisma/` y `scripts/`)
- [ ] No hay credenciales hardcodeadas
- [ ] Si se tocó `prisma/schema.prisma`: migración creada y aplicada en STAGING
- [ ] Si se tocó un componente con datos: `unstable_noStore()` presente

---

## 🚀 Deploy Protocol

### Staging (automático)
1. Merge a `main` → `git push origin main`
2. Vercel deploya automáticamente
3. Smoke test en verdemo.website

### Producción (manual, solo con orden explícita)
1. Confirmar que staging funciona (smoke test)
2. `git push client main`
3. Vercel deploya automáticamente
4. Smoke test en destinos.pro

### Rollback
```bash
git revert HEAD --no-edit
git push origin main          # staging
git push client main          # prod (solo con orden explícita)
```

---

## 🛡️ Seguridad y Patrones Supabase

### RLS y clientes

| Cliente | Uso | Cuándo |
|---------|-----|--------|
| `createAdminClient()` (`app/lib/supabase/admin.ts`) | Salta RLS | Solo server-side, operaciones admin |
| `createClient()` (`app/lib/supabase/server.ts`) | Respeta RLS | Server components, server actions |
| `createClient()` (`app/lib/supabase/client.ts`) | Browser | Client components |

### Reglas de seguridad

- **NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- **NUNCA** loggear tokens, cookies de sesión, o HMAC secrets.
- Webhooks R4: siempre validar HMAC + IP whitelist + authToken.
- Páginas con datos sensibles: `unstable_noStore()` de `next/cache`.
- `createAdminClient()` solo en server components/API routes — jamás en `"use client"`.

---

## 📦 Comandos

| Comando | Entorno | Uso |
|---------|---------|-----|
| `npm run dev` | PROD (`.env.local`) | Desarrollo local |
| `npm run build` | PROD (`.env.local`) | Build/verificación |
| `npx tsc --noEmit` | — | Typecheck (gate) |
| `npm run seed` | STAGING (`.env`) | Seed de datos |
| `npx prisma migrate dev` | STAGING (`.env`) | Migraciones dev |
| `npx prisma db push` | STAGING (`.env`) | Sync schema (sin migración) |
| `npx prisma generate` | — | Regenerar cliente |
| `node prisma/*.js` | STAGING (`.env`) | Scripts mantenimiento |
| `node scripts/*.js` | STAGING (`.env`) | Scripts utilitarios |

**Lint roto:** `npm run lint` no funciona (Next 16 eliminó `next lint`, ESLint 9 exige flat config). No depender de él.

---

## 🏗️ Convenciones de Código

### Estructura y límites

- Archivos < 1,000 líneas. Si excede, extraer a `_components/` local.
- Componentes en `page.tsx` < 200 líneas → extraer a `app/[ruta]/_components/`.
- Alias: `@/*` → raíz del repo.
- Client components: `"use client"` en primera línea.
- Server components por defecto (sin directiva).

### Prisma

- Cliente canónico: `import prisma from "@/app/lib/db"` (90+ archivos).
- Modelos lowercase (`property_types`, `pagoMovilNotificacion`) → `(prisma as any).modelo`.
- Migraciones: `npx prisma migrate dev --name <feature>_<tabla>`.
- **NUNCA** `db push` en producción.

### UI

- shadcn/ui + Radix para componentes interactivos. Prohibido HTML nativo para inputs/buttons/selects.
- Tailwind para estilos. No CSS modules.
- `lucide-react` para iconos.
- `cn()` de `@/lib/utils` para merge de clases.
- Dark mode: variables CSS en `globals.css`, contraste mínimo 4.5:1.

### Next.js 16

- Middleware vive en `proxy.ts` (no `middleware.ts`).
- Turbopack activo en build.
- `unstable_noStore()` en páginas con datos sensibles.
- API routes: exportar `GET`, `POST`, `PATCH`, `DELETE` como funciones async.
- Server Actions en `app/action.ts` con `"use server"`.

### Idioma

- UI 100% en español.
- Código (variables, funciones, tipos) en inglés.
- Mensajes de error al usuario en español.

---

## 🧪 QA Manual (sin test runner)

Para cambios nivel M/L, verificar en STAGING (verdemo.website):

| Área | Check |
|------|-------|
| Auth | Login, registro, logout, reset password |
| Checkout | Modo DIRECT, MIXED, SAVINGS |
| Pago Móvil | Webhook R4 (si aplica) |
| Admin | Panel carga, CRUD funciona |
| Páginas públicas | `/`, `/destinos`, `/destinos/[slug]` |
| Mobile | Responsive en viewport 375px |

---

## ⚠️ Pitfalls Conocidos

| Pitfall | Solución |
|---------|----------|
| `npm run dev` apunta a PROD | Es by design (`.env.local` gana). Para dev contra staging: borrar temporalmente `.env.local` o usar `dotenv-cli` |
| Scripts Prisma apuntan a STAGING | By design (Prisma lee `.env`). Verificar antes de ejecutar |
| `sharp` en Windows | Si falla install: `npm rebuild sharp` |
| `react-date-range` CSS | Importar `dist/styles.css` + `dist/theme/default.css` en el componente |
| `eslint` no funciona | Next 16 eliminó `next lint`. Usar solo `tsc` como gate |
| `postcss` override | Pinned a `8.5.26` en `overrides` — no cambiar sin verificar Tailwind |
| Modelos Prisma lowercase | Usar `(prisma as any).nombreModelo` |
| `next/image` domina | Agregar dominio a `next.config.mjs` → `images.remotePatterns` |

---

## 📋 Creación de Commits

Formato: `<tipo>(<scope>): <descripción>`

Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`

```
feat(checkout): add mixed payment mode
fix(r4-webhook): validate HMAC before processing
refactor(admin): extract UserTable component
chore(deps): update radix-ui and supabase-js
```

- Mensajes en inglés.
- Máximo 72 caracteres en la primera línea.
- Si el cambio es L, incluir body con contexto.
