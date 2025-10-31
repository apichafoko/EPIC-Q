# Guía de Pruebas de las Nuevas APIs - Fase 2

## 📋 APIs Implementadas

### 1. Reportes Programados
- **GET** `/api/reports/schedule` - Listar reportes programados
- **POST** `/api/reports/schedule` - Crear nuevo reporte programado
- **GET** `/api/reports/schedule/[id]` - Obtener reporte específico
- **PUT/PATCH** `/api/reports/schedule/[id]` - Actualizar reporte
- **DELETE** `/api/reports/schedule/[id]` - Eliminar reporte
- **POST** `/api/reports/schedule/[id]/execute` - Ejecutar reporte manualmente
- **GET** `/api/reports/schedule/[id]/history` - Historial de ejecuciones

### 2. Analytics Avanzado
- **GET** `/api/analytics?metric=case_trends` - Tendencias de casos
- **GET** `/api/analytics?metric=completion_trends` - Tendencias de completitud
- **GET** `/api/analytics?metric=activity_heatmap` - Heatmap de actividad
- **GET** `/api/analytics?metric=bubble_chart` - Gráfico de burbujas
- **GET** `/api/analytics?metric=coordinator_performance` - Performance de coordinadores
- **GET** `/api/analytics?metric=predictions&predictionType=cases&days=30` - Predicciones
- **GET** `/api/analytics?metric=geographic_distribution&distributionType=cases` - Distribución geográfica

### 3. Exportación Unificada
- **POST** `/api/export` - Exportar datos en múltiples formatos
  - Body: `{ reportType, format, filters?, templateId? }`

### 4. Security Logs
- **GET** `/api/security/logs` - Listar logs de seguridad
- **GET** `/api/security/stats` - Estadísticas de seguridad

### 5. Cron Job
- **GET** `/api/cron/reports` - Ejecutar reportes programados (requiere CRON_SECRET)

## 🧪 Cómo Probar

### Opción 1: Script Automatizado

```bash
# 1. Inicia el servidor en otra terminal
npm run dev

# 2. Obtén un token de autenticación (inicia sesión en la app)
# Luego copia el valor de la cookie 'auth-token'

# 3. Ejecuta el script de pruebas
AUTH_TOKEN=tu-token-aqui npm run test:new-apis

# O con BASE_URL personalizada
BASE_URL=https://tu-dominio.netlify.app AUTH_TOKEN=tu-token npm run test:new-apis
```

### Opción 2: Pruebas Manuales con curl

#### 1. Reportes Programados

```bash
# Listar reportes
curl -X GET \
  -H "Cookie: auth-token=tu-token" \
  http://localhost:3000/api/reports/schedule

# Crear reporte
curl -X POST \
  -H "Cookie: auth-token=tu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reporte Diario",
    "reportType": "executive_summary",
    "frequency": "daily",
    "format": "pdf",
    "recipients": ["admin@example.com"]
  }' \
  http://localhost:3000/api/reports/schedule
```

#### 2. Analytics

```bash
# Tendencias de casos
curl -X GET \
  -H "Cookie: auth-token=tu-token" \
  "http://localhost:3000/api/analytics?metric=case_trends"

# Performance de coordinadores
curl -X GET \
  -H "Cookie: auth-token=tu-token" \
  "http://localhost:3000/api/analytics?metric=coordinator_performance"
```

#### 3. Exportación

```bash
curl -X POST \
  -H "Cookie: auth-token=tu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "executive_summary",
    "format": "csv"
  }' \
  http://localhost:3000/api/export
```

#### 4. Security Logs

```bash
# Listar logs
curl -X GET \
  -H "Cookie: auth-token=tu-token" \
  "http://localhost:3000/api/security/logs?limit=10"

# Estadísticas
curl -X GET \
  -H "Cookie: auth-token=tu-token" \
  http://localhost:3000/api/security/stats
```

#### 5. Cron Job

```bash
curl -X GET \
  -H "Authorization: Bearer TU_CRON_SECRET" \
  http://localhost:3000/api/cron/reports
```

### Opción 3: Usando Postman/Insomnia

1. Importa la colección (si está disponible)
2. Configura la variable de entorno `baseUrl` y `authToken`
3. Ejecuta las requests

### Opción 4: Desde el Navegador (DevTools)

1. Inicia sesión en la aplicación
2. Abre DevTools > Console
3. Ejecuta:

```javascript
// Obtener token de las cookies
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-token='))
  ?.split('=')[1];

// Probar API
fetch('/api/reports/schedule', {
  headers: {
    'Cookie': `auth-token=${token}`
  }
})
  .then(r => r.json())
  .then(console.log);
```

## ✅ Verificación de Resultados Esperados

### Reportes Programados
- ✅ `GET /api/reports/schedule` debe retornar array de reportes
- ✅ `POST /api/reports/schedule` debe crear un reporte y retornar el objeto creado
- ✅ `GET /api/reports/schedule/[id]/history` debe retornar historial de ejecuciones

### Analytics
- ✅ Todas las métricas deben retornar datos en formato JSON
- ✅ `predictions` debe retornar array de predicciones futuras
- ✅ `geographic_distribution` debe retornar datos por provincia

### Exportación
- ✅ `POST /api/export` con `format: csv` debe retornar datos en formato CSV
- ✅ Debe incluir metadata del reporte generado

### Security Logs
- ✅ `GET /api/security/logs` debe retornar logs paginados
- ✅ `GET /api/security/stats` debe retornar estadísticas agregadas

### Cron Job
- ✅ `GET /api/cron/reports` con secret correcto debe ejecutar reportes pendientes
- ✅ Sin secret debe retornar 401

## 🔧 Troubleshooting

### Error 401 Unauthorized
- Verifica que estés autenticado
- Asegúrate de que el token esté vigente
- Para APIs de admin, verifica que tengas rol de administrador

### Error 500 Internal Server Error
- Revisa los logs del servidor
- Verifica que la base de datos esté accesible
- Asegúrate de que todas las migraciones estén aplicadas

### Error de conexión
- Verifica que el servidor esté corriendo (`npm run dev`)
- Comprueba que la URL sea correcta
- Verifica firewall/proxy

### Datos vacíos
- Verifica que haya datos en la base de datos
- Algunas métricas requieren datos históricos para funcionar

## 📊 Próximos Pasos

Después de probar las APIs:

1. ✅ Integrar en el frontend
2. ✅ Crear componentes de UI para cada funcionalidad
3. ✅ Configurar el cron job en producción
4. ✅ Monitorear logs y performance

