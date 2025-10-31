import type { Viewport, Metadata } from "next";
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '../../contexts/auth-context';
import { ProjectProvider } from '../../contexts/project-context';
import { ThemeProvider } from '../../providers/theme-provider';
import { MainLayout } from '../../components/layout/main-layout';
import { Toaster } from '../../components/ui/sonner';
import { ServiceWorkerRegistration } from '../../components/pwa/service-worker-registration';
import { PWAManifestRegistrator } from '../../components/pwa/pwa-manifest-registrator';
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
  manifest: '/api/manifest'
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Limpiar key antigua "theme" si tiene valor dark o system
                  const oldTheme = localStorage.getItem('theme');
                  if (oldTheme === 'dark' || oldTheme === 'system') {
                    localStorage.removeItem('theme');
                  }
                  
                  // Establecer "light" como valor por defecto si no existe o es inválido
                  const currentTheme = localStorage.getItem('epic-q-theme');
                  if (!currentTheme || !['light', 'dark', 'high-contrast'].includes(currentTheme)) {
                    localStorage.setItem('epic-q-theme', 'light');
                  }
                  
                  // Determinar tema final: usar el guardado o 'light' por defecto
                  const savedTheme = localStorage.getItem('epic-q-theme');
                  const finalTheme = (savedTheme && ['light', 'dark', 'high-contrast'].includes(savedTheme)) 
                    ? savedTheme 
                    : 'light';
                  
                  // Aplicar tema inmediatamente antes de que React se hidrate
                  const html = document.documentElement;
                  html.classList.remove('dark', 'high-contrast', 'light');
                  html.classList.add(finalTheme);
                } catch (e) {
                  console.error('Error setting default theme:', e);
                  // Fallback: asegurar que no esté en modo dark
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          themes={['light', 'dark', 'high-contrast']}
          storageKey="epic-q-theme"
          forcedTheme={undefined}
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
              <ProjectProvider>
                <PWAManifestRegistrator />
                <MainLayout>
                  {children}
                </MainLayout>
                <Toaster position="top-right" />
                <ServiceWorkerRegistration />
              </ProjectProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
