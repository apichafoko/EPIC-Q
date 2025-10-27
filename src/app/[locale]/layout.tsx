import type { Viewport, Metadata } from "next";
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '../../contexts/auth-context';
import { ProjectProvider } from '../../contexts/project-context';
import { MainLayout } from '../../components/layout/main-layout';
import { Toaster } from '../../components/ui/sonner';
import { ServiceWorkerRegistration } from '../../components/pwa/service-worker-registration';
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
  description: "Sistema de gestión para el estudio EPIC-Q",
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

// Generar params estáticos para cada locale
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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
  
  // Log para debugging
  console.log('🏗️ LocaleLayout ejecutándose:');
  console.log('  - Locale recibido:', locale);
  console.log('  - Locales válidos:', locales);
  
  // Validar que el locale sea válido
  if (!locales.includes(locale as 'es' | 'pt' | 'en')) {
    console.log('  ❌ Locale inválido, llamando notFound()');
    notFound();
  }

  console.log('  ✅ Locale válido, renderizando layout');

  // Obtener mensajes para el locale
  const messages = await import(`../../messages/${locale}.json`).then(m => m.default);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ProjectProvider>
              <MainLayout>
                {children}
              </MainLayout>
              <Toaster />
              <ServiceWorkerRegistration />
            </ProjectProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
