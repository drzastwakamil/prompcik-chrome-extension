#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, '..', 'dist');

// Fix popup.html paths to be relative
const popupHtmlPath = join(distPath, 'popup.html');
let popupHtml = readFileSync(popupHtmlPath, 'utf-8');

// Replace absolute paths with relative paths
popupHtml = popupHtml.replace(/src="\/([^"]+)"/g, 'src="./$1"');
popupHtml = popupHtml.replace(/href="\/([^"]+)"/g, 'href="./$1"');

writeFileSync(popupHtmlPath, popupHtml);

console.log('✓ Fixed popup.html paths for Chrome extension compatibility');
console.log('✓ Build complete! Load the dist/ directory in Chrome to test the extension.');
