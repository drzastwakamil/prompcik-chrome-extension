import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      closeBundle() {
        // Copy manifest and styles after build
        copyFileSync(
          resolve(__dirname, 'manifest-dist.json'),
          resolve(__dirname, 'dist/manifest.json')
        );
        copyFileSync(
          resolve(__dirname, 'styles.css'),
          resolve(__dirname, 'dist/styles.css')
        );
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/main.js'),
      },
      output: {
        entryFileNames: 'content.js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          // Give content CSS a different name to avoid popup build overwriting it
          if (assetInfo.name?.endsWith('.css')) {
            return 'content-style[extname]';
          }
          return '[name][extname]';
        },
        // Use IIFE format for content script (no ES modules allowed)
        format: 'iife',
        inlineDynamicImports: true
      }
    },
    emptyOutDir: false, // Don't empty - we'll build popup separately
    cssCodeSplit: false,
    minify: false // Easier debugging for Chrome extensions
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
