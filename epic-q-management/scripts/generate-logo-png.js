const fs = require('fs');
const path = require('path');

// Leer el logo oficial desde el archivo
const logoPath = path.join(__dirname, '..', 'public', 'logo-official.svg');
const logoSvg = fs.readFileSync(logoPath, 'utf8');

// Guardar el SVG para emails
const svgPath = path.join(__dirname, '..', 'public', 'logo-email.svg');
fs.writeFileSync(svgPath, logoSvg);

console.log('✅ Logo SVG creado en:', svgPath);
console.log('📝 Para convertir a PNG, puedes usar herramientas online como:');
console.log('   - https://convertio.co/svg-png/');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - O usar ImageMagick: convert logo-email.svg logo-email.png');
