/**
 * Utilidades para manejo de respuestas de API
 */

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

/**
 * Maneja una respuesta de fetch de manera segura, parseando JSON solo cuando es apropiado
 * @param response - La respuesta de fetch
 * @returns Un objeto con los datos parseados, error y estado
 */
export async function handleApiResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  let data: T | null = null;
  let error: string | null = null;

  // Verificar si la respuesta tiene contenido JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      const text = await response.text();
      if (text.trim()) {
        data = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      error = 'Error al procesar la respuesta del servidor';
      return {
        data: null,
        error,
        status: response.status,
        ok: false
      };
    }
  }

  // Si no es JSON, verificar si hay un error de estado
  if (!response.ok) {
    error = (data as any)?.message || (data as any)?.error || `Error ${response.status}: ${response.statusText}`;
  }

  return {
    data,
    error,
    status: response.status,
    ok: response.ok
  };
}

/**
 * Wrapper para fetch que incluye manejo automático de respuestas JSON
 * @param url - URL a la que hacer la petición
 * @param options - Opciones de fetch
 * @returns Promise con la respuesta procesada
 */
export async function safeFetch<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options
    });
    
    return await handleApiResponse<T>(response);
  } catch (networkError) {
    console.error('Network error:', networkError);
    return {
      data: null,
      error: 'Error de conexión. Verifica tu conexión a internet.',
      status: 0,
      ok: false
    };
  }
}

/**
 * Maneja errores de API de manera consistente
 * @param error - El error a manejar
 * @param defaultMessage - Mensaje por defecto si no se puede extraer uno del error
 * @returns Mensaje de error formateado
 */
export function formatApiError(error: any, defaultMessage: string = 'Error interno del servidor'): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  if (error?.details) {
    return error.details;
  }
  
  return defaultMessage;
}
