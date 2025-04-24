import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile';
import { rename } from 'fs/promises'
import { resolve } from 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile(),
    {
      name: 'rename-output',
      async closeBundle() {
        // Rename index.html to x.html after build
        await rename(
          resolve('dist', 'index.html'),
          resolve('dist', 'PM_v3.html')
        )
      }
    }
  ]
  
})
