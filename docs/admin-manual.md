# Manual de Administración — Destinos Venezuela

![Logo](../public/logo.png)

Bienvenido al manual de administración de **Destinos Venezuela**, plataforma de paquetes turísticos. Aquí encontrarás una guía completa de cada sección del panel administrativo.

---

## Índice

1. [Dashboard](#dashboard)
2. [Usuarios](#usuarios)
3. [Paquetes](#paquetes)
4. [Categorías](#categorías)
5. [Servicios (Amenities)](#servicios-amenities)
6. [Finanzas](#finanzas)
7. [Alcancía (Savings)](#alcancía-savings)
8. [Publicidad / Banners](#publicidad--banners)
9. [Aprobación de Propiedades](#aprobación-de-propiedades)
10. [Informes](#informes)
11. [Configuración](#configuración)

---

## Dashboard

**Ruta:** `/admin`

Vista principal con métricas generales del sistema. Muestra:

- **Fecha y hora** del servidor en hora Venezuela (VET)
- **Tasa BCV** del día configurada en la plataforma
- **Tarjetas de resumen:** Total de usuarios, paquetes registrados, alcancías creadas, y monto total ahorrado en USD
- **Alertas:** Enlaces directos a pagos pendientes y depósitos de alcancía por revisar
- **Accesos directos** a Configuración y al Manual de Admin

---

## Usuarios

**Ruta:** `/admin/users`

### Listado de usuarios
Tabla paginada (10 por página) con todos los usuarios registrados (excepto SUPERADMIN). Cada fila muestra: avatar, nombre, cédula, email, cantidad de favoritos y reservas, total ahorrado.

### Acciones
- **Crear usuario manualmente:** formulario con nombre, email, contraseña, cédula, teléfono y rol (Usuario/Admin)
- **Importar CSV:** carga masiva desde archivo CSV con separador automático (`,` o `;`). Columnas soportadas: Nombre y Apellido, Correo electrónico, Cédula, Fecha de Nacimiento, Teléfono, Dirección, Viaja con niños, etc.
- **Exportar usuarios:** descarga CSV de todos los usuarios
- **Editar usuario:** abre la página de detalle con formulario completo
- **Ver ahorros:** enlace directo a los depósitos de alcancía del usuario

### Filtros
- Búsqueda por nombre, email o cédula
- Filtro por rol: Todos / Usuarios / Admin

### Editar Usuario

**Ruta:** `/admin/users/[id]`

Formulario completo de edición:

- **Información personal:** nombre, email, cédula, teléfono, fecha de nacimiento, teléfono de emergencia, dirección, condiciones de salud
- **Preferencias de viaje:** checkbox "Ha viajado con Destinos", "Viaja con niños"
- **Rol y permisos:** selector de rol (Usuario/Admin) con estadísticas del usuario
- **Cambiar contraseña:** dos campos con toggle de visibilidad
- **Documentos:** visualización de documentos subidos
- **Eliminar usuario:** solo SUPERADMIN, requiere confirmación escribiendo el email

### Ver Ahorros del Usuario

**Ruta:** `/admin/users/[id]/savings`

Dos pestañas:

1. **Historial de depósitos:** tabla con fecha, referencia, comprobante, tasa BCV, monto Bs, monto USD, estado (En revisión/Aprobado/Rechazado), y botones de Aprobar/Rechazar
2. **Detalle de ahorros:** tabla con alcancías (general o por paquete), tipo, monto USD, equivalente Bs, cantidad de movimientos

---

## Paquetes

**Ruta:** `/admin/properties`

### Listado de paquetes
Tabla paginada con: título, ubicación (estado - municipio), fecha de salida, cupos, cantidad de reservas, usuarios ahorrando, estado (selector desplegable inline), y acciones.

### Pestadas
- **Paquetes:** listado principal con búsqueda por título, email o categoría
- **Reservas Activas:** tabla de reservas confirmadas próximas con datos del usuario, paquete, fechas, noches, total USD/BS, método de pago, estado, y botón para reenviar email de confirmación

### Acciones
- **Nuevo Paquete:** formulario completo de creación
- **Ver/Editar:** página de detalle del paquete
- **Eliminar:** con confirmación
- **Cambiar estado:** selector inline (Borrador / Pendiente / Activa / Inactiva)

### Crear/Editar Paquete

**Ruta:** `/admin/properties/new` | `/admin/properties/[id]`

Formulario con las siguientes secciones:

1. **Información básica:** título, categorías (multiselección), descripción con formato básico (`**negrita**` y `[center]texto[/center]`)
2. **Características:** cupos totales (auto-calculado), zona VIP (pares), zona estándar (pares)
3. **Ubicación y precio:** estado, municipio, precio estándar, precio VIP
4. **Datos del paquete:** fecha y hora de salida, número de contacto, punto de partida
5. **Servicios:** selector de amenities con estado Sí/No/Sin especificar
6. **Imagen:** carga de imagen del paquete (recomendado 3:2, 960x640px)

### Detalle del Paquete
Cinco pestañas:

1. **Reservas Confirmadas:** lista de reservas con usuario, fechas, asiento, plan, pago
2. **Usuarios Ahorrando:** lista con monto ahorrado, restante y plan
3. **Asientos:** mapa visual tipo bus con zonas VIP y Estándar, asientos ocupados con tooltip del ocupante
4. **Reservar:** formulario para crear reserva manual o abono a alcancía
5. **Descargar PDF:** genera reporte en PDF con info del paquete, ahorradores y asientos asignados

### Cómo hacer una reserva manual (paso a paso)

Desde la pestaña **Reservar** en el detalle del paquete:

1. **Buscar usuario por cédula:** ingresa la cédula (ej. `V-12345678`) y haz clic en "Buscar". Si el usuario existe, se mostrarán sus datos (nombre, email, cédula) en un recuadro azul.

2. **Seleccionar tipo de operación:**
   - Por defecto es **Pagar de contado** (reserva completa).
   - Si el usuario va a abonar en partes, marca el check **"Ahorrar"**.

3. **Elegir tipo de cupo:** selecciona **Estándar** o **Premium VIP** según el plan del usuario.

4. **Indicar cantidad de cupos:** número de personas que viajan. El monto estimado se calcula automáticamente (precio × cupos).

5. **Si es modo ahorro:** completa el **monto del abono inicial en USD** y la **fecha de inicio/abono**. El abono debe ser menor al monto total.

6. **Seleccionar asientos:** el mapa de asientos se habilita solo después de tener un usuario y (en modo ahorro) un monto válido. Haz clic en los asientos disponibles (mismos que el tipo de cupo seleccionado). Debes seleccionar la misma cantidad que los cupos indicados.

7. **Datos de pago:** completa teléfono Pago Móvil, banco emisor, referencia y cédula del pagador.

8. **Observaciones:** notas internas (opcional).

9. **Finalizar:** haz clic en "Registrar Reserva Manual" (pago completo) o "Registrar ahorro específico" (abono inicial). El sistema crea la reserva y asigna los asientos automáticamente.

---

## Categorías

**Ruta:** `/admin/categories`

Gestión de tipos de paquete (categorías). Cada categoría tiene un nombre y un ícono.

### Acciones
- **Crear categoría:** formulario con nombre e ícono
- **Ver/Editar:** nombre, ícono, guardar cambios
- **Eliminar:** con confirmación

---

## Servicios (Amenities)

**Ruta:** `/admin/amenities`

### Grupos de servicios
- **Crear grupo:** nombre y orden numérico
- **Activar/Desactivar:** toggle por grupo

### Servicios individuales
- **Crear servicio:** nombre, icon key, icon URL, grupo asociado
- **Activar/Desactivar:** toggle por servicio

Los servicios se muestran agrupados por categoría en el formulario de edición de paquetes.

---

## Finanzas

**Ruta:** `/admin/payments`

### Resumen
Cuatro tarjetas: ingresos confirmados (USD+Bs), alcancías activas, monto en alcancías (USD+Bs), pagos confirmados.

### Movimientos combinados
Tabla unificada de pagos y abonos de alcancía con:
- Fecha, tipo (Abono/Pago), usuario, paquete, total USD+Bs, método de pago, referencia, comprobante, estado
- **Confirmar pago:** botón verde para pagos pendientes
- **Rechazar pago:** botón rojo, requiere motivo

Alerta amarilla si hay pagos pendientes de confirmación.

---

## Alcancía (Savings)

**Ruta:** `/admin/savings`

### Resumen
Tres tarjetas: pendientes de revisión (cantidad + USD), aprobado total (USD), total de depósitos.

### Depósitos
Tabla con fecha, usuario, referencia, comprobante, tasa BCV, monto Bs, monto USD, estado, y acciones (Aprobar/Rechazar).

### Abonar a Alcancía
Modal con:
- **Usuario:** búsqueda autocompletada por cédula, nombre o email
- **Alcancía existente:** selector de wallets del usuario (general o por paquete) con saldo actual y meta restante
- **Monto USD:** con cálculo automático de Bs según tasa BCV
- **Fecha del depósito:** permite fechas históricas

---

## Publicidad / Banners

**Ruta:** `/admin/banners` (Solo SUPERADMIN)

Tres pestañas: Añadir Banner, Banners Activos, Banners Inactivos.

### Tipos de Banner
| Tipo | Ubicación |
|------|-----------|
| HERO1 | Hero principal |
| HERO2 | Hero secundario |
| MEDIO1 | Banner mitad de página |
| MEDIO2 | Banner mitad de página alterno |
| POP | Popup / modal |

### Crear Banner
Campos: título, tipo, fecha inicio, fecha fin, URL destino, teléfono, email, costo (USD), imagen. La imagen se puede subir nueva o seleccionar del archivo. Recomendado 400x200px (2:1).

### Listado
Tarjetas con código de color según tipo, imagen, título, período, enlace, costo, contacto. Botones de editar y eliminar.

---

## Aprobación de Propiedades

**Ruta:** `/admin/alojamientos` (Solo SUPERADMIN)

Cola de aprobación para propiedades en estado `PENDING_APPROVAL`. Vista en tarjetas con:
- Imagen del paquete
- Título, ubicación, precio
- Información del creador
- Botones **Aprobar** (verde) y **Rechazar** (rojo, con motivo requerido)

---

## Informes

**Ruta:** `/admin/reports` (Solo SUPERADMIN)

Cuatro gráficos con ApexCharts:

1. **Crecimiento de Usuarios:** gráfico de barras
2. **Publicaciones por Mes:** gráfico de barras
3. **Ingresos Mensuales:** gráfico de líneas
4. **Análisis de Reservas:** gráfico de barras

---

## Configuración

**Ruta:** `/admin/settings`

### Vista ADMIN
- Solo Tasa BCV del día

### Vista SUPERADMIN

1. **Configuración General:** modo mantenimiento (toggle), comisión de la plataforma (%)
2. **Notificaciones:** configuración de email (próximamente)
3. **Tasa BCV:** tasa actual + próxima tasa con fecha, historial de tasas anteriores
4. **Seguridad:** 2FA (próximamente), logs de seguridad (próximamente)
5. **Base de Datos:** sincronizar usuarios, backup automático (próximamente), reiniciar base de datos (doble confirmación)
6. **Apariencia:** logo de la plataforma (próximamente), colores de marca (próximamente)

---

## Notas

- Las imágenes de ejemplo en este manual serán reemplazadas por capturas reales del panel.
- Los roles de usuario son: **GUEST** (usuario regular), **ADMIN** (administrador), **SUPERADMIN** (superadministrador).
- Para reportar problemas o sugerir mejoras, contacta al equipo de desarrollo.

---

*Última actualización: junio 2026*
