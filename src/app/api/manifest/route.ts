import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Intentar obtener el locale de la cookie o query param
  // Para PWA, siempre usar español por defecto si no hay preferencia explícita
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;
  const localeParam = searchParams.get('locale');
  const startUrlParam = searchParams.get('startUrl');
  
  // Determinar el locale a usar - siempre español por defecto
  let locale = localeCookie || localeParam || 'es';
  
  // Validar locale
  if (!['es', 'pt', 'en'].includes(locale)) {
    locale = 'es';
  }
  
  // Determinar start_url
  const startUrl = startUrlParam || `/${locale}/`;
  
  const manifest = {
    name: "EPIC-Q Management System",
    short_name: "EPIC-Q",
    description: "Sistema de gestión para el Estudio Perioperatorio Integral de Cuidados Quirúrgicos",
    start_url: startUrl,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo-official.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
      },
      {
        src: "/icons/android-chrome-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icons/android-chrome-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ],
    categories: ["medical", "productivity", "utilities"],
    lang: locale,
    dir: "ltr",
    scope: "/",
    prefer_related_applications: false
  };
  
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

