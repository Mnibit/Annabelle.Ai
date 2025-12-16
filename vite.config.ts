import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'worker-indexer': ['./src/workers/indexer.worker.ts'],
          'worker-retriever': ['./src/workers/retriever.worker.ts'],
        },
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/workers/*.worker.ts',
          dest: 'workers',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
