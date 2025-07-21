import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: '/TimeDo-/',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/sw.js', // dari folder public
          dest: '.'            // copy ke root dist/
        }
      ]
    })
  ]
})
