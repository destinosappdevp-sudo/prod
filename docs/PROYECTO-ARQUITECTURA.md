# Arquitectura del Proyecto - destinos

## 1. Visión General

**Nombre**: destinos (bt-travel)  
**Autor**: FocusDev  
**Versión**: 0.1.0  
**Tipo**: Plataforma de destinos turísticos y reservas de alojamientos para Venezuela

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.4 (App Router) |
| UI | React 19.2.6 |
| Estilos | Tailwind CSS 3.3 + tailwindcss-animate + shadcn/ui |
| Lenguaje | TypeScript 5 |
| ORM/DB | Prisma 5.22 + PostgreSQL (Supabase) |
| Auth + Storage | Supabase (@supabase/ssr 0.8, @supabase/supabase-js 2.105) |
| UI Primitives | Radix UI (Dialog, Dropdown, Label, Popover, Select, Separator, Slot) |
| Iconos | lucide-react |
| Mapas | leaflet + react-leaflet |
| Gráficos | apexcharts + react-apexcharts |
| Email transaccional | Resend 6.1 + @react-email/render |
| Imágenes | sharp 0.34, next/image |
| CSV | papaparse |
| PDF | jspdf + jspdf-autotable |
| DatePicker | react-date-range |
| Storage archivos | @vercel/blob |
| Hosting/Deploy | Vercel (con Crons) |

---

## 2. Estructura de Carpetas

```
destinos/
├── app/                    # Next.js App Router (rutas, layouts, páginas)
│   ├── action.ts          # Server Actions (registro, crear homes, reservas, mensajes)
│   ├── layout.tsx         # Root layout con Navbar, Footer, auth
│   ├── page.tsx           # Home principal (lista destinos)
│   ├── globals.css        # CSS variables (theme light/dark)
│   ├── api/               # API Routes (endpoints REST)
│   ├── admin/             # Panel de administración
│   ├── auth/              # Callbacks de autenticación
│   ├── checkout/          # Flujo de pago
│   ├── contacto/          # Página de contacto
│   ├── destinos/          # Búsqueda y vista de destinos
│   ├── home/              # Vista legacy de paquetes
│   ├── messages/          # Chat entre usuarios
│   ├── my-dashboard/      # Dashboard de usuarios autenticados
│   ├── profile/           # Perfil de usuario
│   ├── reservation/       # Detalle de reservas
│   ├── seats/             # Selección de asientos
│   └── components/        # Componentes cliente del flujo principal
├── components/            # Componentes UI reutilizables (shadcn/ui)
├── lib/                   # Utilidades, helpers, integraciones
├── prisma/                # Schema, migraciones, seeds
├── scripts/               # Scripts de mantenimiento y migración
├── docs/                  # Documentación del proyecto
├── public/                # Assets estáticos (imágenes, manifest PWA)
├── .agents/               # Skills instaladas (supabase, postgres-best-practices)
└── .opencode/             # Agentes personalizados de opencode
    └── agent/             # Definiciones de agentes
```

---

## 3. Rutas de la Aplicación

### 3.1 Rutas Públicas

| Ruta | Propósito |
|------|-----------|
| `/` | Home principal: lista destinos aprobados, banners, filtros |
| `/contacto` | Formulario de contacto con info de redes sociales |
| `/ayuda` | FAQ agrupadas por categoría |
| `/terminos` | Términos y Condiciones |
| `/privacidad` | Política de Privacidad |
| `/login` | Login con AuthPanel (soporta `?mode=register`, `?next=`) |
| `/mantenimiento` | Página estática de mantenimiento |
| `/eliminar-cuenta` | Placeholder de eliminación de cuenta |
| `/destinos` | Home Destinos con chips de categorías, banner carousel |
| `/destinos/[slug]` | Vista detallada de un destino (próximas salidas, reseñas) |
| `/destinos/[categorySlug]/[packageSlug]` | Vista detallada de un paquete específico |
| `/home/[id]` | Vista legacy de un paquete (amenidades, planes Estándar/VIP) |

### 3.2 Rutas Privadas (Autenticadas)

| Ruta | Propósito |
|------|-----------|
| `/my-dashboard` | Dashboard principal con tabs (profile, reservations, favorites, savings) |
| `/my-dashboard/ahorrar` | Redirige a `/checkout/{homeId}?flow=ahorro` |
| `/messages` | Lista de conversaciones |
| `/messages/[userId]` | Chat 1-a-1 |
| `/reservation/[id]` | Detalle completo de reserva |
| `/checkout/[homeId]` | Página de checkout (modos DIRECT/MIXED/SAVINGS) |
| `/seats/[homeId]` | Selección de asientos (VIP/STANDARD) |
| `/seats/[homeId]/passengers` | Selector de cantidad de pasajeros |
| `/my-listing/[id]` | Vista/Edición de un listing por el host |
| `/profile` | Redirige a `/my-dashboard?tab=profile` |
| `/favorites` | Redirige a `/my-dashboard?tab=favorites` |
| `/reservation` | Redirige a `/my-dashboard?tab=reservations` |

### 3.3 Rutas Admin (`/admin/**`)

**Layout**: Verifica sesión Supabase + role (ADMIN o SUPERADMIN)

| Ruta | Propósito |
|------|-----------|
| `/admin` | Dashboard admin: stats, accesos a paneles |
| `/admin/alojamientos` | Lista Homes pendientes (PENDING_APPROVAL), solo SUPERADMIN |
| `/admin/properties` | Lista destinos con conteo Homes |
| `/admin/properties/[id]` | Detalle destino + lista de paquetes + edición |
| `/admin/destinos` | Vista unificada destinos + pasadas + categorías + amenities |
| `/admin/destinos/nuevo` | Form para crear nuevo Destination |
| `/admin/categories` | Lista property_types |
| `/admin/categories/[id]` | Editar/eliminar property_type |
| `/admin/packages/[id]` | Detalle/edición de un Home (paquete) |
| `/admin/pasadas` | Lista paquetes con checkInTime ya pasado |
| `/admin/users` | Lista usuarios (excepto SUPERADMIN) |
| `/admin/users/[userId]` | Editar usuario + documentos |
| `/admin/users/import` | UI de carga CSV |
| `/admin/finanzas` | Vista unificada de finanzas |
| `/admin/payments` | Pagos y reservas |
| `/admin/savings` | Alcancías: lista Savings con status |
| `/admin/withdrawals` | Lista WithdrawalRequest PENDING |
| `/admin/banners` | Gestión de banners (solo SUPERADMIN) |
| `/admin/amenities` | Lista AmenityCategory con Amenities |
| `/admin/pagomovil` | Lista pagoMovilNotificacion |
| `/admin/pagomovil/json-logs` | Lista r4JsonLog |
| `/admin/configuracion` | Renderiza ConfigGroupClient |
| `/admin/reports` | Gráficos ApexCharts |
| `/admin/manual` | Manual de uso del admin |

### 3.4 Auth Callbacks

| Ruta | Propósito |
|------|-----------|
| `/auth/callback` | OAuth callback: intercambia code por session, crea User en Prisma |
| `/auth/forgot-password` | Form que llama a `/api/auth/forgot-password` |
| `/auth/reset-password` | Verifica token_hash/code, formulario nueva contraseña |

### 3.5 API Routes (`/api/**`)

#### Cron Jobs
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/cron/bcv-update` | GET | Diario 00:05 UTC. Aplica `bcvProximaRate` cuando llega fecha |
| `/api/cron/expire-packages` | GET | Diario 06:00 UTC. Marca Homes vencidos como DRAFT |

#### Mantenimiento
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/maintenance-status` | GET | Lee `platformConfig.maintenanceMode` y `isAdmin` |

#### Auth
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/auth/forgot-password` | POST | Envía email de recuperación con Resend |
| `/api/auth/register-mobile` | POST | Registro desde mobile: crea usuario Supabase + Prisma |

#### Pago Móvil R4
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/pagomovil/R4consulta` | POST | Webhook R4 que valida cédula+monto contra pagos PENDING |
| `/api/pagomovil/R4notifica` | POST | Webhook R4 que confirma pagos y crea notificaciones |

#### Pagos
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/checkout` | POST/GET | Lógica de checkout (DIRECT, MIXED, SAVINGS) |
| `/api/checkout/payment-proof` | POST | Sube captura de pago a bucket `images/payments/` |

#### Banners (públicos)
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/banners` | GET | Banners HERO1/HERO2 vigentes |
| `/api/banners/medio` | GET | Banners MEDIO1/MEDIO2 |
| `/api/banners/popup` | GET | Banner POP vigente |

#### Búsqueda pública
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/property-types` | GET | Lista property_types (categorías) |
| `/api/states-with-homes` | GET | Lista de países/estados con Homes APPROVED |
| `/api/search-destinations` | GET | Búsqueda por título (insensitive) |

#### User (autenticado)
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/user/payments` | GET | Lista pagos + savings del usuario |
| `/api/user/savings` | GET/POST | Lista/crea abonos de alcancía |
| `/api/user/documents` | GET | Lista documentos del usuario |
| `/api/user/documents/[id]` | GET/DELETE | Documento individual |
| `/api/user/track-session` | POST | Upsert en `usersessions` |

#### Host (autenticado)
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/host/blocked-dates` | GET | BlockedDates |
| `/api/host/blocked-dates/[id]` | DELETE/UPDATE | Fecha individual |
| `/api/host/homes/[id]/amenities` | POST | Sincroniza amenidades del home |
| `/api/host/properties/[id]` | PATCH | Editar propiedad |
| `/api/host/properties/[id]/duplicate` | POST | Duplicar propiedad |
| `/api/host/withdrawals` | GET | Lista retiros del host |

#### Admin
| Endpoint | Verbo | Propósito |
|----------|-------|-----------|
| `/api/admin/amenities` | GET/POST | Listar/crear amenities |
| `/api/admin/amenities/[id]` | GET/PATCH/DELETE | Amenity individual |
| `/api/admin/amenity-categories` | GET/POST | Categorías |
| `/api/admin/amenity-categories/[id]` | GET/PATCH/DELETE | Categoría individual |
| `/api/admin/banners` | GET/POST | Banners |
| `/api/admin/banners/[id]` | GET/PATCH/DELETE | Banner individual |
| `/api/admin/banners/images` | POST | Subir imagen banner |
| `/api/admin/destinations` | GET/POST | Lista/Crea destinos |
| `/api/admin/destinations/[id]` | GET/PATCH/DELETE | Destino individual |
| `/api/admin/destinations/[id]/packages` | GET/POST | Paquetes dentro de un destino |
| `/api/admin/payments` | GET | Lista pagos |
| `/api/admin/payments/[id]` | GET/PATCH | Confirmar/rechazar pago |
| `/api/admin/properties` | GET/POST | Lista/crea propiedades |
| `/api/admin/properties/[id]` | GET/PATCH | Individual |
| `/api/admin/properties/[id]/delete` | DELETE | Borrar propiedad |
| `/api/admin/properties/[id]/status` | PATCH | Cambiar publishStatus |
| `/api/admin/properties/[id]/manual-reservation` | POST | Crear reserva manual |
| `/api/admin/property-types` | GET/POST | Tipos de propiedad |
| `/api/admin/property-types/[id]` | GET/PATCH/DELETE | Individual |
| `/api/admin/reports/users` | GET | Datos para gráfica usuarios |
| `/api/admin/reports/homes` | GET | Datos homes |
| `/api/admin/reports/payments` | GET | Datos pagos |
| `/api/admin/reports/reservations` | GET | Datos reservas |
| `/api/admin/reservations/resend-email` | POST | Reenviar email de confirmación |
| `/api/admin/savings` | GET/POST | Lista Savings con filtros |
| `/api/admin/savings/[id]` | GET/PATCH | Approve/Reject individual |
| `/api/admin/settings/bcv-rate` | GET/PUT | Tasa BCV |
| `/api/admin/settings/commission` | GET/PUT | Comisión plataforma |
| `/api/admin/settings/maintenance` | GET/PUT | Toggle mantenimiento |
| `/api/admin/settings/my-role` | GET | Role del admin actual |
| `/api/admin/settings/pagomovil` | GET/PUT | Config PagoMovil |
| `/api/admin/settings/sync-users` | POST | Sincroniza usuarios |
| `/api/admin/users` | GET/POST | Lista/crea usuarios |
| `/api/admin/users/[userId]` | GET/PATCH/DELETE | Usuario individual |
| `/api/admin/users/by-cedula` | GET | Buscar por cédula |
| `/api/admin/users/export` | GET | CSV de usuarios |
| `/api/admin/users/import` | POST | Importar CSV |
| `/api/admin/users/role` | PATCH | Cambiar role |
| `/api/admin/withdrawals/[id]` | PATCH | Approve/Reject retiro |

---

## 4. Modelos de Base de Datos

### 4.1 Modelos Principales

#### User
Usuarios del sistema con roles jerárquicos (GUEST < ADMIN < SUPERADMIN).

**Campos clave**: id, email, firstName, role, phoneNumber, isVerified, verificationStatus, cedula, municipalityCode, stateCode, profileImage, address, healthConditions, travelsWithChildren

**Relaciones**: Home, Destination, Favorite, Reservation, Review, Saving, Banner, Message, NotificationPreferences, UserDocument, WithdrawalRequest, AuditLog, usersessions

#### Destination
Destino (categoría padre de paquetes).

**Campos clave**: id, slug (único), title, subtitle, photo, country, municipality, categoryName[], propertyTypeId[], price, priceVip, vipSeats, standardSeats, latitude/longitude, checkInTime, publishStatus, userId

#### Home
Paquete / salida específica.

**Campos clave**: id, title, description, country, municipality, exactAddress, latitude/longitude, price, priceVip, vipSeats, standardSeats, categoryName[], propertyTypeId[], checkInTime, publishStatus (DRAFT/PENDING_APPROVAL/APPROVED/REJECTED), paymentAmount/Bank/Date/Method/Reference, approvalRejectionReason, approvedById, destinationId

#### Reservation
Reserva de un paquete.

**Campos clave**: id, startDate, endDate, nights, totalAmount, status (PENDING/CONFIRMED/CANCELLED/COMPLETED), seatId (único), userId, homeId

#### Payment
Pago de una reserva.

**Campos clave**: id, amount, subtotal, serviceFee, paymentMethod (PAGO_MOVIL/ZELLE/ZILLI/TARJETA_INTERNACIONAL/TRANSFERENCIA_BANCARIA/BINANCE/ZINLI), status (PENDING/CONFIRMED/REJECTED/CANCELLED), bankName, phoneNumber, cedula, referenceNumber, paymentProofUrl, rejectionReason, paymentDetails (JSON), reservationId (único)

#### Saving
Ahorro de alcancía (plan de ahorro).

**Campos clave**: id, userId, date, bcvRate, amountBs, amountUsd, paymentDetails (JSON), status (PENDING/APPROVED/REJECTED), rejectionReason

#### Banner
Banners promocionales.

**Campos clave**: id, title, startDate/endDate, url, clientPhone/Email, cost, imageUrl, tipo (HERO1/HERO2/MEDIO1/MEDIO2/POP), createdById

#### AmenityCategory
Categoría de amenidad.

**Campos clave**: id, name, order, isActive

#### Amenity
Amenidad individual.

**Campos clave**: id, name, iconKey, iconUrl, isActive, categoryId

#### HomeAmenity
Relación Home-Amenity con status.

**Campos clave**: homeId, amenityId, status (YES/NO/UNSPECIFIED)

#### Favorite
Favorito de usuario.

**Campos clave**: userId, homeId?, destinationId? (unique combinations)

#### Review
Reseña de un paquete o destino.

**Campos clave**: rating (1-5), comment, hostReply, stayStartDate/EndDate, homeId/destinationId/userId/reservationId (único)

#### Message
Mensaje entre usuarios.

**Campos clave**: senderId, recipientId, content, isRead, readAt

#### NotificationPreferences
Preferencias de notificación por usuario.

**Campos clave**: userId, email/sms para reservation/review/message/payment

#### UserDocument
Documentos subidos por usuarios.

**Campos clave**: url, fileName, fileSize, mimeType

#### usersessions
Sesiones de dispositivo.

**Campos clave**: user_id, device_id, os, browser, ip_address, location, is_active

#### PlatformConfig
Singleton de configuración de plataforma.

**Campos clave**: commissionPercent, maintenanceMode, bcvRate, bcvRateDate, bcvProximaRate, pagomovilMode (MANUAL/R4), pagomovilPhone/Bank/Cedula/IdComercio/HmacSecret/AuthToken/AllowedIps/CreditoIdComercio/etc

#### BcvRateHistory
Histórico de tasas BCV.

#### BlockedDate
Fechas bloqueadas por Home.

#### WithdrawalRequest
Solicitud de retiro de host.

**Campos clave**: amount, status (PENDING/PROCESSING/COMPLETED/REJECTED), paymentMethod, paymentDetails (JSON), adminNotes, processedAt

#### PackageSeat
Asientos numerados.

**Campos clave**: homeId, zone (VIP/STANDARD), row, column, status (AVAILABLE/OCCUPIED). Unique (homeId, row, column)

#### PagoMovilNotificacion
Notificación cruda de PagoMovil R4.

**Campos clave**: referencia, idComercio, telefonoComercio, telefonoEmisor, bancoEmisor, monto, codigoRed, paymentId, abonado

#### R4JsonLog
Log de payloads raw R4.

**Campos clave**: tipo (CONSULTA/NOTIFICA), rawPayload, clientIp, respuesta

#### AuditLog
Auditoría de acciones.

**Campos clave**: action, userId, details (JSON), ip, userAgent

### 4.2 Enums

- `SeatZone`: VIP, STANDARD
- `SeatStatus`: AVAILABLE, OCCUPIED
- `BannerTipo`: HERO1, HERO2, MEDIO1, MEDIO2, POP
- `AmenityStatus`: YES, NO, UNSPECIFIED
- `PaymentMethod`: PAGO_MOVIL, ZELLE, ZILLI, TARJETA_INTERNACIONAL, TRANSFERENCIA_BANCARIA, BINANCE, ZINLI
- `PaymentStatus`: PENDING, CONFIRMED, REJECTED, CANCELLED
- `SavingStatus`: PENDING, APPROVED, REJECTED
- `PublishStatus`: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
- `ReservationStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED
- `UserRole`: GUEST, ADMIN, SUPERADMIN
- `VerificationStatus`: NOT_SUBMITTED, PENDING, APPROVED, REJECTED
- `WithdrawalStatus`: PENDING, PROCESSING, COMPLETED, REJECTED

---

## 5. Flujos de Negocio Clave

### 5.1 Búsqueda de Destinos → Checkout

1. Usuario visita `/destinos` o `/` → ve lista de destinos aprobados
2. Click en destino → `/destinos/[slug]` → ve próximas salidas y reseñas
3. Click en paquete → `/destinos/[categorySlug]/[packageSlug]` → ve detalle del paquete
4. Botón "Ahorrar" o "Pagar contado" → `/checkout/[homeId]`
5. Checkout detecta modo: DIRECT (pago completo), MIXED (ahorro + pago), SAVINGS (solo ahorro)
6. Si DIRECT/MIXED: selección de asientos → pago → confirmación
7. Si SAVINGS: crea Saving PENDING → admin aprueba → usuario acumula hasta completar

### 5.2 Pago Móvil (Manual y R4)

**Modo Manual**:
1. Usuario selecciona PAGO_MOVIL en checkout
2. Sube captura de pago → `/api/checkout/payment-proof`
3. Admin revisa en `/admin/payments` → confirma o rechaza
4. Si confirma: Payment.status = CONFIRMED, Reservation.status = CONFIRMED

**Modo R4 (automático)**:
1. Usuario selecciona PAGO_MOVIL en checkout
2. Realiza pago desde su banco
3. Banco R4 envía webhook a `/api/pagomovil/R4consulta` (valida cédula+monto)
4. Banco R4 envía webhook a `/api/pagomovil/R4notifica` (confirma pago)
5. Sistema crea PagoMovilNotificacion, actualiza Payment.status = CONFIRMED
6. Envía emails a guest/host

**Autenticación R4**:
- HMAC SHA-256 sobre `Banco+Cedula+Telefono+Monto`
- Whitelist de IPs (AWS us-east-1, us-west-2, eu-west-1)
- authToken en headers

### 5.3 Plan de Ahorro / Alcancía

1. Usuario click "Ahorrar" en paquete → `/checkout/[homeId]?flow=ahorro`
2. Selecciona monto USD → sistema calcula Bs con BCV rate actual
3. Crea Saving PENDING → sube comprobante
4. Admin aprueba en `/admin/savings` → Saving.status = APPROVED
5. Usuario repite hasta acumular monto total del paquete
6. Cuando Saving acumulado >= package.price → puede hacer checkout MIXED (usa ahorro + paga resto)

### 5.4 Aprobación de Propiedades

1. Host crea Home → publishStatus = PENDING_APPROVAL
2. SUPERADMIN revisa en `/admin/alojamientos`
3. Aprueba: publishStatus = APPROVED, Home visible en búsquedas
4. Rechaza: publishStatus = REJECTED, approvalRejectionReason = "..."

### 5.5 Cron Jobs

**BCV Update** (`/api/cron/bcv-update`):
- Diario 00:05 UTC
- Si `bcvProximaRateDate` <= hoy → aplica `bcvProximaRate` como `bcvRate` actual
- Limpia `bcvProximaRate` y `bcvProximaRateDate`

**Expire Packages** (`/api/cron/expire-packages`):
- Diario 06:00 UTC
- UPDATE raw SQL: Home con `publishStatus='APPROVED'` y `checkInTime < NOW()` → `DRAFT`
- Evita que paquetes vencidos aparezcan en búsquedas

---

## 6. Componentes UI Reutilizables

### 6.1 Componentes shadcn/ui (`components/ui/`)

Botones, inputs, dialogs, dropdowns, labels, popovers, selects, separators, slots. Todos envuelven Radix UI primitives con Tailwind.

### 6.2 Componentes de Navegación (`app/components/`)

| Componente | Propósito |
|------------|-----------|
| `Navbar.tsx` | Barra de navegación superior |
| `Footer.tsx` | Pie de página |
| `FooterAccountLinks.tsx` | Enlaces de cuenta en footer |
| `LoggedInBottomNav.tsx` | Navegación inferior para usuarios GUEST logueados |
| `NavigationLoader.tsx` | Indicador de carga entre rutas |
| `UserNav.tsx` | Menú de usuario (server component) |
| `UserNavClient.tsx` | Menú de usuario (client component) |

### 6.3 Componentes de Auth

| Componente | Propósito |
|------------|-----------|
| `AuthPanel.tsx` | Panel de login/registro |
| `AuthDialog.tsx` | Diálogo de autenticación |

### 6.4 Componentes de Listados

| Componente | Propósito |
|------------|-----------|
| `ListingCard.tsx` | Tarjeta de listado |
| `HostListingCard.tsx` | Tarjeta de listado para host |
| `DestinationCard.tsx` | Tarjeta de destino |
| `HostDashboardClient.tsx` | Dashboard de host (91KB) |
| `DashboardClient_min.tsx` | Dashboard de usuario (60KB) |

### 6.5 Componentes de Formularios

| Componente | Propósito |
|------------|-----------|
| `HomeReservationForm.tsx` | Form de reserva |
| `HomeSearchBar.tsx` | Barra de búsqueda |
| `HomeHostInfo.tsx` | Info del host |
| `FormattedDescription.tsx` | Descripción formateada |
| `CheckoutForm.tsx` | Form de checkout (22KB) |
| `ProfileEditClient.tsx` | Edición de perfil (17KB) |

### 6.6 Componentes de Mapas

| Componente | Propósito |
|------------|-----------|
| `Map.tsx` | Mapa individual |
| `MapFilter.tsx` | Filtros de mapa |
| `MultiPinMap.tsx` | Mapa con múltiples pins |
| `MobileMapStrip.tsx` | Strip de mapas para mobile |
| `HomeMap.tsx` | Mapa de home |

### 6.7 Componentes de Asientos

| Componente | Propósito |
|------------|-----------|
| `SeatSelector.tsx` | Selector de asientos |
| `SelectCalendar.tsx` | Calendario de selección |
| `Counter.tsx` | Contador de pasajeros |

### 6.8 Componentes de Banners

| Componente | Propósito |
|------------|-----------|
| `BannerCarousel.tsx` | Carousel de banners |
| `BannerMedio.tsx` | Banner medio |
| `BannerPopup.tsx` | Banner popup |

### 6.9 Componentes Admin (`app/admin/components/`)

| Componente | Propósito |
|------------|-----------|
| `AdminShell.tsx` | Layout del admin |
| `AdminSidebar.tsx` | Sidebar del admin |
| `FinanzasGroupClient.tsx` | Panel de finanzas |
| `ConfigGroupClient.tsx` | Panel de configuración |
| `DestinosGroupClient.tsx` | Panel de destinos |
| `DestinationsClient.tsx` | Lista de destinos |
| `DestinationEditForm.tsx` | Form de edición de destino |
| `CreatePackageFromDestination.tsx` | Crear paquete desde destino |
| `PropertiesClient.tsx` | Lista de propiedades |
| `PropertyEditForm.tsx` | Form de edición de propiedad (30KB) |
| `PropertyDetailTabs.tsx` | Tabs de detalle de propiedad (37KB) |
| `PropertyStatusControl.tsx` | Control de status de propiedad |
| `AlojamientosClient.tsx` | Panel de alojamientos |
| `AmenityManagerClient.tsx` | Gestión de amenities |
| `BannersClient.tsx` | Gestión de banners |
| `BannerList.tsx` | Lista de banners |
| `BannerForm.tsx` | Form de banner |
| `UserManagementClient.tsx` | Gestión de usuarios |
| `EditUserClient.tsx` | Edición de usuario |
| `CategoriesClient.tsx` | Gestión de categorías |
| `ActiveReservationsTable.tsx` | Tabla de reservas activas |
| `SeatMap.tsx` | Mapa de asientos |
| `ReportsPageContent.tsx` | Contenido de reportes |
| `ThemeToggle.tsx` | Toggle de tema |

---

## 7. Convenciones para IAs

### 7.1 Cómo Crear un Nuevo Componente

1. **Ubicación**: 
   - Componentes UI reutilizables: `components/ui/` (usar shadcn/ui)
   - Componentes de flujo: `app/components/`
   - Componentes admin: `app/admin/components/`

2. **Convenciones**:
   - TypeScript strict mode
   - Path aliases: `@/components/ui/button`, `@/lib/utils`
   - Client components: `"use client"` al inicio
   - Server components: por defecto (no necesitan directiva)
   - Tailwind para estilos (no CSS modules)
   - Radix UI primitives para accesibilidad

3. **Ejemplo**:
```tsx
"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MyComponentProps {
  title: string
  className?: string
}

export function MyComponent({ title, className }: MyComponentProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button>{title}</Button>
    </div>
  )
}
```

### 7.2 Cómo Añadir una Nueva Ruta

1. **Página pública**:
   - Crear `app/[ruta]/page.tsx`
   - Server component por defecto
   - Usar `unstable_noStore()` si datos sensibles
   - Metadata export para SEO

2. **Página privada**:
   - Verificar sesión Supabase en server component
   - Redirigir a `/login` si no autenticado
   - Usar `createClient()` de `@/lib/supabase/server`

3. **Página admin**:
   - Crear en `app/admin/[ruta]/page.tsx`
   - Layout admin verifica role (ADMIN/SUPERADMIN)
   - Separar lógica en `*Client.tsx` si es interactivo

4. **API Route**:
   - Crear `app/api/[ruta]/route.ts`
   - Exportar funciones: `GET`, `POST`, `PATCH`, `DELETE`
   - Verificar auth con `createClient()` o `createAdminClient()`
   - Retornar `NextResponse.json()`

**Ejemplo de página**:
```tsx
// app/nueva-ruta/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function NuevaRutaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")
  
  return <div>Contenido</div>
}
```

**Ejemplo de API route**:
```tsx
// app/api/nueva-ruta/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase.from("tabla").select("*")
  
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
```

### 7.3 Cómo Añadir un Modelo/Migración Prisma

1. **Editar schema**:
   - Archivo: `prisma/schema.prisma`
   - Usar PascalCase para modelos
   - Definir relaciones con `@relation`
   - Usar enums para estados

2. **Crear migración**:
```bash
npx prisma migrate dev --name descripcion_cambio
```

3. **Generar cliente**:
```bash
npx prisma generate
```

4. **Usar en código**:
```tsx
import { prisma } from "@/app/lib/db"

const users = await prisma.user.findMany({
  where: { role: "ADMIN" },
  include: { reservations: true }
})
```

**Nota**: Algunos modelos usan `prisma as any` porque tienen nombres en lowercase (property_types, pagoMovilNotificacion, etc).

### 7.4 Patrones Recurrentes

#### Server Actions (`app/action.ts`)
- Funciones async que mutan datos server-side
- Usar `use server` al inicio
- Validar inputs con zod o manualmente
- Retornar `{ success: boolean, error?: string }`

#### unstable_noStore()
- Usar en páginas que leen datos sensibles
- Evita caché de Next.js
- Combinar con `cache: "no-store"` en fetch

#### createAdminClient()
- Salta RLS de Supabase
- Usar solo en server-side
- Para operaciones administrativas

#### HMAC SHA-256 (R4)
- Firma: `Banco+Cedula+Telefono+Monto`
- Librería: `crypto` de Node.js
- Verificar con `secureCompareHex`

#### revalidatePath
- Llamar después de mutaciones críticas
- Invalida caché de rutas específicas

### 7.5 Variables de Entorno

**Supabase**:
- `NEXT_PUBLIC_SUPABASE_URL` - URL pública
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Llave anónima
- `SUPABASE_SERVICE_ROLE_KEY` - Llave admin (server-only)

**Prisma**:
- `DATABASE_URL` - Conexión pooler (pgbouncer)
- `DIRECT_URL` - Conexión directa

**Email**:
- `RESEND_API_KEY` - Llave API Resend
- `RESEND_FROM_EMAIL` - Remitente

**Sitio**:
- `NEXT_PUBLIC_SITE_URL` - URL pública (https://destinos.pro)

**Crons** (Vercel):
- `CRON_SECRET` - Autenticación de crons

**Vercel Blob**:
- `BLOB_READ_WRITE_TOKEN` - Storage de archivos

---

## 8. Reglas de Negocio Importantes

### 8.1 Bootstrap de Roles

- **Primer usuario** registrado automáticamente se convierte en SUPERADMIN
- Función: `getRoleForNewUserBootstrap()` en `lib/user-role-bootstrap.ts`
- Verifica: `ensureAtLeastOneSuperadmin()` después de crear usuario

### 8.2 Modo Mantenimiento

- **Middleware**: `proxy.ts` en raíz del proyecto
- Consulta `/api/maintenance-status` en cada request
- **Bypass**: `/mantenimiento`, `/login`, `/auth`, `/admin`, `/my-dashboard`, `/_next`, `/api`, `/favicon`, `/R4consulta`, `/R4notifica`
- **Flag**: `PlatformConfig.maintenanceMode` (boolean)
- Admins siempre tienen acceso

### 8.3 Roles Jerárquicos

```
GUEST < ADMIN < SUPERADMIN
```

- **GUEST**: Usuario registrado, puede reservar, ahorrar, chatear
- **ADMIN**: Puede gestionar destinos, usuarios, pagos
- **SUPERADMIN**: Puede aprobar propiedades, gestionar banners, configuración crítica

### 8.4 Pago Móvil: Modo R4 vs Manual

**Modo Manual**:
- Usuario sube comprobante
- Admin revisa y confirma manualmente
- Más lento, más control

**Modo R4**:
- Webhooks automáticos del banco
- Validación HMAC + whitelist IP
- Confirmación instantánea
- Configuración en `PlatformConfig.pagomovilMode`

### 8.5 Aprobación de Propiedades

- Solo SUPERADMIN puede aprobar
- Home pasa por estados: DRAFT → PENDING_APPROVAL → APPROVED/REJECTED
- Si REJECTED: debe incluir `approvalRejectionReason`
- Solo APPROVED aparecen en búsquedas públicas

### 8.6 Expiración de Paquetes

- Cron diario a las 06:00 UTC
- Marca como DRAFT los Homes con `checkInTime < NOW()`
- Evita que usuarios reserven paquetes vencidos
- Admin puede reactivar manualmente si es necesario

### 8.7 Plan de Ahorro

- Usuario acumula Savings PENDING → APPROVED
- Cuando suma >= precio del paquete → puede usar en checkout MIXED
- Savings se calculan en USD pero se pagan en Bs (con BCV rate del día)
- Admin debe aprobar cada abono individualmente

### 8.8 Reservas y Asientos

- Cada reserva ocupa un PackageSeat (AVAILABLE → OCCUPIED)
- Zonas: VIP y STANDARD (precios diferentes)
- Si cancela reserva: asiento vuelve a AVAILABLE
- Asientos numerados: row + column (ej: A1, B2)

### 8.9 Banners

- Tipos: HERO1, HERO2 (carrusel), MEDIO1, MEDIO2 (medio), POP (popup)
- Cada banner tiene startDate/endDate
- Solo se muestran banners vigentes
- Solo SUPERADMIN puede gestionar

### 8.10 Tasa BCV

- Se actualiza diariamente via cron
- Puede programarse próxima tasa (`bcvProximaRate` + `bcvProximaRateDate`)
- Se usa para convertir USD → Bs en pagos y ahorros
- Histórico en `BcvRateHistory`

---

## 9. Scripts de Mantenimiento

### 9.1 Scripts Prisma (`prisma/`)

| Script | Propósito |
|--------|-----------|
| `seed.ts` | Crea AmenityCategory + Amenity con iconos Lucide |
| `seed.js` | Versión simplificada con 6 categorías |
| `seed-categories.js` | Seed específico de categorías |
| `seed-amenities.js` | Seed específico de amenidades |
| `migrate-slug.js` | Backfill de slugs en Home |
| `migrate-savings.js` | Migración de Savings |
| `migrate-categories-to-spanish.js` | Renombra categorías a español |
| `backfill-slugs.js` | Backfill masivo de slugs |
| `restore-saving-table.js` | Restaura tabla Saving |
| `restore-home-slug.js` | Restaura columna slug en Home |
| `list-categories.js` | Lista categorías |
| `check-tables.js`, `check-cols.js`, etc | Scripts de inspección/diagnóstico |
| `delete-no-disponible.js` | Borra homes no disponibles |
| `approve-verified-hosts-properties.js` | Auto-aprueba propiedades de hosts verificados |
| `approve-all-properties.js` | Aprueba todas las propiedades |
| `add-saving-payment-details.js` | Añade detalles de pago a Savings |
| `update-category-icons.js` | Actualiza iconos de categorías |

### 9.2 Scripts App (`scripts/`)

| Script | Propósito |
|--------|-----------|
| `update-aws-ip-ranges.js` | Descarga rangos IP AWS para whitelist R4 |
| `stage-test-setup.js` | Marca últimos 3 Homes como APPROVED (testing) |
| `reactivate-packages.js` | Reactiva paquetes vencidos (testing) |
| `migrate-destinations.js` | Migra Homes APPROVED huérfanos → Destinations |
| `fix-cols.js` | ALTER TABLE para renombrar columnas |
| `fix-staging-cols.sql` | SQL fix para staging |
| `check-staging.js` | Diagnóstico de staging |
| `check-homes.js` | Imprime homes recientes en JSON |
| `check-dest-table.js` | Lista columnas de Destination |

---

## 10. Documentación Existente

| Archivo | Tema |
|---------|------|
| `docs/admin-manual.md` | Manual de administración |
| `docs/api-properties-search-spec.md` | Especificación API de búsqueda |
| `docs/vercel-aws-ip-ranges.md` | Rangos IP AWS (markdown) |
| `docs/vercel-aws-ip-ranges.txt` | Lista CIDR (texto plano) |
| `docs/vercel-aws-ip-ranges-summary.md` | Resumen de rangos IP |

---

## 11. Assets Públicos (`public/`)

| Archivo | Tipo |
|---------|------|
| `favicon.webp` | Favicon |
| `logo.png` | Logo |
| `placeholder.webp` | Imagen placeholder |
| `z.webp` | Logo "Z" invertido (legacy) |
| `avatar-default.svg` | Avatar por defecto |
| `next.svg`, `vercel.svg` | SVGs Next.js/Vercel |
| `sw.js` | Service Worker (PWA) |
| `manifest.webmanifest` | PWA manifest |
| `media/` | Imágenes de categorías |
| `screenshot/` | Capturas del manual admin |
| `admin/` | Assets específicos admin |

---

## 12. Configuración de Deploy

### 12.1 Vercel

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Framework**: Next.js
- **Crons** (en `vercel.json`):
  - `bcv-update`: `5 0 * * *` (diario 00:05 UTC)
  - `expire-packages`: `0 6 * * *` (diario 06:00 UTC)

### 12.2 Git Workflow

- **origin**: `https://github.com/lord-daxul/zk.git` (repo principal - SIEMPRE subir aquí)
- **client**: `https://github.com/destinosappdevp-sudo/prod.git` (NUNCA subir sin orden explícita)
- **Rama principal**: `main`
- **Deploy**: Vercel despliega desde `origin/main`

---

## 13. Skills y Agentes

### 13.1 Skills Instaladas

- **supabase**: Guía completa para trabajar con Supabase (RLS, JWT, Data API, Storage)
- **supabase-postgres-best-practices**: Best practices de Postgres/Supabase

### 13.2 Agentes Personalizados (opencode)

Agentes configurados en `.opencode/agent/`:

- **prisma-expert**: Schema, migraciones, queries Prisma
- **supabase-rls**: Políticas RLS y seguridad
- **nextjs-route**: Crear páginas y API routes
- **pago-movil-r4**: Webhooks R4, HMAC, pagos
- **admin-panel**: Trabajar en app/admin/**

---

## 14. Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo
npm run build            # Build de producción
npm run start            # Inicia servidor de producción
npm run lint             # Ejecuta ESLint

# Prisma
npx prisma studio        # Abre Prisma Studio (UI)
npx prisma migrate dev   # Crea y aplica migración
npx prisma generate      # Genera cliente Prisma
npx prisma db push       # Sincroniza schema con DB (sin migración)

# Seeds
npm run seed             # Ejecuta seed.ts

# Scripts
node scripts/check-staging.js    # Diagnóstico de staging
node scripts/check-homes.js      # Ver homes recientes
```

---

## 15. Troubleshooting Común

### 15.1 Error: "Model not found" en Prisma

**Causa**: Cliente Prisma no generado o modelo con nombre incorrecto.

**Solución**:
```bash
npx prisma generate
```

Si el modelo usa lowercase (property_types, pagoMovilNotificacion), usar `prisma as any`.

### 15.2 Error: RLS policy violation

**Causa**: Política RLS bloqueando acceso.

**Solución**:
- Usar `createAdminClient()` para saltar RLS (solo server-side)
- Revisar políticas en Supabase Dashboard → Authentication → Policies

### 15.3 Error: Webhook R4 rechazado

**Causa**: HMAC inválido o IP no en whitelist.

**Solución**:
- Verificar `PlatformConfig.pagomovilHmacSecret`
- Actualizar whitelist: `node scripts/update-aws-ip-ranges.js`
- Revisar logs en `/admin/pagomovil/json-logs`

### 15.4 Error: Middleware bloqueando rutas

**Causa**: `proxy.ts` consultando `/api/maintenance-status` en cada request.

**Solución**:
- Verificar que ruta esté en bypass list
- Desactivar mantenimiento: `/admin/configuracion` → `maintenanceMode = false`

### 15.5 Error: Imágenes no cargan

**Causa**: Dominio no en `next.config.mjs` remotePatterns.

**Solución**:
- Agregar dominio a `images.remotePatterns` en `next.config.mjs`
- Reiniciar servidor de desarrollo

---

**Última actualización**: 2026-07-27
