import { Router } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { requireAuth, type AuthenticatedRequest } from '../../shared/http/auth.js'
import { AppError } from '../../shared/errors.js'
import { createPost, deletePost, listPostsByUser, updatePost } from './posts.repo.js'

export const postsRouter = Router()

postsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const posts = await listPostsByUser(userId)
    res.json({ ok: true, posts })
  }),
)

postsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const body = z
      .object({
        content: z.string().min(1).max(3000),
        accountId: z.string().uuid().nullable().optional().default(null),
      })
      .parse(req.body)

    const post = await createPost({
      id: uuidv4(),
      userId,
      accountId: body.accountId,
      content: body.content,
      status: 'draft',
      scheduledAt: null,
    })

    res.status(201).json({ ok: true, post })
  }),
)

postsRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const postId = z.string().uuid().parse(req.params.id)
    const body = z
      .object({
        content: z.string().min(1).max(3000).optional(),
        status: z.enum(['draft', 'scheduled', 'published']).optional(),
        scheduledAt: z.string().datetime().nullable().optional(),
      })
      .parse(req.body)

    const updated = await updatePost({
      id: postId,
      userId,
      content: body.content,
      status: body.status,
      scheduledAt: body.scheduledAt === undefined ? undefined : body.scheduledAt ? new Date(body.scheduledAt) : null,
    })

    if (!updated) {
      throw new AppError({ status: 404, code: 'POST_NOT_FOUND', message: 'Post not found' })
    }

    res.json({ ok: true, post: updated })
  }),
)

postsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const postId = z.string().uuid().parse(req.params.id)
    const deleted = await deletePost({ id: postId, userId })
    if (!deleted) {
      throw new AppError({ status: 404, code: 'POST_NOT_FOUND', message: 'Post not found' })
    }
    res.json({ ok: true })
  }),
)

