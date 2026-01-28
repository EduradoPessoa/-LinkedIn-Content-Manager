import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { requireAuth, type AuthenticatedRequest } from '../../shared/http/auth.js'
import { AppError } from '../../shared/errors.js'
import { getPostById, listScheduledPostsByUser, updatePost } from '../content-management/posts.repo.js'

export const scheduleRouter = Router()

scheduleRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const schedules = await listScheduledPostsByUser(userId)
    res.json({ ok: true, schedules })
  }),
)

scheduleRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const body = z
      .object({
        postId: z.string().uuid(),
        scheduledAt: z.string().datetime(),
      })
      .parse(req.body)

    const post = await getPostById({ id: body.postId, userId })
    if (!post) {
      throw new AppError({ status: 404, code: 'POST_NOT_FOUND', message: 'Post not found' })
    }

    const updated = await updatePost({
      id: body.postId,
      userId,
      status: 'scheduled',
      scheduledAt: new Date(body.scheduledAt),
    })

    res.json({ ok: true, post: updated })
  }),
)

scheduleRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const postId = z.string().uuid().parse(req.params.id)

    const post = await getPostById({ id: postId, userId })
    if (!post) {
      throw new AppError({ status: 404, code: 'POST_NOT_FOUND', message: 'Post not found' })
    }

    const updated = await updatePost({
      id: postId,
      userId,
      status: 'draft',
      scheduledAt: null,
    })

    res.json({ ok: true, post: updated })
  }),
)

