import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
const locales = ['es', 'pt', 'en'];
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from '@/components/ui/sonner';
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
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Obtener mensajes para el locale
  const messages = await import(`../messages/${locale}.json`).then(m => m.default);

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}