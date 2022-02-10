import * as path from 'path'
import { defineConfig } from 'vite'
import autoExternal from 'rollup-plugin-auto-external'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      fileName: 'main',
      entry: path.resolve(__dirname, './main.js'),
      formats: ['cjs']
    },
    rollupOptions: {
      plugins: [
        autoExternal({ packagePath: path.resolve(__dirname, '../../package.json') })
      ]
    }
  }
})
