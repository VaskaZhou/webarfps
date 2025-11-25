import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl()],
  base: "/webarfps/",    // 让所有路径自动带上这个前缀
  server: { https: true, host: true }
})
