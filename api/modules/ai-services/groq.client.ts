import { env } from '../../shared/env.js'
import { AppError } from '../../shared/errors.js'

type GroqChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

export async function groqGenerateText(params: {
  prompt: string
  model?: string
}): Promise<string> {
  if (!env.GROQ_API_KEY) {
    throw new AppError({ status: 400, code: 'GROQ_NOT_CONFIGURED', message: 'GROQ_API_KEY not configured' })
  }

  const model = params.model ?? 'llama-3.3-70b-versatile'

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [{ role: 'user', content: params.prompt }],
    }),
  })

  const text = await resp.text().catch(() => '')
  if (!resp.ok) {
    throw new AppError({ status: resp.status, code: 'GROQ_REQUEST_FAILED', message: 'Groq request failed', details: text })
  }

  const parsed = (text ? (JSON.parse(text) as GroqChatCompletionResponse) : null) as GroqChatCompletionResponse | null
  const out = parsed?.choices?.[0]?.message?.content
  if (!out || typeof out !== 'string') {
    throw new AppError({ status: 500, code: 'GROQ_INVALID_RESPONSE', message: 'Groq response missing content' })
  }
  return out.trim()
}

