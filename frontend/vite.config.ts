import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 개발 서버 포트/백엔드 프록시 대상은 환경변수(.env)에서 읽는다 (소스 하드코딩 금지)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:8081'
  const port = Number(env.VITE_DEV_PORT) || 5174

  return {
    plugins: [react()],
    server: {
      port,
      proxy: {
        // 프론트는 /api 상대경로로 호출 → 개발 시 백엔드로 프록시
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
    optimizeDeps: {
      include: ['@mui/material', '@mui/icons-material'],
    },
  }
})
