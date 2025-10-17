# 🔐 Configuración de Autenticación - EPIC-Q Management System

## 📋 Resumen

Este documento describe la configuración del sistema de autenticación dual (Admin/Coordinador) con soporte PWA para el sistema de gestión EPIC-Q.

## 🏗️ Arquitectura

### Roles de Usuario

1. **Administrador (`admin`)**
   - Acceso completo al sistema
   - Gestión de usuarios y hospitales
   - Configuración del sistema
   - Reportes y alertas

2. **Coordinador (`coordinator`)**
   - Acceso limitado a su hospital asignado
   - Formulario de descripción del hospital
   - Gestión de progreso y fechas
   - Comunicaciones y notificaciones

### Tecnologías Utilizadas

- **NextAuth.js v5** - Autenticación
- **Prisma** - ORM y base de datos
- **bcryptjs** - Hash de contraseñas
- **nodemailer** - Envío de emails
- **Zod** - Validación de formularios
- **Web Push API** - Notificaciones push

## ⚙️ Configuración

### 1. Variables de Entorno

Crear archivo `.env.local`:

```bash
# Base de datos
DATABASE_URL="postgresql://neondb_owner:npg_6hGjXvMKQs0J@ep-sparkling-forest-adly346k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-super-seguro-aqui"

# Email (SMTP)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-app-password"
EMAIL_FROM="noreply@epic-q.com"

# Push Notifications (Opcional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="tu-vapid-public-key"
VAPID_PRIVATE_KEY="tu-vapid-private-key"
```

### 2. Migración de Base de Datos

```bash
# Generar migración
npx prisma migrate dev --name auth-system

# Aplicar migración
npx prisma db push

# Generar cliente Prisma
npx prisma generate
```

### 3. Crear Usuarios de Prueba

```bash
# Crear usuarios de prueba
node scripts/create-test-users.js

# Verificar sistema
node scripts/verify-system.js
```

## 🔑 Flujos de Autenticación

### 1. Login de Administrador

1. Usuario accede a `/es/auth/login`
2. Ingresa email y contraseña
3. NextAuth valida credenciales con Prisma
4. Si es válido, redirige a `/es/admin`
5. Si no es válido, muestra error

### 2. Login de Coordinador

1. Usuario accede a `/es/auth/login`
2. Ingresa email y contraseña
3. NextAuth valida credenciales
4. Si es válido, redirige a `/es/coordinator`
5. Si no es válido, muestra error

### 3. Creación de Coordinador (Admin)

1. Admin accede a `/es/admin/users/new`
2. Completa formulario con datos del coordinador
3. Sistema genera contraseña temporal
4. Envía email de invitación
5. Coordinador recibe email con link de activación

### 4. Establecer Contraseña (Coordinador)

1. Coordinador hace clic en link del email
2. Accede a `/es/auth/set-password`
3. Establece nueva contraseña
4. Sistema valida fortaleza de contraseña
5. Actualiza contraseña en base de datos

## 🛡️ Seguridad

### 1. Validación de Contraseñas

- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número
- Al menos un carácter especial

### 2. Rate Limiting

- **Login**: 5 intentos en 15 minutos
- **Reset de contraseña**: 3 intentos por hora
- **API general**: 100 requests en 15 minutos

### 3. Protección de Rutas

- Middleware verifica autenticación
- Roles específicos para cada ruta
- Validación de permisos en API routes

## 📱 PWA (Progressive Web App)

### 1. Instalación

- Usuario puede instalar la app desde el navegador
- Funciona offline con service worker
- Notificaciones push nativas

### 2. Configuración

- Manifest en `/public/manifest.json`
- Service worker en `/public/sw.js`
- Iconos en `/public/icons/`

## 🧪 Testing

### 1. Usuarios de Prueba

**Administrador:**
- Email: `admin@epic-q.com`
- Contraseña: `Admin123!`

**Coordinador:**
- Email: `coordinator@epic-q.com`
- Contraseña: `Coord123!`

### 2. URLs de Prueba

- Login: `http://localhost:3000/es/auth/login`
- Admin: `http://localhost:3000/es/admin`
- Coordinador: `http://localhost:3000/es/coordinator`

### 3. Comandos de Testing

```bash
# Crear usuarios de prueba
node scripts/create-test-users.js

# Verificar sistema
node scripts/verify-system.js

# Ejecutar aplicación
npm run dev
```

## 🔧 Solución de Problemas

### 1. Error de Conexión a Base de Datos

```bash
# Verificar conexión
npx prisma db push

# Regenerar cliente
npx prisma generate
```

### 2. Error de NextAuth

```bash
# Verificar variables de entorno
echo $NEXTAUTH_SECRET

# Limpiar caché
rm -rf .next
npm run dev
```

### 3. Error de Email

- Verificar credenciales SMTP
- Usar App Password para Gmail
- Verificar configuración de firewall

## 📚 Referencias

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## 🤝 Soporte

Para problemas técnicos o preguntas sobre la configuración, contactar al equipo de desarrollo.

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
