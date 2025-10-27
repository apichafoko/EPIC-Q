const fs = require('fs');
const path = require('path');

// Leer el logo oficial desde el archivo
const logoPath = path.join(__dirname, '..', 'public', 'logo-official.svg');
const logoSvg = fs.readFileSync(logoPath, 'utf8');

// Tamaños para favicon y otros iconos del sitio
const faviconSizes = [
  { size: 16, name: 'favicon-16x16' },
  { size: 32, name: 'favicon-32x32' },
  { size: 48, name: 'favicon-48x48' },
  { size: 64, name: 'favicon-64x64' },
  { size: 96, name: 'favicon-96x96' },
  { size: 128, name: 'favicon-128x128' },
  { size: 180, name: 'apple-touch-icon' },
  { size: 192, name: 'android-chrome-192x192' },
  { size: 512, name: 'android-chrome-512x512' }
];

// Crear directorio de iconos si no existe
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar SVG para cada tamaño
faviconSizes.forEach(({ size, name }) => {
  // Crear SVG con el tamaño específico pero manteniendo el viewBox original
  const svgContent = logoSvg.replace('width="200" height="200"', `width="${size}" height="${size}"`);
  
  const filePath = path.join(iconsDir, `${name}.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Generado: ${name}.svg`);
});

// Generar favicon principal
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');
fs.writeFileSync(faviconPath, logoSvg);
console.log('✅ Generado: favicon.svg');

// Generar logo principal
const logoPath2 = path.join(__dirname, '..', 'public', 'logo.svg');
fs.writeFileSync(logoPath2, logoSvg);
console.log('✅ Generado: logo.svg');

console.log('\n📝 Para convertir a PNG/ICO, puedes usar:');
console.log('   - https://convertio.co/svg-png/');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - O ImageMagick: convert favicon.svg favicon.ico');