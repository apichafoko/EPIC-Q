import { NextRequest, NextResponse } from 'next/server';

const locales = ['es', 'pt', 'en'];
const defaultLocale = 'es';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Extract locale from pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next), API routes, and static files
    '/((?!_next|_static|api|.*\\..*).*)'
  ]
};
