#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Post-build script for Chrome extension
// Copies manifest and icons to dist folder

const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const iconsDir = join(rootDir, 'icons');
const distIconsDir = join(distDir, 'icons');

// Create icons directory in dist
mkdirSync(distIconsDir, { recursive: true });

// Copy manifest
copyFileSync(
  join(rootDir, 'manifest-dist.json'),
  join(distDir, 'manifest.json')
);
console.log('✓ Copied manifest.json');

// Copy icons
const iconSizes = [16, 32, 48, 128];
iconSizes.forEach(size => {
  copyFileSync(
    join(iconsDir, `icon${size}.png`),
    join(distIconsDir, `icon${size}.png`)
  );
});

// Copy logo
copyFileSync(
  join(iconsDir, 'logo-tarcza.png'),
  join(distIconsDir, 'logo-tarcza.png')
);
console.log('✓ Copied icons');

console.log('✓ Build complete! Load the dist/ directory in Chrome to test the extension.');
