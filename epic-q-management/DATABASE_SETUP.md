# Configuración de Base de Datos - EPIC-Q

Este documento explica cómo configurar la base de datos para el sistema EPIC-Q, que soporta tanto PostgreSQL local como Neon.

## 🗄️ Opciones de Base de Datos

### 1. PostgreSQL Local

Para usar PostgreSQL local, necesitas:

1. **Instalar PostgreSQL** en tu sistema
2. **Crear una base de datos** llamada `epicq_db`
3. **Configurar las variables de entorno**

#### Instalación de PostgreSQL

**macOS (con Homebrew):**
```bash
brew install postgresql
brew services start postgresql
createdb epicq_db
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb epicq_db
```

**Windows:**
- Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)
- Instalar y crear la base de datos `epicq_db`

#### Variables de Entorno para PostgreSQL Local

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# PostgreSQL Local
DATABASE_URL="postgresql://username:password@localhost:5432/epicq_db?schema=public"

# O usando variables individuales
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=epicq_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
DB_PROVIDER=postgresql
```

### 2. Neon (Recomendado para Producción)

Neon es una base de datos PostgreSQL serverless que es perfecta para aplicaciones Next.js.

#### Configuración de Neon

1. **Crear cuenta** en [neon.tech](https://neon.tech)
2. **Crear un proyecto** nuevo
3. **Copiar la URL de conexión**

#### Variables de Entorno para Neon

```env
# Neon
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DB_PROVIDER=neon
```

## 🚀 Configuración Inicial

### Opción 1: Script Automático (Recomendado)

```bash
# Ejecutar el script de configuración
npm run db:setup
```

Este script:
- Genera el cliente de Prisma
- Ejecuta las migraciones
- Pobla la base de datos con datos de ejemplo

### Opción 2: Configuración Manual

```bash
# 1. Generar cliente de Prisma
npm run db:generate

# 2. Ejecutar migraciones
npm run db:migrate

# 3. Poblar con datos de ejemplo
npm run db:seed
```

## 📊 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run db:generate` | Genera el cliente de Prisma |
| `npm run db:migrate` | Ejecuta migraciones en desarrollo |
| `npm run db:deploy` | Despliega migraciones en producción |
| `npm run db:seed` | Pobla la base de datos con datos de ejemplo |
| `npm run db:setup` | Configuración completa automática |
| `npm run db:studio` | Abre Prisma Studio (interfaz visual) |
| `npm run db:reset` | Resetea la base de datos y la vuelve a poblar |

## 🔧 Estructura de la Base de Datos

### Tablas Principales

- **hospitals** - Información de hospitales
- **hospital_details** - Datos estructurales de hospitales
- **contacts** - Coordinadores y colaboradores
- **hospital_progress** - Progreso del estudio por hospital
- **recruitment_periods** - Períodos de reclutamiento
- **case_metrics** - Métricas de casos
- **communications** - Comunicaciones
- **email_templates** - Plantillas de email
- **alerts** - Alertas del sistema
- **users** - Usuarios del sistema
- **activity_log** - Logs de actividad

### Relaciones

- Un hospital tiene muchos contactos, períodos, métricas y comunicaciones
- Un hospital tiene un detalle y un progreso
- Las comunicaciones pueden usar templates
- Los usuarios pueden estar asociados a hospitales

## 🛠️ Desarrollo

### Cambiar entre PostgreSQL y Neon

Solo necesitas cambiar la variable `DB_PROVIDER` en tu `.env.local`:

```env
# Para PostgreSQL local
DB_PROVIDER=postgresql

# Para Neon
DB_PROVIDER=neon
```

### Agregar Nuevas Migraciones

```bash
# Crear una nueva migración
npx prisma migrate dev --name nombre_de_la_migracion

# Aplicar migraciones en producción
npm run db:deploy
```

### Ver Datos en Prisma Studio

```bash
npm run db:studio
```

Esto abrirá una interfaz web donde puedes ver y editar los datos.

## 🐛 Solución de Problemas

### Error de Conexión

1. **Verifica las variables de entorno** en `.env.local`
2. **Asegúrate de que la base de datos esté ejecutándose**
3. **Verifica que las credenciales sean correctas**

### Error de Migración

```bash
# Resetear la base de datos
npm run db:reset
```

### Error de Cliente de Prisma

```bash
# Regenerar el cliente
npm run db:generate
```

## 📈 Monitoreo

### Verificar Estado de la Base de Datos

```typescript
import { DatabaseUtils } from '@/lib/db-utils';

// Verificar conexión
const connection = await DatabaseUtils.testConnection();
console.log(connection);

// Obtener estadísticas
const stats = await DatabaseUtils.getTableStats();
console.log(stats);
```

### Logs de Actividad

El sistema registra automáticamente todas las actividades importantes en la tabla `activity_log`.

## 🔒 Seguridad

- **Nunca commitees** el archivo `.env.local`
- **Usa variables de entorno** para credenciales sensibles
- **Configura SSL** en producción
- **Haz backups regulares** de tus datos

## 📚 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Neon](https://neon.tech/docs)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
