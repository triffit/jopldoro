const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  '32x32.png': 32,
  '128x128.png': 128,
  '128x128@2x.png': 256,
  'icon.ico': 256,
  'icon.icns': 512,
  'StoreLogo.png': 50,
  'Square30x30Logo.png': 30,
  'Square44x44Logo.png': 44,
  'Square71x71Logo.png': 71,
  'Square89x89Logo.png': 89,
  'Square107x107Logo.png': 107,
  'Square142x142Logo.png': 142,
  'Square150x150Logo.png': 150,
  'Square284x284Logo.png': 284,
  'Square310x310Logo.png': 310
};

async function convertIcons() {
  const svgBuffer = fs.readFileSync('icon.svg');
  
  for (const [filename, size] of Object.entries(sizes)) {
    await sharp(svgBuffer)
      .resize(size, size)
      .toFile(filename);
    console.log(`Created ${filename}`);
  }
}

convertIcons().catch(console.error); 