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
  icons: {
    icon: [
      { url: '/logo-official.svg', type: 'image/svg+xml' },
      { url: '/icons/android-chrome-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/android-chrome-512x512.svg', sizes: '512x512', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/logo-official.svg'
  },
  manifest: '/manifest.json'
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
  const { locale } = await params;
  
  // Validar locale
  if (!locales.includes(locale)) {
    notFound();
  }

  // Importar mensajes de traducción
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Error loading messages for locale ${locale}:`, error);
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <ProjectProvider>
              <MainLayout>
                {children}
              </MainLayout>
              <Toaster position="top-right" />
              <ServiceWorkerRegistration />
            </ProjectProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
