import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Must come before react(). Generates src/routeTree.gen.ts from src/routes.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    // Forward /api requests to the ASP.NET Core backend during development.
    proxy: {
      '/api': 'http://localhost:5171',
    },
  },
  build: {
    // Put the production build into the backend's wwwroot so .NET can serve it.
    outDir: '../server/wwwroot',
    emptyOutDir: true,
  },
})
