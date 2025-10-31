# Configuración de Base de Datos Geográfica

## Descripción

El sistema utiliza la base de datos **countries-states-cities-database** de GitHub para obtener ciudades por provincia/estado. Esta solución es escalable y funciona para cualquier país del mundo.

**Repositorio**: https://github.com/dr5hn/countries-states-cities-database

## Características

- ✅ **Gratuita y de código abierto**
- ✅ **Sin límites de requests** (usa datos estáticos desde GitHub)
- ✅ **Actualizaciones automáticas** (next.js revalidation cada 24h)
- ✅ **Escalable a cualquier país** (249 países disponibles)
- ✅ **Datos completos**: nombres, códigos ISO, coordenadas, etc.
- ✅ **Fallback robusto**: si falla la carga, usa datos estáticos locales

## Funcionamiento

### Flujo de Datos

1. **Primera opción**: Obtiene ciudades desde el repositorio GitHub (JSON público)
2. **Caché en memoria**: Almacena resultados por 24 horas
3. **Fallback**: Si falla, usa datos estáticos predefinidos (ciudades principales de Argentina)
4. **Combinación**: También incluye ciudades de hospitales existentes en la BD para mostrar conteos

### Endpoint

```
GET /api/geographic/cities?province=Buenos Aires&country=AR
```

### Respuesta

```json
{
  "success": true,
  "data": [
    {
      "name": "La Plata",
      "province": "Buenos Aires",
      "country": "AR",
      "latitude": "-34.9215",
      "longitude": "-57.9545"
    },
    ...
  ],
  "province": "Buenos Aires",
  "country": "AR",
  "count": 150,
  "source": "countries-states-cities-database"
}
```

## Estructura de Datos

La base de datos incluye:

- **Países**: 249 países con códigos ISO2, ISO3, códigos numéricos, etc.
- **Estados/Provincias**: Todos los estados/provincias por país
- **Ciudades**: Ciudades con coordenadas, códigos, etc.

### Formatos Disponibles

El repositorio incluye datos en múltiples formatos:
- JSON ✅ (que usamos)
- SQL
- PostgreSQL
- SQL Server
- MongoDB
- SQLite
- XML
- YAML
- CSV

## Escalabilidad

### Para Agregar Otros Países

El sistema ya está preparado para cualquier país. Solo necesitas:

1. **Usar el código ISO2 del país**:
   ```typescript
   await GeographicService.getCitiesByProvince('California', 'US'); // USA
   await GeographicService.getCitiesByProvince('São Paulo', 'BR'); // Brasil
   ```

2. **Obtener estados/provincias del país**:
   ```typescript
   await GeographicService.getStatesByCountry('BR'); // Brasil
   ```

### Actualización de Datos

Los datos se actualizan automáticamente desde GitHub cada 24 horas gracias a Next.js `revalidate`. Si necesitas datos más frescos:

- Modificar `revalidate` en `src/lib/services/geographic-service.ts`
- O implementar un webhook de GitHub para actualizar cache manualmente

## Ventajas sobre GeoNames

- ✅ **Sin registro necesario** (API pública)
- ✅ **Sin límites de requests**
- ✅ **Sin costos ocultos**
- ✅ **Datos completos y actualizados** (repositorio activo con 8.9k stars)
- ✅ **Múltiples formatos disponibles**
- ✅ **Mejor para datos estáticos** (ciudades no cambian frecuentemente)

## Próximos Pasos (Opcional)

- [ ] Descargar archivos JSON localmente para mejor performance offline
- [ ] Implementar caché en Redis para producción
- [ ] Agregar endpoint para obtener estados/provincias de un país
- [ ] Agregar búsqueda de ciudades por nombre
- [ ] Integrar coordenadas para mapas interactivos

## Referencias

- Repositorio: https://github.com/dr5hn/countries-states-cities-database
- Documentación: https://countrystatecity.in/
- Licencia: ODbL-1.0

