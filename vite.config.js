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
          // share_target: {
          //   action: '/share-target',
          //   method: 'GET',
          //   enctype: "multipart/form-data",
          //   params: {
          //     title: 'title',
          //     text: 'text',
          //     url: 'url'
          //   }
          // },
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/vite.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: '/vite.svg',
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
