import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//import commonjs from '@rollup/plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    staticPort: true,
    port: 8000
  },
  assetsInclude: ['**/*.docx']
})
