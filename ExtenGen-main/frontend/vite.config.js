import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Exposes on real LAN IP (e.g. http://10.94.17.216:5173)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (err.code === 'ECONNREFUSED') {
              if (res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Backend server offline (port 3000)' }));
              }
            }
          });
        },
      },
      '/health': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (err.code === 'ECONNREFUSED') {
              if (res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'offline' }));
              }
            }
          });
        },
      },
      '/openapi.json': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/sse': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/messages': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
