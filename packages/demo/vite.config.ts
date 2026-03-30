import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: '/prismui/',
  resolve: {
    alias: {
      '@prismui/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@prismui/react': path.resolve(__dirname, '../react/src/index.ts'),
    },
  },
  server: {
    port: 3000,
  },
});