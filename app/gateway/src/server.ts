import 'express-async-errors'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const PORT = process.env.PORT || 6000

async function start() {
  const app = express()

  app.get('/health', (req, res) => res.send('OK'))

  app.use(
    '/identity',
    createProxyMiddleware({
      target: process.env.IDENTITY_URL || 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/identity': '',
      },
    }),
  )

  app.listen(PORT, () => {
    console.log(`🔥 Servidor Identity-Gateway iniciado na porta ${PORT}`)
  })
}

start().catch((err) => {
  console.error('Erro ao iniciar Gateway:', err)
  process.exit(1)
})
