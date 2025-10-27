'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from '../../../../hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthErrorPage() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Hay un problema con la configuración del servidor.';
      case 'AccessDenied':
        return 'Acceso denegado. No tienes permisos para acceder.';
      case 'Verification':
        return 'El token ha expirado o ya ha sido usado.';
      default:
        return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>{t('auth.error.title')}</span>
            </CardTitle>
            <CardDescription>
              {t('auth.error.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {getErrorMessage(error)}
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button asChild variant="outline">
                <Link href="/es/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('auth.error.backToLogin')}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/es">
                  {t('auth.error.goHome')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
