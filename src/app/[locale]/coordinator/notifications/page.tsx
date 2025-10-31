'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LegacyCoordinatorNotificationsRedirect() {
  const router = useRouter();
  const params = useParams();
  useEffect(() => {
    const locale = (params as any)?.locale || 'es';
    router.replace(`/${locale}/coordinator/inbox`);
  }, [params, router]);
  return null;
}
