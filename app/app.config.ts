import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: false,
  vite: {
    resolve: {
      conditions: ['browser', 'module', 'import', 'default'],
      mainFields: ['browser', 'module', 'main']
    },
    optimizeDeps: {
      exclude: ['@lancedb/lancedb'],
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },
    build: {
      target: 'esnext'
    }
  }
});
