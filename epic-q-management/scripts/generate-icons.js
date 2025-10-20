const fs = require('fs');
const path = require('path');

// Función para crear un SVG con el logo EPIC-Q en un tamaño específico
function createLogoIcon(size) {
  const fontSize = Math.round(size * 0.18); // 18% del tamaño total
  const qFontSize = Math.round(size * 0.21); // 21% del tamaño total
  const epicY = Math.round(size * 0.45); // 45% del tamaño total
  const qY = Math.round(size * 0.65); // 65% del tamaño total
  const borderRadius = Math.round(size * 0.1); // 10% del tamaño total

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .epic-text { fill: #ffffff; font-family: 'Arial', sans-serif; font-weight: bold; font-size: ${fontSize}px; }
      .q-text { fill: #fb923c; font-family: 'Arial', sans-serif; font-weight: bold; font-size: ${qFontSize}px; }
    </style>
  </defs>
  
  <!-- Fondo azul con bordes redondeados -->
  <rect width="${size}" height="${size}" rx="${borderRadius}" ry="${borderRadius}" fill="#1e3a8a"/>
  
  <!-- Texto EPIC -->
  <text x="${size/2}" y="${epicY}" text-anchor="middle" class="epic-text">EPIC</text>
  
  <!-- Texto Q en naranja, posicionado ligeramente más abajo -->
  <text x="${size/2}" y="${qY}" text-anchor="middle" class="q-text">Q</text>
</svg>`;
}

// Tamaños de iconos PWA estándar
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Crear directorio de iconos si no existe
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generar iconos SVG para cada tamaño
iconSizes.forEach(size => {
  const svgContent = createLogoIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Generado: ${filename}`);
});

// Crear también un favicon.ico (usando el tamaño 32x32)
const faviconSvg = createLogoIcon(32);
const faviconPath = path.join(__dirname, '..', 'public', 'favicon.svg');
fs.writeFileSync(faviconPath, faviconSvg);
console.log('✅ Generado: favicon.svg');

console.log('\n🎉 Todos los iconos han sido generados exitosamente!');
console.log('\nNota: Para usar estos iconos en producción, considera convertir los SVG a PNG usando herramientas como:');
console.log('- ImageMagick: convert icon-192x192.svg icon-192x192.png');
console.log('- Inkscape: inkscape --export-png=icon-192x192.png icon-192x192.svg');
console.log('- Online converters como CloudConvert');