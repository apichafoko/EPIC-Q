# 🚀 Características Avanzadas - EPIC-Q Management

## 📋 Índice

1. [Notificaciones Push](#notificaciones-push)
2. [Exportación Avanzada](#exportación-avanzada)
3. [Filtros Avanzados](#filtros-avanzados)
4. [Búsqueda Global](#búsqueda-global)
5. [Dashboard de Auditoría](#dashboard-de-auditoría)
6. [Shortcuts de Teclado](#shortcuts-de-teclado)
7. [Edición Masiva](#edición-masiva)
8. [Templates de Exportación](#templates-de-exportación)

---

## 🔔 Notificaciones Push

### Características
- **Service Worker** integrado para notificaciones en segundo plano
- **Suscripción automática** con VAPID keys
- **Persistencia** de suscripciones en base de datos
- **Notificaciones contextuales** con acciones personalizadas

### Implementación

#### Service Worker (`/public/sw-push.js`)
```javascript
// Maneja notificaciones push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    actions: [
      { action: 'explore', title: 'Ver detalles' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  self.registration.showNotification('EPIC-Q', options);
});
```

#### Servicio de Push (`/src/lib/notifications/push-service.ts`)
```typescript
const pushService = PushService.getInstance();
await pushService.initialize();
await pushService.requestPermission();
const subscription = await pushService.subscribe();
await pushService.saveSubscriptionToServer(subscription);
```

### Uso
```typescript
// Enviar notificación
await pushService.sendNotification('Título', {
  body: 'Mensaje de la notificación',
  data: { url: '/es/admin/projects/123' }
});
```

---

## 📊 Exportación Avanzada

### Características
- **Múltiples formatos**: CSV, Excel (.xlsx), PDF
- **Templates personalizables** para diferentes tipos de datos
- **Metadatos incluidos** en archivos exportados
- **Exportación de tablas HTML** a PDF con html2canvas

### Librerías Utilizadas
- `xlsx` - Para archivos Excel
- `jspdf` - Para archivos PDF
- `html2canvas` - Para capturar tablas HTML

### Implementación

#### Servicio Avanzado (`/src/lib/export-advanced-service.ts`)
```typescript
// Exportar a Excel con template
await AdvancedExportService.exportToExcel(data, template);

// Exportar a PDF
await AdvancedExportService.exportToPDF(data, template);

// Exportar tabla HTML a PDF
await AdvancedExportService.exportTableToPDF(tableElement, 'Mi Tabla');
```

#### Templates Predefinidos
```typescript
const templates = [
  {
    id: 'hospitals-basic',
    name: 'Hospitales Básico',
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', width: 30 },
      { key: 'city', label: 'Ciudad', type: 'text', width: 20 }
    ]
  }
];
```

---

## 🔍 Filtros Avanzados

### Características
- **Múltiples tipos de filtro**: texto, select, fecha, rango de fechas, número, booleano
- **Filtros combinables** con operadores lógicos
- **Persistencia** de filtros activos
- **Reset automático** de paginación al cambiar filtros

### Implementación

#### Componente (`/src/components/ui/advanced-filters.tsx`)
```typescript
const filterOptions: FilterOption[] = [
  {
    key: 'name',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Buscar por nombre...'
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' }
    ]
  },
  {
    key: 'created_at',
    label: 'Fecha de Creación',
    type: 'dateRange'
  }
];
```

#### Uso
```tsx
<AdvancedFilters
  filters={filterOptions}
  onFiltersChange={handleFiltersChange}
  onClearFilters={handleClearFilters}
/>
```

---

## 🌐 Búsqueda Global

### Características
- **Búsqueda unificada** en todos los proyectos
- **Múltiples tipos de contenido**: proyectos, hospitales, coordinadores
- **Historial de búsquedas** con sugerencias
- **Filtros por tipo** y proyecto
- **Scoring inteligente** para resultados relevantes

### Implementación

#### Servicio (`/src/lib/global-search-service.ts`)
```typescript
// Búsqueda global
const results = await GlobalSearchService.search('término', {
  types: ['project', 'hospital'],
  projects: ['project-id']
});

// Búsqueda específica
const hospitals = await GlobalSearchService.searchHospitals('hospital', 'project-id');
```

#### Componente (`/src/components/ui/global-search.tsx`)
```tsx
<GlobalSearch
  placeholder="Buscar en todos los proyectos..."
  onResultClick={(result) => {
    if (result.type === 'project') {
      router.push(result.url);
    } else {
      window.open(result.url, '_blank');
    }
  }}
/>
```

---

## 📈 Dashboard de Auditoría

### Características
- **Visualización completa** de logs de actividad
- **Estadísticas en tiempo real** de uso del sistema
- **Filtros avanzados** por usuario, acción, fecha
- **Exportación** de logs a CSV
- **Análisis de tendencias** y patrones de uso

### Implementación

#### Servicio de Auditoría (`/src/lib/audit-service.ts`)
```typescript
// Registrar acción
AuditService.logAction(
  userId,
  userName,
  'CREATE',
  'project',
  projectId,
  { details: 'Proyecto creado' }
);

// Obtener logs
const logs = AuditService.getLogs(userId, 'project');
```

#### Dashboard (`/src/app/[locale]/admin/audit/page.tsx`)
- **Métricas clave**: total acciones, acciones hoy, usuarios únicos
- **Tabla de actividad** con paginación y filtros
- **Análisis por tipo** de acción y recurso
- **Exportación** de datos

---

## ⌨️ Shortcuts de Teclado

### Características
- **Navegación rápida** entre secciones
- **Acciones contextuales** en tablas
- **Ayuda integrada** (Ctrl+?)
- **Configuración flexible** por página

### Shortcuts Disponibles

#### Navegación
- `Ctrl+H` - Ir al Dashboard
- `Ctrl+P` - Ir a Proyectos
- `Ctrl+U` - Ir a Usuarios
- `Ctrl+A` - Ir a Auditoría

#### Acciones Generales
- `Ctrl+N` - Crear nuevo elemento
- `Ctrl+S` - Guardar cambios
- `Ctrl+F` - Buscar
- `Escape` - Cancelar/Cerrar

#### Navegación en Tablas
- `Ctrl+↑` - Fila anterior
- `Ctrl+↓` - Fila siguiente
- `Enter` - Ver detalles
- `E` - Editar elemento
- `Delete` - Eliminar elemento

### Implementación

#### Hook (`/src/hooks/useKeyboardShortcuts.ts`)
```typescript
const shortcuts = createAppShortcuts(router);
useKeyboardShortcuts({
  shortcuts,
  enabled: true,
  showHelp: true
});
```

---

## ✏️ Edición Masiva

### Características
- **Selección múltiple** de elementos
- **Edición simultánea** de campos específicos
- **Validación** de datos antes de guardar
- **Confirmación** de acciones destructivas
- **Soporte** para múltiples tipos de campo

### Implementación

#### Componente (`/src/components/ui/bulk-edit.tsx`)
```tsx
<BulkEdit
  isOpen={isBulkEditOpen}
  onClose={() => setIsBulkEditOpen(false)}
  onSave={handleBulkSave}
  selectedItems={selectedItems}
  fields={bulkEditFields}
  itemType="hospital"
/>
```

#### Campos Soportados
- **Texto**: Input simple
- **Número**: Input numérico
- **Select**: Lista desplegable
- **Booleano**: Sí/No
- **Fecha**: Selector de fecha

---

## 📋 Templates de Exportación

### Características
- **Templates predefinidos** para casos comunes
- **Creación de templates personalizados**
- **Configuración de campos** con tipos y anchos
- **Metadatos automáticos** en archivos exportados

### Templates Disponibles

#### Hospitales Básico
```typescript
{
  id: 'hospitals-basic',
  name: 'Hospitales Básico',
  fields: [
    { key: 'name', label: 'Nombre', type: 'text', width: 30 },
    { key: 'city', label: 'Ciudad', type: 'text', width: 20 },
    { key: 'status', label: 'Estado', type: 'text', width: 15 }
  ]
}
```

#### Coordinadores Detallado
```typescript
{
  id: 'coordinators-detailed',
  name: 'Coordinadores Detallado',
  fields: [
    { key: 'name', label: 'Nombre', type: 'text', width: 30 },
    { key: 'email', label: 'Email', type: 'text', width: 35 },
    { key: 'hospital_name', label: 'Hospital', type: 'text', width: 30 }
  ]
}
```

### Creación de Templates Personalizados
```typescript
const customTemplate = AdvancedExportService.createCustomTemplate(
  'Mi Template',
  'Descripción del template',
  [
    { key: 'field1', label: 'Campo 1', type: 'text', required: true },
    { key: 'field2', label: 'Campo 2', type: 'number', required: false }
  ],
  'excel'
);
```

---

## 🛠️ Configuración y Uso

### Variables de Entorno Requeridas
```env
# Para notificaciones push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Para exportación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Dependencias Adicionales
```json
{
  "xlsx": "^0.18.5",
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1",
  "@types/xlsx": "^0.0.36"
}
```

### Integración en Componentes
```tsx
// Importar servicios
import { AdvancedExportService } from '@/lib/export-advanced-service';
import { GlobalSearchService } from '@/lib/global-search-service';
import { AuditService } from '@/lib/audit-service';

// Usar en componentes
const handleExport = () => {
  AdvancedExportService.exportToExcel(data, template);
};

const handleSearch = async (query: string) => {
  const results = await GlobalSearchService.search(query);
  setSearchResults(results);
};
```

---

## 📚 Recursos Adicionales

### Documentación de Librerías
- [XLSX.js](https://sheetjs.com/) - Manipulación de archivos Excel
- [jsPDF](https://github.com/parallax/jsPDF) - Generación de PDFs
- [html2canvas](https://html2canvas.hertzen.com/) - Captura de elementos HTML

### Mejores Prácticas
1. **Performance**: Usar debounce en búsquedas
2. **UX**: Mostrar estados de carga en operaciones largas
3. **Accesibilidad**: Incluir labels y aria-labels
4. **Seguridad**: Validar datos antes de exportar
5. **Mantenibilidad**: Usar TypeScript para type safety

---

## 🎯 Próximas Mejoras

### Funcionalidades Futuras
- [ ] **Notificaciones en tiempo real** con WebSockets
- [ ] **Exportación programada** con cron jobs
- [ ] **Filtros guardados** con nombres personalizados
- [ ] **Búsqueda semántica** con IA
- [ ] **Dashboard personalizable** con widgets
- [ ] **Integración con APIs externas**
- [ ] **Modo offline** con sincronización
- [ ] **Temas personalizables** para la interfaz

### Optimizaciones
- [ ] **Lazy loading** de componentes pesados
- [ ] **Caching** de resultados de búsqueda
- [ ] **Compresión** de archivos exportados
- [ ] **Paginación virtual** para listas grandes
- [ ] **Web Workers** para operaciones pesadas

---

*Documentación actualizada: Diciembre 2024*
*Versión: 1.0.0*
