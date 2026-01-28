import { Router } from 'express'

export const healthRouter = Router()

healthRouter.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

