import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base is '/' because Cloudflare Pages serves the app at the site root.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
