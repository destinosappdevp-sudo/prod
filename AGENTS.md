# destinos (bt-travel)

Next.js 16 (App Router) + React 19 + Tailwind + Prisma 5 + Supabase. **No hay test runner.** `docs/PROYECTO-ARQUITECTURA.md` se auto-carga (rutas, modelos, flujos) — no duplicar su contenido aquí.

## Entornos / Bases de datos (VERIFICAR ANTES DE CUALQUIER OPERACIÓN)

Hay 2 proyectos Supabase y 3 archivos env:

| Archivo | Supabase | Región | Site | Entorno |
|---------|----------|--------|------|---------|
| `.env` | `hxdhkbiwhrroeffxyxfz` | us-east-1 | verdemo.website | **STAGING** (idéntico a `.envviejo`) |
| `.env.local` | `rprwpvyubukjsqlcqdde` | us-west-2 | destinos.pro | **PRODUCCIÓN** |
| `.envviejo` | `hxdhkbiwhrroeffxyxfz` | us-east-1 | verdemo.website | **STAGING** |

**Gotchas que rompen datos si no se saben:**
- Next.js da precedencia a `.env.local` sobre `.env` → `npm run dev` y `npm run build` apuntan a **PRODUCCIÓN** (`rprw...`).
- Los scripts standalone (`node prisma/*.js`, `node scripts/*.js`) usan Prisma, que auto-carga `.env` → **STAGING** (`hxdhk...`). Algunos script hardcodean URL (ej: `scripts/check-staging.js`).
- **SIEMPRE indicar** en cada operación si se trabaja contra prod (`rprw...`) o staging (`hxdhk...`). Ante la duda, `grep NEXT_PUBLIC_SUPABASE_URL` del archivo env correspondiente.

## Flujo de Git

- **origin** = `lord-daxul/zk.git` → deploy de **STAGING** en Vercel (desde `main`).
- **client** = `destinosappdevp-sudo/prod.git` → **PRODUCCIÓN**. **PROHIBIDO** push a `client` salvo orden explícita ("sube a client").
- Trabajar en ramas feature/fix → merge a `main` → push solo a `origin main`:
  ```bash
  git checkout main
  git merge <feature-branch>
  git push origin main
  ```

## Comandos

- Dev/build: `npm run dev` · `npm run build` · `npm run start`
- **Typecheck** (gate confiable): `npx tsc --noEmit` (actualmente pasa, exit 0)
- **Lint roto**: `npm run lint` (= `next lint`) no existe en Next 16, y ESLint 9 exige flat config pero el repo solo tiene `.eslintrc.json`. No depender de él.
- Seeds: `npm run seed` (`prisma/seed.js`)
- Prisma: `npx prisma migrate dev --name <cambio>` · `npx prisma generate` · `npx prisma db push`

## Convenciones verificadas

- Alias: `@/*` → raíz del repo.
- Cliente Prisma canónico: import default desde `@/app/lib/db` (90+ archivos). Algunos pocos usan `@/app/lib/prisma`.
- Modelos con nombres en lowercase (`property_types`, `pagoMovilNotificacion`, ...) se acceden con `prisma as any`.
- `createAdminClient()` (`app/lib/supabase/admin.ts`) salta RLS — solo server-side. Para el resto: `@/app/lib/supabase/server` o `client`.
- Páginas con datos sensibles: llamar `unstable_noStore()` de `next/cache` (no confiar en la caché de Next).
- Middleware vive en `proxy.ts` (gating de modo mantenimiento), no `middleware.ts`.
- Scripts de mantenimiento uno-off viven tanto en `prisma/` como en `scripts/`; se ejecutan con `node` y apuntan a **STAGING** por defecto.
