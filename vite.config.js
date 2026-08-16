import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // Ganti <NAMA-REPO-GITHUB> dengan nama repository Anda
  base: process.env.NODE_ENV === 'production' ? '/<NAMA-REPO-GITHUB>/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});