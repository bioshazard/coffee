import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // When running in GitHub Actions we want the base path to match the
  // repository name so that GitHub Pages works correctly. This grabs the repo
  // from GITHUB_REPOSITORY (`owner/repo`) and uses `/repo/` as the base. For
  // local development we keep the existing `/absproxy/5173` path.
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  const basePath =
    mode === 'development'
      ? '/absproxy/5173'
      : process.env.GITHUB_ACTIONS && repo
        ? `/${repo}/`
        : '/'

  return {
    plugins: [react()],
    // a bunch of stuff to get code server working
    base: "/",
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
