import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: 'auto',
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        clientsClaim: true,
        skipWaiting: true,
        // Increase the file size limit to 4MB (or larger if needed)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: "NeighbourLink",
        short_name: "NeighbourLink",
        description: "Your hyperlocal community resource hub.",
        theme_color: "#ffffff",
        icons: [
          {
            "src": "icons/Neighbour-48x48.png",
            "sizes": "48x48",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-72x72.png",
            "sizes": "72x72",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-96x96.png",
            "sizes": "96x96",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-128x128.png",
            "sizes": "128x128",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-144x144.png",
            "sizes": "144x144",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-152x152.png",
            "sizes": "152x152",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-256x256.png",
            "sizes": "256x256",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-384x384.png",
            "sizes": "384x384",
            "type": "image/png"
          },
          {
            "src": "icons/Neighbour-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ],
        
      },
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'firebase-messaging-sw': 'public/firebase-messaging-sw.js',
      },
    },
    // Optionally, increase the chunk size warning limit to avoid unnecessary warnings
    chunkSizeWarningLimit: 3000,
  },
  server:{
    host: process.env.VITE_IP,
    port:5174
    // host: '192.168.0.193'
  }
})
