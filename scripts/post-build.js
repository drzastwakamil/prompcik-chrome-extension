#!/usr/bin/env node
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Post-build script for Chrome extension
// Currently just logs success message - can be extended for future build tasks

console.log('✓ Build complete! Load the dist/ directory in Chrome to test the extension.');
