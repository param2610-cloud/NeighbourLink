import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    VitePWA({
      registerType: "autoUpdate",
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
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server:{
    // host:'192.168.1.105' // Parthib
  //  host:'192.168.0.193' // Parambrata
//    host:'192.168._._' // Shramana
//    host:'192.168._._' // Hiro Alom
    host: process.env.VITE_IP
    
  }
},)
