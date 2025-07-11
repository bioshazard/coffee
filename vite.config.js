import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  
  const basePath = '/';
  // = mode === 'development'
  //   ? '/absproxy/5173'
  //   : '/';

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
          name: 'Clean Coffee',
          short_name: 'Coffee',
          description: 'The cleanest lean coffee solution',
          share_target: {
            action: '/#/share-target',
            method: 'GET',
            params: {
              title: 'title',
              text: 'text',
              url: 'url'
            }
          },
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/icon-192-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512-512.png',
              sizes: '512x512',
              type: 'image/png'
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
        "5173.lab1.bios.dev",
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
