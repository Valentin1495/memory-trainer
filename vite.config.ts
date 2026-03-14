import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // 외부 접속 허용
    port: 5173,
    hmr: {
      host: '192.168.123.107', // 본인의 로컬 IP
      port: 5173,
    },
  },
})
