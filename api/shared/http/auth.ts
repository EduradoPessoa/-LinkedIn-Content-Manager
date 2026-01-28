import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors.js'
import { verifyAccessToken } from '../../modules/auth/jwt.js'

export type AuthenticatedRequest = Request & {
  auth: {
    userId: string
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
  if (!token) {
    next(new AppError({ status: 401, code: 'AUTH_REQUIRED', message: 'Missing bearer token' }))
    return
  }

  const payload = verifyAccessToken(token)
  ;(req as AuthenticatedRequest).auth = { userId: payload.sub }
  next()
}

