import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];
const logoPath = path.join(__dirname, '../icons/logo-tarcza.png');
const iconsDir = path.join(__dirname, '../icons');

async function generateIcons() {
  const logoBuffer = fs.readFileSync(logoPath);
  
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon${size}.png`);
    
    await sharp(logoBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated icon${size}.png`);
  }
  
  console.log('\n✨ All icons generated successfully!');
}

generateIcons().catch(console.error);
