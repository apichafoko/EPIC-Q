# Validación de Campos Booleanos - Diferenciación entre Valores por Defecto y Seleccionados

## Problema

Anteriormente, no había forma de distinguir entre:
- `false` por defecto (campo no completado por el usuario)
- `false` seleccionado explícitamente por el coordinador (campo completado)

## Solución Implementada

### 1. Cambio en el Esquema de Base de Datos

**Antes:**
```prisma
lasos_participation  Boolean  @default(false)
```

**Después:**
```prisma
lasos_participation  Boolean?
```

### 2. Lógica de Validación

```typescript
// Para campos booleanos
if (typeof field.value === 'boolean') {
  // Solo se considera completado si tiene un valor explícito (true o false)
  // null o undefined se consideran pendientes
  return field.value !== null && field.value !== undefined;
}
```

### 3. Estados del Campo

| Valor | Estado | Descripción |
|-------|--------|-------------|
| `null` | ❌ Pendiente | Campo no completado por el usuario |
| `true` | ✅ Completado | Usuario seleccionó "Sí" |
| `false` | ✅ Completado | Usuario seleccionó "No" |

### 4. Flujo de Trabajo

1. **Creación del Hospital**: `lasos_participation` se inicializa como `null`
2. **Formulario Pendiente**: El campo aparece como pendiente hasta que el usuario interactúe
3. **Selección del Usuario**: 
   - Si selecciona "Sí" → `true` (completado)
   - Si selecciona "No" → `false` (completado)
4. **Validación**: Solo se considera completado cuando tiene un valor explícito

### 5. Ejemplo Práctico

```javascript
// Hospital recién creado
const hospital = {
  lasos_participation: null  // Pendiente
};

// Después de que el coordinador complete el formulario
const hospital = {
  lasos_participation: false  // Completado (usuario eligió "No")
};
```

## Beneficios

- ✅ **Precisión**: Distingue claramente entre campos no completados y completados
- ✅ **UX Mejorada**: Los usuarios ven exactamente qué campos necesitan completar
- ✅ **Cálculo Correcto**: El porcentaje de completitud refleja el estado real
- ✅ **Flexibilidad**: Permite tanto `true` como `false` como valores válidos completados

## Migración

Los hospitales existentes mantienen sus valores actuales (`true` o `false`), pero los nuevos hospitales se crean con `null` hasta que el usuario complete el formulario.
