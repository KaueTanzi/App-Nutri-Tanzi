import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleGerarPlano } from './api/gerar-plano.ts'

function serverlessApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'serverless-api-plugin',
    configureServer(server) {
      // Garante que GEMINI_API_KEY esteja disponível no ambiente Node do backend dev
      if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
      }

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/api/gerar-plano') {
          handleGerarPlano(req, res)
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
  }

  return {
    plugins: [react(), tailwindcss(), serverlessApiPlugin(env)],
  }
})
