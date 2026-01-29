import { ZodError } from 'zod'

export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(params: { message: string; status: number; code: string; details?: unknown }) {
    super(params.message)
    this.status = params.status
    this.code = params.code
    this.details = params.details
  }
}

export function errorToHttpResponse(error: unknown): {
  status: number
  body: { ok: false; error: string; code?: string; details?: unknown }
} {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    }
  }

  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
    }
  }

  return {
    status: 500,
    body: {
      ok: false,
      error: 'Server internal error',
    },
  }
}

