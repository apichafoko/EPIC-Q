const fs = require('fs');
const path = require('path');

// Leer el logo oficial desde el archivo
const logoPath = path.join(__dirname, '..', 'public', 'logo-official.svg');
const logoSvg = fs.readFileSync(logoPath, 'utf8');

// Tamaños de iconos PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72' },
  { size: 96, name: 'icon-96x96' },
  { size: 128, name: 'icon-128x128' },
  { size: 144, name: 'icon-144x144' },
  { size: 152, name: 'icon-152x152' },
  { size: 192, name: 'icon-192x192' },
  { size: 384, name: 'icon-384x384' },
  { size: 512, name: 'icon-512x512' }
];

// Crear directorio de iconos si no existe
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar SVG para cada tamaño
iconSizes.forEach(({ size, name }) => {
  // Crear SVG con el tamaño específico pero manteniendo el viewBox original
  const svgContent = logoSvg.replace('width="200" height="200"', `width="${size}" height="${size}"`);
  
  const filePath = path.join(iconsDir, `${name}.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Generado: ${name}.svg`);
});

// Generar icono principal
const mainIconPath = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
fs.writeFileSync(mainIconPath, logoSvg);
console.log('✅ Generado: icon.svg');

console.log('\n📝 Para convertir a PNG, puedes usar:');
console.log('   - https://convertio.co/svg-png/');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - O ImageMagick: convert icon.svg icon.png');
