# Configuración de Cron Jobs en Netlify

Este documento explica cómo configurar el cron job para ejecutar reportes programados automáticamente en Netlify.

## Opción 1: Usar Netlify Scheduled Functions (Recomendado)

Netlify soporta funciones programadas nativamente desde la versión 2.0 de las Netlify Functions.

### Paso 1: Crear la función de cron

Ya está creada en: `netlify/functions/cron-reports.js`

### Paso 2: Configurar en Netlify

#### ⚠️ Nota sobre Netlify CLI:

**Netlify CLI no tiene un comando directo para programar funciones.** La programación de funciones scheduled se debe hacer desde la UI de Netlify o usando servicios externos.

**Alternativas:**
1. **Usar la UI de Netlify** (ver abajo) - Recomendado
2. **Usar un servicio externo** como cron-job.org (ver Opción 2)
3. **Usar GitHub Actions** si tu código está en GitHub (ver Opción 2)

#### Usando la UI de Netlify (Método Recomendado):

**Nota:** Las Scheduled Functions de Netlify están disponibles en algunos planes. Si no ves esta opción, usa un servicio externo (ver Opción 2).

1. Ve a tu sitio en [Netlify Dashboard](https://app.netlify.com)
2. Navega a **Site settings > Functions**
3. Busca la sección **Scheduled functions** o **Background functions**
4. Si está disponible, haz clic en **Add scheduled function** o **Create scheduled function**
5. Configura:
   - **Function name**: `cron-reports`
   - **Schedule**: `0 9 1 * *` (mensual - primer día del mes a las 9 AM UTC)
   - **Options**: Asegúrate de que la función esté activa

**Si no ves la opción de Scheduled Functions:**
- Puede que no esté disponible en tu plan de Netlify
- **Solución:** Usa un servicio externo como cron-job.org (Opción 2, más abajo)

### Paso 3: Configurar variables de entorno

En Netlify Dashboard:
1. Ve a **Site settings > Environment variables**
2. Agrega:
   - `CRON_SECRET` - Un string secreto para proteger el endpoint
   - `URL` o `DEPLOY_PRIME_URL` - Se configura automáticamente, pero puedes sobreescribirlo

## Opción 2: Usar Servicio Externo de Cron Jobs

Si Netlify Scheduled Functions no está disponible o prefieres más control, puedes usar servicios externos:

### Cron-Job.org (Gratis)

1. Regístrate en [cron-job.org](https://cron-job.org)
2. Crea un nuevo cron job:
   - **URL**: `https://tu-dominio.netlify.app/.netlify/functions/cron-reports`
   - **Schedule**: Configura según necesites (ver recomendaciones abajo)
   - **HTTP Method**: GET
   - **HTTP Headers**: Puedes agregar múltiples headers:
     ```
     Key: Authorization
     Value: Bearer TU_CRON_SECRET_AQUI
     
     Key: Content-Type
     Value: application/json
     
     Key: X-Cron-Source
     Value: cron-job-org
     ```
   - **Notification**: Opcional, para recibir alertas si falla
3. Guarda y activa el cron job

**Nota:** Sí, puedes agregar múltiples headers. Cada header necesita su Key y Value separados.

### EasyCron

1. Regístrate en [EasyCron](https://www.easycron.com)
2. Similar a cron-job.org, configura la URL y headers

### GitHub Actions (Si usas GitHub)

Crea `.github/workflows/scheduled-reports.yml`:

```yaml
name: Scheduled Reports

on:
  schedule:
    # Ejecutar diariamente a las 9 AM UTC
    - cron: '0 9 * * *'
  workflow_dispatch: # Permitir ejecución manual

jobs:
  run-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Netlify Function
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tu-dominio.netlify.app/.netlify/functions/cron-reports
```

Luego agrega `CRON_SECRET` en GitHub Secrets.

## Opción 3: Usar Next.js API Route Directamente

Si prefieres llamar directamente a la API route de Next.js (sin pasar por Netlify Function):

```bash
# En cualquier servicio de cron
curl -X GET \
  -H "Authorization: Bearer TU_CRON_SECRET" \
  https://tu-dominio.netlify.app/api/cron/reports
```

## Expresiones Cron Comunes y Recomendaciones

### Recomendaciones por Tipo de Reporte

| Tipo de Reporte | Frecuencia Recomendada | Expresión Cron | Justificación |
|-----------------|------------------------|----------------|---------------|
| **Reporte Ejecutivo** | Mensual | `0 9 1 * *` | Resumen mensual para stakeholders |
| **Estado de Hospitales** | Semanal | `0 9 * * 1` | Cada lunes para planificación semanal |
| **Métricas de Casos** | Diario | `0 9 * * *` | Para monitoreo diario de progreso |
| **Comunicaciones** | Semanal | `0 9 * * 1` | Resumen semanal de actividad |
| **Alertas** | Diario | `0 9 * * *` | Seguimiento diario de alertas activas |
| **Progreso por Hospital** | Semanal | `0 9 * * 1` | Actualización semanal suficiente |
| **Comparativa de Provincias** | Mensual | `0 9 1 * *` | Análisis comparativo mensual |

### Expresiones Cron Comunes

| Expresión | Descripción | Uso Recomendado |
|-----------|-------------|-----------------|
| `0 9 * * *` | Diario a las 9:00 AM UTC | Reportes operativos diarios |
| `0 9 * * 1` | Cada lunes a las 9:00 AM | Reportes semanales |
| `0 9 1 * *` | Primer día del mes a las 9:00 AM | Reportes mensuales ejecutivos |
| `0 9 * * 1-5` | Lunes a Viernes a las 9 AM | Reportes solo días laborables |
| `0 */6 * * *` | Cada 6 horas | Monitoreo intensivo (no recomendado para reportes) |
| `0 0 1 * *` | Primer día de cada mes a medianoche | Reportes mensuales |
| `0 9 1 1,4,7,10 *` | Primer día de cada trimestre | Reportes trimestrales |

### Recomendación Principal: **MENSUAL para Reportes Ejecutivos**

Para la mayoría de los reportes ejecutivos y de gestión, **recomiendo frecuencia mensual**:

```cron
0 9 1 * *  # Primer día de cada mes a las 9:00 AM UTC
```

**Ventajas:**
- ✅ No satura de emails a los destinatarios
- ✅ Proporciona suficiente información para toma de decisiones
- ✅ Permite ver tendencias mensuales claras
- ✅ Menos carga en el servidor
- ✅ Más fácil de revisar y actuar sobre la información

**Excepciones donde recomendar semanal o diario:**
- 🟡 Reportes operativos que requieren acción inmediata (ej: alertas)
- 🟡 Dashboards automáticos para equipos activos
- 🟡 Reportes de progreso durante fases críticas del proyecto

## Verificar que Funciona

1. **Prueba manual**:
   ```bash
   curl -X GET \
     -H "Authorization: Bearer TU_CRON_SECRET" \
     https://tu-dominio.netlify.app/.netlify/functions/cron-reports
   ```

2. **Ver logs en Netlify**:
   - Ve a **Site overview > Functions**
   - Haz clic en `cron-reports`
   - Revisa los logs de ejecución

3. **Verificar en la base de datos**:
   ```sql
   SELECT * FROM scheduled_reports ORDER BY last_run_at DESC LIMIT 10;
   SELECT * FROM report_history ORDER BY generated_at DESC LIMIT 10;
   ```

## Troubleshooting

### Error 401 Unauthorized
- Verifica que `CRON_SECRET` esté configurado correctamente
- Asegúrate de que el header `Authorization: Bearer <secret>` esté presente

### La función no se ejecuta
- Verifica que la función esté programada correctamente en Netlify
- Revisa los logs de Netlify Functions
- Verifica que la URL sea accesible públicamente

### Error al ejecutar reportes
- Verifica que los reportes programados existan en la base de datos
- Revisa los logs de la función para ver errores específicos
- Verifica que el servicio de email esté configurado correctamente

## Seguridad

⚠️ **Importante**: 
- Nunca expongas `CRON_SECRET` públicamente
- Usa HTTPS siempre
- Considera usar IP whitelisting si es posible
- Monitorea los logs para detectar accesos no autorizados

## Próximos Pasos

1. Configura el cron job según una de las opciones arriba
2. Crea algunos reportes programados de prueba
3. Espera la primera ejecución y verifica que funcionó
4. Ajusta los horarios según tus necesidades

