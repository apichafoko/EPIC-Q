import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '../audit-service';
import { AuthContext } from './middleware';

/**
 * Helper para registrar automáticamente acciones críticas en rutas API
 */
export async function logApiAction(
  request: NextRequest,
  context: AuthContext | null,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>,
  status: 'success' | 'error' | 'warning' = 'success',
  errorMessage?: string
): Promise<void> {
  try {
    const requestInfo = AuditService.extractRequestInfo(request);
    
    await AuditService.logAction(
      context?.user.id,
      context?.user.name,
      action,
      resource,
      resourceId,
      {
        method: request.method,
        url: request.url,
        ...details,
      },
      requestInfo.ipAddress,
      requestInfo.userAgent,
      status,
      errorMessage
    );
  } catch (error) {
    // No lanzar error para no interrumpir el flujo principal
    console.error('Error logging API action:', error);
  }
}

/**
 * Determinar el recurso y acción basado en la URL y método HTTP
 */
export function determineResourceFromRequest(
  request: NextRequest
): {
  resource: string;
  action: string;
  resourceId?: string;
} {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // Extraer partes de la ruta
  const parts = pathname.split('/').filter(Boolean);

  // Mapear rutas a recursos
  let resource = 'unknown';
  let resourceId: string | undefined;
  let action = method.toLowerCase();

  // Mapeo de rutas comunes
  const resourceMap: Record<string, string> = {
    'hospitals': 'hospitals',
    'projects': 'projects',
    'users': 'users',
    'alerts': 'alerts',
    'communications': 'communications',
    'notifications': 'notifications',
    'reports': 'reports',
    'resources': 'resources',
    'coordinator': 'coordinator',
    'admin': 'admin',
  };

  // Buscar el recurso en la ruta
  for (const part of parts) {
    if (resourceMap[part]) {
      resource = resourceMap[part];
      break;
    }
  }

  // Extraer ID si está presente (formato /resource/[id] o /resource/id)
  const idMatch = pathname.match(/\/(?:hospitals|projects|users|alerts|communications|notifications)\/([^/]+)/);
  if (idMatch) {
    resourceId = idMatch[1];
  }

  // Mapear método HTTP a acción
  const actionMap: Record<string, string> = {
    'GET': 'view',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete',
  };

  action = actionMap[method] || action;

  return { resource, action, resourceId };
}

/**
 * Wrapper para API routes que registra automáticamente las acciones
 */
export function withAuditLogging<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: (request: NextRequest, context: AuthContext | null, ...args: any[]) => Promise<NextResponse>,
  options?: {
    resource?: string;
    action?: string;
    logOnError?: boolean;
  }
) {
  return async (request: NextRequest, context: AuthContext | null, ...args: any[]): Promise<NextResponse> => {
    const { resource: defaultResource, action: defaultAction } = determineResourceFromRequest(request);
    const resource = options?.resource || defaultResource;
    const action = options?.action || defaultAction;

    let response: NextResponse;
    let status: 'success' | 'error' | 'warning' = 'success';
    let errorMessage: string | undefined;

    try {
      response = await handler(request, context, ...args);

      // Determinar status basado en el código de respuesta
      if (response.status >= 500) {
        status = 'error';
      } else if (response.status >= 400) {
        status = 'warning';
      }

      // Intentar extraer mensaje de error del body si existe
      if (status === 'error' || status === 'warning') {
        try {
          const clonedResponse = response.clone();
          const body = await clonedResponse.json();
          errorMessage = body.error || body.message;
        } catch {
          // No se pudo parsear el body, ignorar
        }
      }

      // Registrar la acción
      await logApiAction(
        request,
        context,
        action,
        resource,
        undefined,
        {
          statusCode: response.status,
        },
        status,
        errorMessage
      );

      return response;
    } catch (error) {
      status = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Registrar error
      if (options?.logOnError !== false) {
        await logApiAction(
          request,
          context,
          action,
          resource,
          undefined,
          {
            error: errorMessage,
          },
          status,
          errorMessage
        );
      }

      // Re-lanzar el error para que el handler principal lo maneje
      throw error;
    }
  };
}


