import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { requireAuth, type AuthenticatedRequest } from '../../shared/http/auth.js'
import { env } from '../../shared/env.js'
import { AppError } from '../../shared/errors.js'
import { geminiGenerateImageDataUrl, geminiGenerateText } from './gemini.client.js'
import { groqGenerateText } from './groq.client.js'
import { getUserAiSettings, updateUserAiSettings } from '../auth/user.repo.js'

export const aiRouter = Router()

aiRouter.get(
  '/settings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const settings = await getUserAiSettings(userId)
    res.json({
      ok: true,
      settings: settings ?? { ai_default_post_context: null, ai_default_image_context: null },
    })
  }),
)

aiRouter.put(
  '/settings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const body = z
      .object({
        aiDefaultPostContext: z.string().max(20_000).nullable().optional().default(null),
        aiDefaultImageContext: z.string().max(20_000).nullable().optional().default(null),
      })
      .parse(req.body)

    const updated = await updateUserAiSettings({
      userId,
      aiDefaultPostContext: body.aiDefaultPostContext,
      aiDefaultImageContext: body.aiDefaultImageContext,
    })
    res.json({ ok: true, settings: updated ?? { ai_default_post_context: null, ai_default_image_context: null } })
  }),
)

aiRouter.post(
  '/generate-post',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        context: z.string().min(1).max(20_000),
        currentDraft: z.string().max(3000).optional().default(''),
        provider: z.enum(['groq', 'gemini']).optional().default('gemini'),
      })
      .parse(req.body)

    if (body.provider === 'gemini' && !env.GOOGLE_API_KEY) {
      throw new AppError({ status: 400, code: 'GEMINI_NOT_CONFIGURED', message: 'GOOGLE_API_KEY not configured' })
    }
    if (body.provider === 'groq' && !env.GROQ_API_KEY) {
      throw new AppError({ status: 400, code: 'GROQ_NOT_CONFIGURED', message: 'GROQ_API_KEY not configured' })
    }

    const prompt = [
      'Você é um redator especialista em LinkedIn (pt-BR).',
      'Gere UM post final pronto para publicar, sem markdown, sem aspas e sem título.',
      'Regras:',
      '- 600 a 1600 caracteres',
      '- Comece com um gancho forte (1-2 linhas)',
      '- Traga 3 a 6 pontos curtos com valor prático',
      '- Finalize com uma pergunta (CTA)',
      '- Não use hashtags',
      '- Use o rascunho do usuário como briefing (tema, fatos, exemplos e intenção).',
      '- Reescreva o texto por completo (não apenas revise); mantenha somente a ideia e os fatos.',
      '',
      'Contexto fornecido pelo usuário (o que e como ele quer o post):',
      body.context,
      '',
      body.currentDraft ? 'Rascunho do usuário (use como briefing e gere um novo post completo):\n' + body.currentDraft : '',
    ]
      .filter(Boolean)
      .join('\n')

    const output = await (body.provider === 'gemini' ? geminiGenerateText({ prompt }) : groqGenerateText({ prompt }))
    res.json({ ok: true, output })
  }),
)

aiRouter.post(
  '/generate-image',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        postText: z.string().min(1).max(3000),
        context: z.string().max(20_000).optional().default(''),
      })
      .parse(req.body)

    const promptForPrompt = [
      'Crie um prompt de imagem (em português) para gerar uma imagem 1:1 para acompanhar um post de LinkedIn.',
      'A imagem deve ser profissional, minimalista, sem texto, sem logotipos, sem marcas d\'água, sem rostos, sem pessoas.',
      'Descreva apenas elementos visuais (cores, formas, composição, estilo).',
      'Retorne SOMENTE o prompt final.',
      '',
      'Post:',
      body.postText,
      '',
      body.context ? 'Contexto adicional do usuário:\n' + body.context : '',
    ]
      .filter(Boolean)
      .join('\n')

    const imagePrompt = await groqGenerateText({ prompt: promptForPrompt })
    const imageDataUrl = await geminiGenerateImageDataUrl({ prompt: imagePrompt })

    res.json({
      ok: true,
      imageDataUrl,
      imagePrompt,
    })
  }),
)

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

    if (body.provider === 'openai' || body.provider === 'anthropic') {
      throw new AppError({ status: 400, code: 'AI_PROVIDER_NOT_IMPLEMENTED', message: 'Use gemini or groq' })
    }
    if (body.provider === 'gemini') {
      const output = await geminiGenerateText({ prompt: body.prompt })
      res.json({ ok: true, output })
      return
    }
    if (body.provider === 'groq') {
      const output = await groqGenerateText({ prompt: body.prompt })
      res.json({ ok: true, output })
      return
    }

    throw new AppError({ status: 400, code: 'AI_PROVIDER_NOT_IMPLEMENTED', message: 'Use gemini or groq' })
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
