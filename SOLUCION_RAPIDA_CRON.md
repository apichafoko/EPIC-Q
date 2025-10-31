# 🚀 Solución Rápida: Configurar Cron Job en 5 Minutos

## El Problema

Netlify CLI no tiene el comando `netlify functions:schedule`. Necesitas usar un método alternativo.

## ✅ Solución Más Rápida: Cron-Job.org (Recomendado)

### Paso 1: Crear cuenta (1 minuto)

1. Ve a [https://cron-job.org](https://cron-job.org)
2. Haz clic en **"Sign up"** (gratis)
3. Confirma tu email

### Paso 2: Crear el cron job (2 minutos)

1. Haz clic en **"+ New Cronjob"** o **"Create cronjob"**
2. Completa:

**URL:**
```
https://epic-q.netlify.app/.netlify/functions/cron-reports
```

**Título:**
```
Reportes Mensuales EPIC-Q
```

**Schedule - Cron Expression:**
```
0 9 1 * *
```
(Primer día de cada mes a las 9 AM UTC)

**Headers:**

Agrega un header con:
- **Key:** `Authorization`
- **Value:** `Bearer TU_CRON_SECRET_AQUI`

(Reemplaza `TU_CRON_SECRET_AQUI` con el valor de `CRON_SECRET` que configuraste en Netlify)

**Método:**
```
GET
```

### Paso 3: Obtener tu CRON_SECRET (1 minuto)

1. Ve a [Netlify Dashboard](https://app.netlify.com)
2. Selecciona tu sitio **epic-q**
3. Ve a **Site settings > Environment variables**
4. Busca `CRON_SECRET` o créalo si no existe:
   - Click en **"Add variable"**
   - Key: `CRON_SECRET`
   - Value: Un string aleatorio seguro (ej: `epic-q-cron-secret-2024-abc123xyz`)
5. Copia el valor y úsalo en el header del cron job

### Paso 4: Activar y Probar (1 minuto)

1. En cron-job.org, activa el toggle **"Active"** o **"Enabled"**
2. Haz clic en **"Save"**
3. Haz clic en **"Execute now"** para probar
4. Verifica en **"Execution history"** que retornó status 200

## ✅ ¡Listo!

El cron job se ejecutará automáticamente el primer día de cada mes a las 9 AM UTC.

## 🔍 Verificar que Funcionó

### Opción 1: Revisar logs en cron-job.org

Ve a la pestaña **"Execution history"** de tu cron job y verifica que:
- Status: 200 (success)
- Última ejecución: Muestra la fecha/hora correcta

### Opción 2: Verificar en la base de datos

```sql
-- Ver reportes ejecutados recientemente
SELECT * FROM report_history 
ORDER BY generated_at DESC 
LIMIT 10;

-- Ver reportes programados activos
SELECT name, frequency, next_run_at, last_run_at 
FROM scheduled_reports 
WHERE is_active = true;
```

### Opción 3: Test manual desde terminal

```bash
curl -X GET \
  -H "Authorization: Bearer TU_CRON_SECRET_AQUI" \
  https://epic-q.netlify.app/.netlify/functions/cron-reports
```

Deberías ver:
```json
{
  "success": true,
  "executed": 0,
  "results": []
}
```

(Si `executed: 0`, significa que no hay reportes programados listos para ejecutar, lo cual es normal si aún no has creado reportes programados)

## 📝 Notas Importantes

1. **Primera ejecución:** Cron-job.org ejecuta inmediatamente después de crear el job para verificar que funciona
2. **Timezone:** El cron usa UTC. Ajusta según tu zona horaria si es necesario
3. **Cambiar frecuencia:** Puedes editar el cron job en cualquier momento y cambiar la expresión cron
4. **Límite gratuito:** Cron-job.org permite hasta 2 cron jobs gratuitos, suficiente para esto

## ❌ Troubleshooting Rápido

**Error 401 Unauthorized:**
- Verifica que el header `Authorization` tenga el formato: `Bearer TU_SECRET`
- Confirma que `CRON_SECRET` en Netlify coincida exactamente con el del header
- Sin espacios extra

**Error 500:**
- Revisa los logs de Netlify Functions
- Verifica que la función `cron-reports` esté deployada correctamente

**No se ejecuta:**
- Verifica que el cron job esté **Active/Enabled** en cron-job.org
- Revisa que la URL sea correcta y accesible públicamente
- Verifica la expresión cron (puedes usar [crontab.guru](https://crontab.guru) para validarla)

## 🎯 Próximo Paso

Una vez que el cron job funcione, crea algunos reportes programados desde la aplicación para que tengan contenido que enviar. Ve a la sección de Reportes Programados en el dashboard de admin.

