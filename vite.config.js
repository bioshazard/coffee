import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  
  const basePath = mode === 'development'
    ? '/absproxy/5173'
    : '/';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          start_url: basePath,
          name: 'Coffee',
          short_name: 'Coffee',
          description: 'The cleanest lean coffee solution',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ctext%20y%3D%27.9em%27%20font-size%3D%2790%27%3E%E2%98%95%3C%2Ftext%3E%3C%2Fsvg%3E',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Ctext%20y%3D%27.9em%27%20font-size%3D%2790%27%3E%E2%98%95%3C%2Ftext%3E%3C%2Fsvg%3E',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    // a bunch of stuff to get code server working
    base: basePath,
    server: mode === 'development' ? {
      allowedHosts: [
        "bios-kubuntu.home.arpa",
        "code.lab1.bios.dev",
      ],
      proxy: {
        '/api': {
          target: 'http://172.18.0.1:54321',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          
        }
      }
    } : undefined,
  }
})
