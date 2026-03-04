import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf-utils';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router/')) return 'react-core';
            return 'vendor';
          }
        }
      }
    }
  }
})
