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
