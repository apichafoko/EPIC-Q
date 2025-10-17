import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from 'next/navigation';
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
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MainLayout>
          {children}
        </MainLayout>
        <Toaster />
      </body>
    </html>
  );
}
