import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  base: '/CovidCharts/',
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    // TensorFlow + Highcharts make the bundle large; suppress until Phase 4 removes them
    chunkSizeWarningLimit: 2500,
  },
});
