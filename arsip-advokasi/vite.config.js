import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ganti 'ArsipAdvo' dengan nama repository GitHub Anda yang sebenarnya
  base: '/ArsipAdvo/',
});
