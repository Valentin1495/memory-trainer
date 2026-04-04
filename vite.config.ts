import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const liveReloadUrl = env.CAP_SERVER_URL?.trim()
  const liveReloadHost = liveReloadUrl ? new URL(liveReloadUrl).hostname : undefined
  const liveReloadPort = liveReloadUrl ? Number(new URL(liveReloadUrl).port || 5173) : 5173

  return {
    base: './',
    plugins: [react(), tailwindcss()],
    server: {
      host: true, // 외부 접속 허용
      port: 5173,
      ...(liveReloadHost
        ? {
            hmr: {
              host: liveReloadHost,
              port: liveReloadPort,
            },
          }
        : {}),
    },
  }
})
