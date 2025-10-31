# Ejemplo de Configuración de Cron Job - Paso a Paso

## Configuración Recomendada: Reporte Mensual

### Paso 1: Obtener tu CRON_SECRET

En tu archivo `.env` o en Netlify Environment Variables:
```bash
CRON_SECRET=tu-secreto-super-seguro-aqui-12345
```

**Importante:** Usa un string largo y aleatorio, nunca lo expongas públicamente.

### Paso 2: Configurar en Cron-Job.org (Recomendado - Funciona con todos los planes de Netlify)

#### A. Crear la cuenta y el cron job

1. Ve a [https://cron-job.org](https://cron-job.org)
2. Registrate (es gratis, hasta 2 cron jobs gratuitos)
3. Haz clic en **"Create cronjob"** o **"+ New Cronjob"**

#### B. Configurar la URL

```
URL: https://epic-q.netlify.app/.netlify/functions/cron-reports
```

O si prefieres llamar directamente a la API route de Next.js:
```
URL: https://epic-q.netlify.app/api/cron/reports
```

**Nota:** Ambas URLs funcionan. La primera pasa por la función de Netlify, la segunda va directo a Next.js.

#### C. Configurar los Headers

En la sección **"HTTP Headers"**, agrega:

**Header 1:**
- **Key:** `Authorization`
- **Value:** `Bearer tu-secreto-super-seguro-aqui-12345`

**Header 2 (Opcional pero recomendado):**
- **Key:** `Content-Type`
- **Value:** `application/json`

**Header 3 (Opcional, para tracking):**
- **Key:** `X-Cron-Source`
- **Value:** `cron-job-org`

**Ejemplo visual:**
```
┌─────────────────────┬──────────────────────────────────────┐
│ HTTP Headers        │                                      │
├─────────────────────┼──────────────────────────────────────┤
│ Key: Authorization  │ Value: Bearer tu-secreto-aqui-12345  │
├─────────────────────┼──────────────────────────────────────┤
│ Key: Content-Type   │ Value: application/json              │
├─────────────────────┼──────────────────────────────────────┤
│ Key: X-Cron-Source  │ Value: cron-job-org                   │
└─────────────────────┴──────────────────────────────────────┘
```

#### D. Configurar el Schedule (Programación)

**Recomendación: Mensual - Primer día del mes**

- **Title:** "Reportes Mensuales EPIC-Q"
- **Schedule Type:** "Cron Expression"
- **Cron Expression:** `0 9 1 * *`
  - Esto ejecuta el primer día de cada mes a las 9:00 AM UTC

**Otras opciones:**

**Semanal (Lunes):**
```
Cron Expression: 0 9 * * 1
```

**Diario:**
```
Cron Expression: 0 9 * * *
```

**Trimestral:**
```
Cron Expression: 0 9 1 1,4,7,10 *
```

#### E. Configurar Notificaciones (Opcional)

- **Failure Notification:** Activa para recibir email si falla
- **Success Notification:** Desactiva (para no recibir emails cada vez que funciona)

#### F. Guardar y Activar

1. Haz clic en **"Save"** o **"Create cronjob"**
2. Activa el toggle de **"Active"** o **"Enabled"**
3. El cron job comenzará a ejecutarse según el schedule

**Importante:** Cron-job.org ejecutará el primer job inmediatamente después de crearlo para verificar que funciona, luego seguirá el schedule configurado.

### Paso 3: Verificar que Funciona

#### Test Manual Inmediato

1. En cron-job.org:
   - Ve a tu cron job
   - Haz clic en **"Execute now"** o el botón de play ▶️
   - Espera unos segundos y revisa el resultado
2. Verifica en los logs de cron-job.org:
   - Ve a la pestaña **"Execution history"** o **"Logs"**
   - Deberías ver un status 200 (éxito) o 401/500 (error)
3. Revisa en tu base de datos:

```sql
-- Ver reportes ejecutados recientemente
SELECT * FROM report_history 
ORDER BY generated_at DESC 
LIMIT 10;

-- Ver próximos reportes programados
SELECT name, next_run_at, frequency 
FROM scheduled_reports 
WHERE is_active = true
ORDER BY next_run_at;
```

#### Test desde Terminal

```bash
# Reemplaza con tu CRON_SECRET real (debe coincidir con el de Netlify)
curl -X GET \
  -H "Authorization: Bearer tu-secreto-aqui-12345" \
  https://epic-q.netlify.app/.netlify/functions/cron-reports

# O directamente a la API route de Next.js:
curl -X GET \
  -H "Authorization: Bearer tu-secreto-aqui-12345" \
  https://epic-q.netlify.app/api/cron/reports
```

Deberías ver una respuesta como:
```json
{
  "success": true,
  "executed": 2,
  "results": [
    {
      "reportId": "abc123",
      "reportName": "Reporte Mensual",
      "success": true
    }
  ]
}
```

## Configuración Alternativa: EasyCron

Si prefieres usar [EasyCron](https://www.easycron.com):

### Configuración Similar:

1. **URL:** `https://tu-dominio.netlify.app/.netlify/functions/cron-reports`
2. **Method:** GET
3. **Custom Headers:**
   ```
   Authorization: Bearer tu-secreto-aqui-12345
   Content-Type: application/json
   ```
4. **Cron Schedule:** `0 9 1 * *` (mensual)
5. **Alerts:** Configura para recibir notificaciones de fallos

## Configuración en GitHub Actions (Si usas GitHub)

Si tu código está en GitHub, puedes usar GitHub Actions:

### Crear `.github/workflows/scheduled-reports.yml`:

```yaml
name: Scheduled Reports

on:
  schedule:
    # Ejecutar el primer día de cada mes a las 9 AM UTC
    - cron: '0 9 1 * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  run-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Netlify Function
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          NETLIFY_URL: ${{ secrets.NETLIFY_URL }}
        run: |
          curl -X GET \
            -H "Authorization: Bearer $CRON_SECRET" \
            -H "Content-Type: application/json" \
            "$NETLIFY_URL/.netlify/functions/cron-reports"
```

### Configurar Secrets en GitHub:

1. Ve a tu repositorio → Settings → Secrets and variables → Actions
2. Agrega:
   - `CRON_SECRET`: Tu secreto de cron
   - `NETLIFY_URL`: `https://tu-dominio.netlify.app`

## Recomendaciones Finales

### ✅ Hacer:
- Usar frecuencia **mensual** para reportes ejecutivos
- Configurar **notificaciones de fallos** para monitorear
- Usar **HTTPS siempre**
- Rotar el `CRON_SECRET` periódicamente
- Mantener un **log de ejecuciones** para auditoría

### ❌ Evitar:
- Frecuencias muy altas (cada hora o menos) a menos que sea crítico
- Exponer el `CRON_SECRET` en código o documentación pública
- Configurar ejecuciones en horarios de bajo tráfico si no es necesario
- Olvidar verificar que los reportes se estén ejecutando correctamente

## Troubleshooting

### El cron job no se ejecuta
- Verifica que el cron job esté **activo** en el servicio
- Revisa los **logs del servicio** de cron
- Verifica que la **URL sea correcta** y accesible

### Error 401 Unauthorized
- Verifica que el header `Authorization` tenga el formato correcto: `Bearer TU_SECRET`
- Confirma que el `CRON_SECRET` en Netlify coincida con el del header
- Revisa que no haya espacios extra en el header

### Error 500 Internal Server Error
- Revisa los **logs de Netlify Functions**
- Verifica que la base de datos esté accesible
- Confirma que los reportes programados existan y estén activos

### Los reportes no se envían por email
- Verifica la configuración del servicio de email
- Confirma que los destinatarios en `recipients` sean válidos
- Revisa los logs de `EmailService`

