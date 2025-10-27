import fs from 'fs';
import path from 'path';

export function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo-email.svg');
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString('base64');
    return `data:image/svg+xml;base64,${base64Logo}`;
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
}

export function getEmailLogoUrl(): string {
  // Prefer explicit server env var; fall back to public env var; then to hosted app/public asset
  const serverUrl = process.env.EMAIL_LOGO_URL?.trim();
  const publicUrl = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL?.trim();
  if (serverUrl) return serverUrl;
  if (publicUrl) return publicUrl;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  // Use absolute URL if app URL is known; else fall back to relative public path
  return appUrl ? `${appUrl}/logo-email.svg` : '/logo-email.svg';
}
