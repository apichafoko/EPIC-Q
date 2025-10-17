import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/contexts/auth-context';
import { MainLayout } from '@/components/layout/main-layout';
import { LocaleWrapper } from '@/components/locale-wrapper';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker-registration';
import '../globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EPIC-Q - Sistema de Gestión",
  description: "Sistema de gestión para el estudio EPIC-Q (Estudio Perioperatorio Integral de Cuidados Quirúrgicos en Argentina)",
};

export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#2563eb',
  };
}

const locales = ['es', 'pt', 'en'];

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  // Esperar los parámetros
  const { locale } = await params;
  
  // Validar que el locale sea válido
  if (!locales.includes(locale as 'es' | 'pt' | 'en')) {
    notFound();
  }

          return (
            <AuthProvider>
              <LocaleWrapper locale={locale}>
                <MainLayout>
                  {children}
                </MainLayout>
                <Toaster />
                <ServiceWorkerRegistration />
              </LocaleWrapper>
            </AuthProvider>
          );
}
