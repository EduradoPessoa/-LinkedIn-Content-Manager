import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { env } from '../../shared/env.js'
import { AppError } from '../../shared/errors.js'
import { processDueScheduledPosts } from './scheduler.service.js'

export const schedulerRouter = Router()

schedulerRouter.all(
  '/tick',
  asyncHandler(async (req, res) => {
    if (env.NODE_ENV === 'production') {
      const vercelCron = req.header('x-vercel-cron')
      const headerSecret = req.header('x-scheduler-secret')
      const bearer = req.header('authorization')
      const bearerSecret = bearer?.startsWith('Bearer ') ? bearer.slice('Bearer '.length) : null
      const querySecret = typeof req.query.secret === 'string' ? req.query.secret : null
      const secret = headerSecret ?? bearerSecret ?? querySecret

      if (env.SCHEDULER_SECRET) {
        if (!secret || secret !== env.SCHEDULER_SECRET) {
          throw new AppError({ status: 401, code: 'SCHEDULER_UNAUTHORIZED', message: 'Unauthorized' })
        }
      } else {
        if (vercelCron !== '1') {
          throw new AppError({ status: 401, code: 'SCHEDULER_UNAUTHORIZED', message: 'Unauthorized' })
        }
      }
    }

    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined
    const body = z
      .object({ limit: z.number().int().min(1).max(20).optional() })
      .parse(req.method === 'POST' || req.method === 'PUT' ? (req.body ?? {}) : { limit: limitRaw })

    const result = await processDueScheduledPosts({ limit: body.limit })
    res.json({ ok: true, ...result })
  }),
)
