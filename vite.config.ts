import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))

/** Static hosts that 404 missing paths (GitHub Pages, S3 error documents) can serve 404.html as the SPA. */
function spaFallbackHtml(): Plugin {
  return {
    name: 'spa-fallback-html',
    closeBundle: {
      sequential: true,
      order: 'post',
      handler() {
        const index = path.join(root, 'dist/index.html')
        if (existsSync(index)) {
          copyFileSync(index, path.join(root, 'dist/404.html'))
        }
      },
    },
  }
}

export default defineConfig({
  appType: 'spa',
  plugins: [react(), tailwindcss(), spaFallbackHtml()],
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
  base: '/admin/',
  server: {
    port: 5176,
    strictPort: false,
  },
  preview: {
    port: 4176,
    strictPort: false,
  },
})
