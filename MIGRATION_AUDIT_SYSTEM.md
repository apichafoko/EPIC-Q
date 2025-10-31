# Migración del Sistema de Auditoría

## Resumen

Se ha implementado un sistema completo de auditoría que migra desde localStorage a Prisma, proporcionando trazabilidad completa y cumplimiento regulatorio.

## Cambios Realizados

### 1. Schema de Prisma (`prisma/schema.prisma`)

Se agregó el modelo `audit_logs` con los siguientes campos:

- `id`: Identificador único
- `user_id`: ID del usuario (opcional, puede ser null para acciones del sistema)
- `user_name`: Nombre del usuario
- `action`: Acción realizada (create, update, delete, view, etc.)
- `resource`: Tipo de recurso (hospitals, projects, users, etc.)
- `resource_id`: ID del recurso específico
- `details`: JSON con información adicional
- `ip_address`: IP del cliente
- `user_agent`: User agent del navegador
- `status`: Estado (success, error, warning)
- `error_message`: Mensaje de error si aplica
- `metadata`: JSON con metadatos adicionales
- `created_at`: Fecha de creación

Índices creados:
- `user_id`
- `resource` y `resource_id` (compuesto)
- `action`
- `created_at`

### 2. Servicio de Auditoría (`src/lib/audit-service.ts`)

Nuevo servicio completo con:
- `logAction()`: Crear logs de auditoría
- `getLogs()`: Obtener logs con filtros y paginación
- `getLogsByResource()`: Logs por recurso específico
- `getLogsByUser()`: Logs por usuario
- `exportToCSV()`: Exportar logs a CSV
- `cleanOldLogs()`: Limpiar logs antiguos (retención configurable)
- `getStatistics()`: Estadísticas de auditoría
- `extractRequestInfo()`: Helper para extraer IP y User-Agent

### 3. Sistema de Manejo de Errores (`src/lib/error-handler.ts`)

Nuevo sistema de logging centralizado:
- `captureError()`: Capturar errores con contexto
- `captureWarning()`: Capturar advertencias
- `captureInfo()`: Capturar información
- Integración con Sentry (opcional)
- Logging estructurado local
- Estadísticas de errores

### 4. Middleware de Auditoría (`src/lib/auth/audit-middleware.ts`)

Helper para integrar auditoría automática:
- `logApiAction()`: Registrar acciones automáticamente
- `determineResourceFromRequest()`: Detectar recurso desde URL
- `withAuditLogging()`: Wrapper para API routes

### 5. API Routes

Nuevas rutas API:

- `GET /api/audit`: Obtener logs con filtros y paginación
- `GET /api/audit/stats`: Estadísticas de auditoría
- `GET /api/audit/export`: Exportar logs a CSV

### 6. Página de Error Mejorada (`src/app/error.tsx`)

- Mejor UI con información de error
- Captura automática de errores
- Información detallada en desarrollo
- Botones de acción (reintentar, ir al inicio)

### 7. Tests (`src/__tests__/`)

Tests unitarios para:
- `audit-service.test.ts`: Servicio de auditoría
- `error-handler.test.ts`: Sistema de manejo de errores

### 8. Configuración de Jest

- Mejoras en cobertura de tests
- Thresholds más estrictos para servicios críticos

## Pasos para Aplicar la Migración

### ✅ Migración Aplicada Exitosamente

La migración `20251031085243_add_audit_logs` ha sido aplicada de forma segura a la base de datos.

**✅ La migración:**
- Solo agrega la nueva tabla `audit_logs`
- NO modifica ninguna tabla existente
- NO elimina ningún dato
- Usa `CREATE TABLE IF NOT EXISTS` para ser idempotente
- Todos los índices fueron creados correctamente

### Verificación

```bash
# Verificar estado de migraciones
npx prisma migrate status

# Generar cliente Prisma (ya ejecutado)
npx prisma generate
```

**Estado actual:** ✅ Todas las migraciones aplicadas, base de datos sincronizada

### 3. Actualizar el dashboard de auditoría

La página `src/app/[locale]/admin/audit/page.tsx` necesita actualizarse para usar las nuevas API routes en lugar de `AuditService.getLogs()` directamente.

### 4. Integrar auditoría en API routes existentes

Para agregar auditoría automática a rutas API existentes:

```typescript
import { withAuditLogging } from '@/lib/auth/audit-middleware';

export async function POST(request: NextRequest) {
  return withAdminAuth(
    withAuditLogging(async (req, context) => {
      // Tu lógica aquí
    })
  )(request);
}
```

### 5. Configurar limpieza automática de logs

Crear un cron job o tarea programada para limpiar logs antiguos:

```typescript
import { AuditService } from '@/lib/audit-service';

// Limpiar logs de más de 90 días
await AuditService.cleanOldLogs(90);
```

## Uso

### Crear un log de auditoría

```typescript
import { AuditService } from '@/lib/audit-service';

await AuditService.logAction(
  userId,
  userName,
  'create',
  'hospitals',
  hospitalId,
  { name: 'Hospital Name' },
  ipAddress,
  userAgent,
  'success'
);
```

### Capturar un error

```typescript
import { errorHandler } from '@/lib/error-handler';

try {
  // código que puede fallar
} catch (error) {
  await errorHandler.captureError(error, {
    userId: user.id,
    userName: user.name,
    resource: 'hospitals',
    action: 'create',
  });
}
```

### Obtener logs

```typescript
const result = await AuditService.getLogs(
  {
    userId: 'user-1',
    resource: 'hospitals',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  },
  { page: 1, limit: 50 }
);
```

## Beneficios

1. **Trazabilidad completa**: Todas las acciones críticas quedan registradas
2. **Cumplimiento regulatorio**: Logs estructurados para auditorías
3. **Debugging mejorado**: Errores capturados con contexto completo
4. **Exportación**: Logs exportables para análisis externo
5. **Rendimiento**: Índices optimizados para búsquedas rápidas
6. **Retención configurable**: Limpieza automática de logs antiguos

## Próximos Pasos

1. Actualizar el dashboard de auditoría para usar las nuevas APIs
2. Integrar auditoría automática en rutas API críticas
3. Configurar tarea programada para limpieza de logs
4. Agregar más tests de integración
5. Documentar políticas de retención de logs

