'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { useTranslations } from '../../../hooks/useTranslations';
import { InstallPrompt } from '../../../components/pwa/install-prompt';
import { OfflineIndicator } from '../../../components/pwa/offline-indicator';

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const { t } = useTranslations();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'coordinator') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('common.error')}
          </h1>
          <p className="text-gray-600">
            {t('common.somethingWentWrong')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <InstallPrompt />
      <OfflineIndicator />
    </>
  );
}
