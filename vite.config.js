import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  
  const basePath = mode === 'development'
    ? '/absproxy/5173'
    : '/';

  return {
    plugins: [react()],
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
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    } : undefined,
  }
})
