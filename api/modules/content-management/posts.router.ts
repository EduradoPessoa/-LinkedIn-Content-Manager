import { Router } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { requireAuth, type AuthenticatedRequest } from '../../shared/http/auth.js'
import { AppError } from '../../shared/errors.js'
import { env } from '../../shared/env.js'
import { createPost, deletePost, listPostsByUser, updatePost } from './posts.repo.js'
import { publishPost } from './publish.service.js'

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
        linkedInAuthor: z
          .object({
            type: z.enum(['person', 'organization']).optional().default('person'),
            urn: z.string().optional(),
          })
          .optional()
          .default({ type: 'person' }),
        aiPostContext: z.string().max(20_000).nullable().optional().default(null),
        aiImageContext: z.string().max(20_000).nullable().optional().default(null),
        aiImagePrompt: z.string().max(20_000).nullable().optional().default(null),
        coverImageDataUrl: z
          .string()
          .max(8_000_000)
          .regex(/^data:image\/(png|jpeg);base64,/, 'Invalid cover image data URL')
          .nullable()
          .optional()
          .default(null),
      })
      .parse(req.body)

    const post = await createPost({
      id: uuidv4(),
      userId,
      accountId: body.accountId,
      content: body.content,
      status: 'draft',
      scheduledAt: null,
      linkedinAuthorType: (() => {
        if (!env.LINKEDIN_ORG_POSTING_ENABLED && body.linkedInAuthor.type === 'organization') {
          throw new AppError({ status: 400, code: 'FEATURE_DISABLED', message: 'Organization posting disabled' })
        }
        return body.linkedInAuthor.type
      })(),
      linkedinAuthorUrn:
        body.linkedInAuthor.type === 'organization'
          ? z
              .string()
              .regex(/^urn:li:organization:\d+$/)
              .parse(body.linkedInAuthor.urn)
          : null,
      coverImageDataUrl: body.coverImageDataUrl,
      aiPostContext: body.aiPostContext,
      aiImageContext: body.aiImageContext,
      aiImagePrompt: body.aiImagePrompt,
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
        aiPostContext: z.string().max(20_000).nullable().optional(),
        aiImageContext: z.string().max(20_000).nullable().optional(),
        aiImagePrompt: z.string().max(20_000).nullable().optional(),
        coverImageDataUrl: z
          .string()
          .max(8_000_000)
          .regex(/^data:image\/(png|jpeg);base64,/, 'Invalid cover image data URL')
          .nullable()
          .optional(),
      })
      .parse(req.body)

    const updated = await updatePost({
      id: postId,
      userId,
      content: body.content,
      status: body.status,
      scheduledAt: body.scheduledAt === undefined ? undefined : body.scheduledAt ? new Date(body.scheduledAt) : null,
      coverImageDataUrl: body.coverImageDataUrl,
      aiPostContext: body.aiPostContext,
      aiImageContext: body.aiImageContext,
      aiImagePrompt: body.aiImagePrompt,
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

postsRouter.post(
  '/:id/publish',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const postId = z.string().uuid().parse(req.params.id)

    const result = await publishPost({ userId, postId })
    if (result.warning) {
      res.json({ ok: true, post: result.post, warning: result.warning })
      return
    }
    res.json({ ok: true, post: result.post })
  }),
)
