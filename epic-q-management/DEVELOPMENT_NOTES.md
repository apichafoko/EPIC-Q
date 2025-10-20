# Notas de Desarrollo - EPIC-Q

## Next.js 15 - Manejo de Parámetros en API Routes

### Problema Común
Al implementar nuevas funciones de API, es común encontrar errores 500 (Internal Server Error) donde los parámetros de ruta aparecen como `undefined` en la base de datos.

### Causa Raíz
En Next.js 15, el manejo de parámetros en API routes cambió significativamente. Los parámetros ahora son un `Promise` que debe ser manejado correctamente.

### ❌ Sintaxis Incorrecta (Causa Errores)
```typescript
// Middleware personalizado que pasa parámetros incorrectamente
async function handler(
  req: NextRequest,
  context: AuthContext,
  params?: Promise<{ id: string }>
) {
  const { id: projectId } = await params; // ❌ Esto resulta en undefined
}

export const GET = withAdminAuth(handler);
export const POST = withAdminAuth(handler);
```

### ✅ Sintaxis Correcta (Next.js 15)
```typescript
// Función handler interna
async function handler(
  req: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params; // ✅ Esto funciona correctamente
}

// Exportaciones usando la sintaxis correcta de Next.js 15
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}
```

### Puntos Clave
1. **Los parámetros deben ser destructurados** en la función de exportación: `{ params }: { params: Promise<{ id: string }> }`
2. **Los parámetros se pasan como objeto** al handler: `handler(req, context, { params })`
3. **El middleware no debe manejar parámetros** directamente, solo autenticación
4. **Cada método HTTP necesita su propia función** de exportación

### Ejemplo de Implementación Completa
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import prisma from '@/lib/db-connection';

async function handler(
  req: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  
  if (req.method === 'GET') {
    // Lógica GET
  }
  
  if (req.method === 'POST') {
    // Lógica POST
  }
  
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}
```

### Debugging
Si los parámetros aparecen como `undefined`:
1. Verificar que se esté usando la sintaxis correcta de Next.js 15
2. Asegurar que los parámetros se pasen como objeto al handler
3. Confirmar que el middleware no esté interfiriendo con el paso de parámetros

### Referencia
- Archivo de ejemplo: `src/app/api/admin/projects/[id]/route.ts`
- Archivo corregido: `src/app/api/admin/projects/[id]/resources/route.ts`
- Fecha: 2025-10-20
