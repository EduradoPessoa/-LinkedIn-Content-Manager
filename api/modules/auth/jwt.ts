import jwt from 'jsonwebtoken'
import { env } from '../../shared/env.js'
import { AppError } from '../../shared/errors.js'

export type AccessTokenPayload = {
  sub: string
  type: 'access'
}

export type RefreshTokenPayload = {
  sub: string
  type: 'refresh'
  jti: string
}

export function signAccessToken(params: { userId: string }): string {
  const payload: AccessTokenPayload = { sub: params.userId, type: 'access' }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' })
}

export function signRefreshToken(params: { userId: string; tokenId: string }): string {
  const payload: RefreshTokenPayload = { sub: params.userId, type: 'refresh', jti: params.tokenId }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload
    if (!decoded || decoded.type !== 'access' || !decoded.sub) {
      throw new Error('Invalid token payload')
    }
    return decoded
  } catch {
    throw new AppError({ status: 401, code: 'INVALID_TOKEN', message: 'Invalid or expired token' })
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload
    if (!decoded || decoded.type !== 'refresh' || !decoded.sub || !decoded.jti) {
      throw new Error('Invalid token payload')
    }
    return decoded
  } catch {
    throw new AppError({ status: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' })
  }
}

