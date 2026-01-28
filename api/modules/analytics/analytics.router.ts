import { Router } from 'express'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { requireAuth } from '../../shared/http/auth.js'

export const analyticsRouter = Router()

analyticsRouter.get(
  '/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ ok: true, overview: { posts: 0, scheduled: 0, published: 0 } })
  }),
)

analyticsRouter.get(
  '/posts',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ ok: true, posts: [] })
  }),
)

