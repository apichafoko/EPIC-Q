'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError(t('auth.invalidToken'));
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, t]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!passwordValidation.isValid) {
      setError(t('auth.passwordRequirements'));
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password,
          confirmPassword 
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
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
                  {t('auth.passwordReset')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('auth.passwordResetSuccess')}
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    {t('auth.continueToLogin')}
                  </Link>
                </Button>
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
            {t('auth.resetPassword')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.enterNewPassword')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.setNewPassword')}</CardTitle>
            <CardDescription>
              {t('auth.passwordRequirementsDesc')}
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
                <Label htmlFor="password">{t('auth.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.newPasswordPlaceholder')}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Password requirements */}
                {password && (
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center space-x-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.minLength ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>{t('auth.minLength')}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasUpperCase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>{t('auth.hasUpperCase')}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasLowerCase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>{t('auth.hasLowerCase')}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasNumbers ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>{t('auth.hasNumbers')}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.hasSpecialChar ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      <span>{t('auth.hasSpecialChar')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600">{t('auth.passwordMismatch')}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.resetPassword')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
