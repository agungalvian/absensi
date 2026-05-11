import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Absensi Karyawan',
        short_name: 'Absensi',
        description: 'Sistem Absensi Karyawan Geofencing',
        theme_color: '#E87F24',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: ['absensi.alvian.web.id'],
    hmr: {
      clientPort: 443,
      host: 'absensi.alvian.web.id'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3201',
        changeOrigin: true
      }
    }
  }
})
