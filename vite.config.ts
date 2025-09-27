import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@use "${resolve(__dirname, 'src/renderer/styles/colors.scss')}" as *; @use "${resolve(__dirname, 'src/renderer/styles/utils.scss')}" as *; @use "${resolve(__dirname, 'src/renderer/styles/typography.scss')}" as *;`,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@/styles': resolve(__dirname, 'src/renderer/styles'),
      '@/components': resolve(__dirname, 'src/renderer/components'),
    },
  },
});