import { NextRequest, NextResponse } from 'next/server';

const locales = ['es', 'pt', 'en'];
const defaultLocale = 'es';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log detallado para debugging
  console.log('🔍 Middleware ejecutándose:');
  console.log('  - URL completa:', request.url);
  console.log('  - Pathname:', pathname);
  console.log('  - User Agent:', request.headers.get('user-agent'));
  console.log('  - Method:', request.method);

  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    console.log('  ✅ Saltando (API/static):', pathname);
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  console.log('  - Tiene locale?', pathnameHasLocale);
  console.log('  - Locales válidos:', locales);

  // If no locale, redirect to default locale
  if (!pathnameHasLocale) {
    const redirectUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
    console.log('  🔄 Redirigiendo a:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  }

  console.log('  ✅ Continuando sin redirección');
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next), API routes, and static files
    '/((?!_next|_static|api|.*\\.).*)'
  ]
};
