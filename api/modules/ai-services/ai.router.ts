import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { requireAuth } from '../../shared/http/auth.js'
import { env } from '../../shared/env.js'
import { AppError } from '../../shared/errors.js'

export const aiRouter = Router()

aiRouter.post(
  '/generate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        prompt: z.string().min(1).max(4000),
        provider: z.enum(['openai', 'anthropic', 'gemini', 'groq']).optional().default('openai'),
      })
      .parse(req.body)

    if (body.provider === 'openai' && !env.OPENAI_API_KEY) {
      throw new AppError({ status: 400, code: 'OPENAI_NOT_CONFIGURED', message: 'OPENAI_API_KEY not configured' })
    }
    if (body.provider === 'anthropic' && !env.ANTHROPIC_API_KEY) {
      throw new AppError({
        status: 400,
        code: 'ANTHROPIC_NOT_CONFIGURED',
        message: 'ANTHROPIC_API_KEY not configured',
      })
    }
    if (body.provider === 'gemini' && !env.GOOGLE_API_KEY) {
      throw new AppError({ status: 400, code: 'GEMINI_NOT_CONFIGURED', message: 'GOOGLE_API_KEY not configured' })
    }
    if (body.provider === 'groq' && !env.GROQ_API_KEY) {
      throw new AppError({ status: 400, code: 'GROQ_NOT_CONFIGURED', message: 'GROQ_API_KEY not configured' })
    }

    res.json({
      ok: true,
      output:
        'Stub de IA. Configure as chaves e implemente a chamada real ao provedor no módulo ai-services.',
    })
  }),
)

aiRouter.post(
  '/improve',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ content: z.string().min(1).max(3000) }).parse(req.body)
    res.json({ ok: true, output: body.content })
  }),
)
