'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || t('auth.somethingWentWrong'));
      }
    } catch (error) {
      setError(t('auth.somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('auth.emailSent')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('auth.resetEmailSent')}
                </p>
                <div className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href="/auth/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('auth.backToLogin')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/auth/resend-email">
                      {t('auth.resendEmail')}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">EQ</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {t('auth.forgotPassword')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.forgotPasswordDesc')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.resetPassword')}</CardTitle>
            <CardDescription>
              {t('auth.enterEmailToReset')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.sendResetLink')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.backToLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
