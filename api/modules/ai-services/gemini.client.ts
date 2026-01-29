import { env } from '../../shared/env.js'
import { AppError } from '../../shared/errors.js'

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }>; role?: string }
  }>
}

export async function geminiGenerateText(params: {
  prompt: string
  model?: string
}): Promise<string> {
  if (!env.GOOGLE_API_KEY) {
    throw new AppError({ status: 400, code: 'GEMINI_NOT_CONFIGURED', message: 'GOOGLE_API_KEY not configured' })
  }

  const model = params.model ?? 'gemini-2.0-flash'

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': env.GOOGLE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: params.prompt }], role: 'user' }] }),
    },
  )

  const text = await resp.text().catch(() => '')
  if (!resp.ok) {
    throw new AppError({ status: resp.status, code: 'GEMINI_REQUEST_FAILED', message: 'Gemini request failed', details: text })
  }

  const parsed = (text ? (JSON.parse(text) as GeminiGenerateContentResponse) : null) as GeminiGenerateContentResponse | null
  const out = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!out || typeof out !== 'string') {
    throw new AppError({ status: 500, code: 'GEMINI_INVALID_RESPONSE', message: 'Gemini response missing text' })
  }
  return out.trim()
}

type GeminiImageGenResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inline_data?: { mime_type?: string; data?: string }
        inlineData?: { mimeType?: string; data?: string }
        text?: string
      }>
    }
  }>
  promptFeedback?: unknown
}

export async function geminiGenerateImageDataUrl(params: {
  prompt: string
  model?: string
}): Promise<string> {
  if (!env.GOOGLE_API_KEY) {
    throw new AppError({ status: 400, code: 'GEMINI_NOT_CONFIGURED', message: 'GOOGLE_API_KEY not configured' })
  }

  const model = params.model ?? 'gemini-2.5-flash-image'

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'x-goog-api-key': env.GOOGLE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: params.prompt }] }] }),
    },
  )

  const text = await resp.text().catch(() => '')
  if (!resp.ok) {
    throw new AppError({ status: resp.status, code: 'GEMINI_IMAGE_FAILED', message: 'Gemini image generation failed', details: text })
  }

  const parsed = (text ? (JSON.parse(text) as GeminiImageGenResponse) : null) as GeminiImageGenResponse | null

  for (const candidate of parsed?.candidates ?? []) {
    for (const part of candidate?.content?.parts ?? []) {
      const b64 = part?.inline_data?.data ?? part?.inlineData?.data
      if (b64 && typeof b64 === 'string') {
        const mime = part?.inline_data?.mime_type ?? part?.inlineData?.mimeType ?? 'image/png'
        return `data:${mime};base64,${b64}`
      }
    }
  }

  throw new AppError({
    status: 500,
    code: 'GEMINI_IMAGE_INVALID',
    message: 'Gemini image response missing data',
    details: { hasCandidates: Boolean(parsed?.candidates?.length), promptFeedback: parsed?.promptFeedback ?? null },
  })
}
