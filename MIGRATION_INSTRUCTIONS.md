# Instrucciones para Aplicar la Migración de Fase 2

## 📋 Resumen

Esta migración agrega las siguientes tablas nuevas:
- `scheduled_reports` - Reportes programados
- `report_history` - Historial de ejecuciones de reportes
- `security_logs` - Logs de seguridad

**⚠️ IMPORTANTE:** Este script es **100% seguro** y NO borrará ningún dato existente.

## 🚀 Opción 1: Ejecutar SQL directamente en la base de datos

### Para PostgreSQL (Recomendado)

1. Conéctate a tu base de datos PostgreSQL usando tu cliente preferido (psql, pgAdmin, DBeaver, etc.)

2. Ejecuta el contenido del archivo:
   ```
   prisma/migrations/apply_scheduled_reports_and_security_logs.sql
   ```

3. El script incluye verificaciones `IF NOT EXISTS`, por lo que es seguro ejecutarlo múltiples veces.

### Ejemplo con psql desde terminal:

```bash
psql "tu_connection_string" -f prisma/migrations/apply_scheduled_reports_and_security_logs.sql
```

### Ejemplo desde Node.js (opcional):

```javascript
const { Client } = require('pg');
const fs = require('fs');
const sql = fs.readFileSync('prisma/migrations/apply_scheduled_reports_and_security_logs.sql', 'utf8');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log('✅ Migración aplicada exitosamente');
    client.end();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    client.end();
  });
```

## 🔧 Opción 2: Usar Prisma Studio

Si prefieres una interfaz visual:

1. Abre Prisma Studio: `npx prisma studio`
2. Ejecuta el SQL directamente desde la consola SQL de Prisma Studio

## ✅ Verificación

Después de ejecutar el script, verifica que las tablas se crearon correctamente:

```sql
-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('scheduled_reports', 'report_history', 'security_logs');

-- Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('scheduled_reports', 'report_history', 'security_logs');
```

## 🔄 Sincronizar Prisma después de la migración

Una vez que hayas ejecutado el SQL en la base de datos, sincroniza Prisma:

```bash
npx prisma db pull
```

Esto actualizará el schema de Prisma para reflejar los cambios en la base de datos.

Luego, marca la migración como aplicada:

```bash
# Si usas Prisma Migrate, marca esta migración como aplicada
npx prisma migrate resolve --applied 20250131120000_add_scheduled_reports_and_security_logs
```

O simplemente crea un registro manual en la tabla `_prisma_migrations`:

```sql
INSERT INTO "_prisma_migrations" (
    id, 
    checksum, 
    finished_at, 
    migration_name, 
    logs, 
    rolled_back_at, 
    started_at, 
    applied_steps_count
) VALUES (
    gen_random_uuid(),
    'manual_migration',
    NOW(),
    '20250131120000_add_scheduled_reports_and_security_logs',
    NULL,
    NULL,
    NOW(),
    1
);
```

## 📝 Notas

- El script usa `CREATE TABLE IF NOT EXISTS`, así que puedes ejecutarlo múltiples veces sin problemas
- Las foreign keys se agregan solo si no existen
- Los índices se crean solo si no existen
- No se modifican tablas existentes, solo se agregan nuevas

## 🆘 Si algo sale mal

Si encuentras algún error, los mensajes de error de PostgreSQL te indicarán qué está fallando. Los errores más comunes son:

- **Error de permisos**: Asegúrate de tener permisos de CREATE TABLE en la base de datos
- **Foreign key error**: Verifica que la tabla `users` existe antes de crear las foreign keys
- **Tipo de dato no soportado**: Asegúrate de estar usando PostgreSQL 12 o superior

Para revertir (eliminar las tablas nuevas):

```sql
DROP TABLE IF EXISTS "report_history";
DROP TABLE IF EXISTS "scheduled_reports";
DROP TABLE IF EXISTS "security_logs";
```

