# Git Workflow Rules

## Remote Configuration
- **origin** = `https://github.com/lord-daxul/zk.git` → **STAGING** (usa env viejo)
- **client** = `https://github.com/destinosappdevp-sudo/prod.git` → **PRODUCCIÓN** (usa env local y env de producción)

## Supabase / Database Configuration

### PRODUCCIÓN (`.env` / `.env.local`)
- **Supabase**: `rprwpvyubukjsqlcqdde` (us-west-2)
- **DB Host**: `aws-1-us-west-2.pooler.supabase.com`
- **Site URL**: `https://destinos.pro`
- **Resend API**: `re_6hxdVYgR_...`

### STAGING (`.envviejo`)
- **Supabase**: `hxdhkbiwhrroeffxyxfz` (us-east-1)
- **DB Host**: `aws-1-us-east-1.pooler.supabase.com`
- **Site URL**: `https://verdemo.website`
- **Resend API**: `re_QnW3jW1u_...`

### REGLA PARA IA
- **Cuando revise/consulte staging** → usar `.envviejo` (Supabase `hxdhk...`, DB `hxdhk...`)
- **Cuando trabaje en producción** → usar `.env` (Supabase `rprw...`, DB `rprw...`)
- **SIEMPRE indicar** qué base de datos se está usando en cada operación

## Reglas Obligatorias

### 1. Push Default
- **SIEMPRE** hacer push a `origin/main` (rama `main` del repo lord-daxul/zk)
- El deploy en Vercel está configurado para `main` de origin

### 2. Remote `client`
- **PROHIBIDO** hacer push a `client` salvo orden explícita del usuario
- Si se necesita, el usuario dirá "sube a client" o similar

### 3. Flujo estándar
```bash
git checkout main
git merge <feature-branch>
git push origin main
```

### 4. Ramas
- Trabajo en ramas feature/fix
- Merge a `main` via fast-forward o merge commit
- Push solo a `origin/main`

---

**Recordatorio**: Vercel despliega desde `origin/main`. Cualquier push a `client` sin autorización rompe el flujo.