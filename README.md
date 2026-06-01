# Zerkka

Zerkka es un sitio web de **reservas de restaurantes** desarrollado por **Fokusde Dev**, pensado para ofrecer una experiencia ágil, confiable y moderna a usuarios y negocios en Latinoamérica.  
Su objetivo es simplificar la gestión de reservas y brindar una interfaz intuitiva que inspire confianza.

---

## 🚀 Características principales

- **Reservas en tiempo real**: disponibilidad actualizada al instante.  
- **Gestión de usuarios**: registro, autenticación y perfiles personalizados.  
- **Panel administrativo**: control de reservas, clientes y estadísticas.  
- **Diseño responsivo**: optimizado para dispositivos móviles y escritorio.  
- **SEO friendly**: pensado para posicionar marcas en buscadores.  

---

## 🛠️ Tecnologías utilizadas

- **Frontend**: React / Next.js  
- **Backend**: Node.js / Express  
- **Base de datos**: PostgreSQL con Prisma  
- **Autenticación**: Kinde / Supabase Auth  
- **Infraestructura**: Supabase + Vercel  

---

## 📦 Esquema compartido (Supabase)

Estas tablas son compartidas entre web y mobile:

- User: usuarios y roles
- Home: propiedades publicadas
- Reservation: reservas de propiedades
- Payment: pagos asociados a reservas
- Review: reseñas y calificaciones
- Favorite: propiedades favoritas
- AmenityCategory: categorias de amenidades
- Amenity: amenidades
- HomeAmenity: relacion propiedad-amenidad
- NotificationPreferences: preferencias de notificaciones
- AuditLog: auditoria de acciones
- Message: mensajes entre usuarios

---

## 📦 Instalación y configuración

1. Clona el repositorio:
   ```bash
   git clone https://github.com/fokusde/zerkka.git
   cd zerkka
   ```

---

*Última actualización: 2 de marzo 2026*.
