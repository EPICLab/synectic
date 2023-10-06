import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main'
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ['find-up'] })],
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        output: {
          manualChunks(id) {
            return id.includes('find-up') ? 'find-up' : undefined;
          }
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      outDir: 'out/renderer'
    },
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version)
    }
  }
});
