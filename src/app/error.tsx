'use client';

import { useEffect } from 'react';
import { errorHandler } from '@/lib/error-handler';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capturar el error en el sistema de logging
    errorHandler.captureError(error, {
      resource: 'error-boundary',
      action: 'render-error',
      metadata: {
        digest: error.digest,
        name: error.name,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          Algo salió mal
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Lo sentimos, ocurrió un error inesperado. Nuestro equipo ha sido notificado.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg text-left">
            <p className="text-sm font-semibold text-destructive mb-2">
              Detalles del error (solo en desarrollo):
            </p>
            <p className="text-xs text-destructive font-mono break-all">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-destructive cursor-pointer">
                  Ver stack trace
                </summary>
                <pre className="mt-2 text-xs text-destructive overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-secondary text-foreground rounded-md hover:bg-accent transition-colors font-medium"
          >
            Ir al inicio
          </button>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
