import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@condukt/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@condukt/react': path.resolve(__dirname, '../react/src/index.ts'),
    },
  },
  server: {
    port: 3000,
  },
});