# Patrón de Estados de Carga - Guía de Implementación

## 🎯 **Objetivo**

Estandarizar la experiencia de usuario en todas las operaciones asíncronas mediante un patrón consistente de estados de carga.

## 🛠️ **Componentes Disponibles**

### 1. Hook `useLoadingState`

```typescript
import { useLoadingState } from '@/hooks/useLoadingState';

const { isLoading, executeWithLoading } = useLoadingState();
```

**Características:**
- Maneja automáticamente el estado de carga
- Proporciona `executeWithLoading` para envolver operaciones asíncronas
- Maneja errores automáticamente

### 2. Componente `LoadingButton`

```typescript
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton
  onClick={handleAction}
  loading={isLoading}
  loadingText="Procesando..."
  disabled={!isValid}
>
  Guardar
</LoadingButton>
```

**Características:**
- Muestra spinner automáticamente cuando `loading={true}`
- Deshabilita el botón durante la operación
- Texto personalizable durante la carga

## 📋 **Patrón de Implementación**

### Paso 1: Importar Dependencias

```typescript
import { LoadingButton } from '@/components/ui/loading-button';
import { useLoadingState } from '@/hooks/useLoadingState';
import { toast } from 'sonner';
```

### Paso 2: Configurar Estados de Carga

```typescript
// Para una sola operación
const { isLoading, executeWithLoading } = useLoadingState();

// Para múltiples operaciones
const { isLoading: isSaving, executeWithLoading: executeWithSaving } = useLoadingState();
const { isLoading: isDeleting, executeWithLoading: executeWithDeleting } = useLoadingState();
```

### Paso 3: Implementar Funciones Asíncronas

```typescript
const handleSave = async () => {
  await executeWithSaving(async () => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al guardar');
    }

    toast.success('Guardado exitosamente');
    // Lógica adicional...
  });
};
```

### Paso 4: Usar LoadingButton

```typescript
<LoadingButton
  onClick={handleSave}
  loading={isSaving}
  loadingText="Guardando..."
  disabled={!isValid}
>
  Guardar
</LoadingButton>
```

## ✅ **Beneficios**

1. **Consistencia**: Todos los botones se comportan de la misma manera
2. **UX Mejorada**: Los usuarios siempre saben que algo está pasando
3. **Prevención de Errores**: Los botones se deshabilitan durante las operaciones
4. **Mantenibilidad**: Código más limpio y reutilizable
5. **Manejo de Errores**: Automático con toast notifications

## 🚫 **Qué NO Hacer**

```typescript
// ❌ NO hacer esto
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  try {
    setIsLoading(true);
    // operación...
  } finally {
    setIsLoading(false);
  }
};

// ❌ NO hacer esto
<Button disabled={isLoading}>
  {isLoading ? <Loader2 className="animate-spin" /> : null}
  Guardar
</Button>
```

## ✅ **Qué SÍ Hacer**

```typescript
// ✅ SÍ hacer esto
const { isLoading, executeWithLoading } = useLoadingState();

const handleAction = async () => {
  await executeWithLoading(async () => {
    // operación...
  });
};

// ✅ SÍ hacer esto
<LoadingButton
  onClick={handleAction}
  loading={isLoading}
  loadingText="Procesando..."
>
  Guardar
</LoadingButton>
```

## 📝 **Ejemplos de Uso Común**

### Crear/Actualizar Recursos

```typescript
const { isLoading: isSaving, executeWithLoading: executeWithSaving } = useLoadingState();

const handleSave = async () => {
  await executeWithSaving(async () => {
    const response = await fetch('/api/resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al guardar');
    }

    toast.success('Guardado exitosamente');
    loadData();
  });
};
```

### Eliminar Recursos

```typescript
const { isLoading: isDeleting, executeWithLoading: executeWithDeleting } = useLoadingState();

const handleDelete = async () => {
  if (!confirm('¿Está seguro de que desea eliminar?')) return;

  await executeWithDeleting(async () => {
    const response = await fetch(`/api/resource/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar');
    }

    toast.success('Eliminado exitosamente');
    loadData();
  });
};
```

### Invitaciones/Notificaciones

```typescript
const { isLoading: isInviting, executeWithLoading: executeWithInviting } = useLoadingState();

const handleInvite = async () => {
  await executeWithInviting(async () => {
    const response = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al enviar invitación');
    }

    toast.success('Invitación enviada exitosamente');
    setShowModal(false);
  });
};
```

## 🔄 **Migración de Código Existente**

### Antes (Patrón Antiguo)

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  try {
    setIsLoading(true);
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    // manejo de respuesta...
  } catch (error) {
    console.error(error);
    alert('Error');
  } finally {
    setIsLoading(false);
  }
};

<Button onClick={handleAction} disabled={isLoading}>
  {isLoading ? <Loader2 className="animate-spin" /> : null}
  Guardar
</Button>
```

### Después (Patrón Nuevo)

```typescript
const { isLoading, executeWithLoading } = useLoadingState();

const handleAction = async () => {
  await executeWithLoading(async () => {
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    // manejo de respuesta...
  });
};

<LoadingButton
  onClick={handleAction}
  loading={isLoading}
  loadingText="Guardando..."
>
  Guardar
</LoadingButton>
```

## 🎨 **Personalización**

### Textos de Carga Personalizados

```typescript
<LoadingButton
  loading={isCreating}
  loadingText="Creando hospital..."
>
  Crear Hospital
</LoadingButton>

<LoadingButton
  loading={isInviting}
  loadingText="Enviando invitación..."
>
  Enviar Invitación
</LoadingButton>
```

### Múltiples Estados

```typescript
const { isLoading: isSaving, executeWithLoading: executeWithSaving } = useLoadingState();
const { isLoading: isDeleting, executeWithLoading: executeWithDeleting } = useLoadingState();
const { isLoading: isInviting, executeWithLoading: executeWithInviting } = useLoadingState();

// Usar cada uno según corresponda
<LoadingButton loading={isSaving} loadingText="Guardando...">Guardar</LoadingButton>
<LoadingButton loading={isDeleting} loadingText="Eliminando...">Eliminar</LoadingButton>
<LoadingButton loading={isInviting} loadingText="Enviando...">Invitar</LoadingButton>
```

## 📚 **Archivos Relacionados**

- `src/hooks/useLoadingState.ts` - Hook personalizado
- `src/components/ui/loading-button.tsx` - Componente de botón
- `src/app/[locale]/admin/projects/[id]/page.tsx` - Ejemplo de implementación
- `src/app/[locale]/admin/projects/page.tsx` - Ejemplo de implementación
