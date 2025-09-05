import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    federation({
      name: 'topUsers',
      remotes: {
        mainFront: {
          type: 'module',
          name: 'mainFront',
          entry: 'http://localhost:3000/assets/remoteEntry.js',
          entryGlobalName: 'mainFront',
          shareScope: 'default',
        },
      },
      exposes: {
        './App': './src/App.tsx',
      },
      filename: 'assets/remoteEntry.js',
      shared: ['react', 'react-dom', 'zustand'],
    }),
    react(),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  optimizeDeps: {
    exclude: ['main/UserStore'],
  },
  server: {
    port: 3001,
    open: true,
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
});
