import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(process.env.ANALYZE ? [visualizer({
      open: true,
      filename: 'dist/bundle-analysis.html',
      gzipSize: true
    })] : [])
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      external: [
        'multiformats',
        'multiformats/basics',
        'multiformats/cid',
        'multiformats/hashes/sha2',
        'multiformats/hashes/sha3',
        'iso-datestring-validator',
        'uint8arrays'
      ],
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'scheduler', 'react-dom/client'],
          'vendor-atproto': ['@atproto/api', '@atproto/crypto']
        }
      }
    }
  },
  server: {
    port: 3000,
  },
  publicDir: 'public'
})
