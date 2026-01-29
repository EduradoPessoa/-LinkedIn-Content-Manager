import { Router, type Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { AppError } from '../../shared/errors.js'
import { env } from '../../shared/env.js'
import { LinkedInApi } from '../linkedin-integration/linkedin.api.js'
import { encryptString } from '../../shared/crypto.js'
import { createUser, getUserByLinkedInMemberId, upsertLinkedInAccount } from './user.repo.js'
import { insertRefreshToken, getRefreshTokenById, revokeRefreshTokenById, listAccountsForUser } from './refresh-token.repo.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth, type AuthenticatedRequest } from '../../shared/http/auth.js'

export const authRouter = Router()

const linkedInApi = new LinkedInApi()

function setCookie(res: Response, name: string, value: string, maxAgeMs: number): void {
  res.cookie(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: maxAgeMs,
    path: '/'
  })
}

authRouter.get(
  '/linkedin',
  asyncHandler(async (req, res) => {
    const state = uuidv4()
    setCookie(res, 'li_oauth_state', state, 10 * 60 * 1000)
    const url = linkedInApi.buildAuthUrl({ state })
    res.json({ ok: true, url })
  }),
)

authRouter.post(
  '/linkedin',
  asyncHandler(async (req, res) => {
    const state = uuidv4()
    setCookie(res, 'li_oauth_state', state, 10 * 60 * 1000)
    const url = linkedInApi.buildAuthUrl({ state })
    res.json({ ok: true, url })
  }),
)

authRouter.get(
  '/linkedin/callback',
  asyncHandler(async (req, res) => {
    const oauthError = typeof req.query.error === 'string' ? req.query.error : null
    if (oauthError) {
      const errorDescription = typeof req.query.error_description === 'string' ? req.query.error_description : null
      const redirectUrl = new URL(env.FRONTEND_URL)
      redirectUrl.pathname = '/auth/callback'
      redirectUrl.searchParams.set('error', oauthError)
      if (errorDescription) redirectUrl.searchParams.set('error_description', errorDescription)
      res.redirect(302, redirectUrl.toString())
      return
    }

    const code = z.string().min(1).parse(req.query.code)
    const state = z.string().min(1).parse(req.query.state)

    const cookieState = req.cookies?.li_oauth_state
    if (!cookieState || cookieState !== state) {
      throw new AppError({ status: 400, code: 'OAUTH_STATE_MISMATCH', message: 'Invalid OAuth state' })
    }

    const token = await linkedInApi.exchangeCodeForAccessToken(code)

    const scopes = (env.LINKEDIN_SCOPES || '').split(/\s+/).map((s) => s.trim()).filter(Boolean)
    const isOidc = scopes.includes('openid') || scopes.includes('profile') || scopes.includes('email')

    let memberId: string
    let name: string | null
    let email: string | null

    if (isOidc) {
      const userInfo = await linkedInApi.getUserInfo(token.accessToken)
      const fullName = (userInfo.name || [userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ')).trim()
      memberId = userInfo.sub
      name = fullName.length > 0 ? fullName : null
      email = userInfo.email ?? null
    } else {
      const profile = await linkedInApi.getProfile(token.accessToken)
      email = await linkedInApi.getEmail(token.accessToken)
      memberId = profile.id
      const first = Object.values(profile.firstName?.localized ?? {})[0]
      const last = Object.values(profile.lastName?.localized ?? {})[0]
      const full = [first, last].filter(Boolean).join(' ').trim()
      name = full.length > 0 ? full : null
    }

    let user = await getUserByLinkedInMemberId(memberId)
    if (!user) {
      user = await createUser({ id: uuidv4(), linkedinMemberId: memberId, name, email })
    }

    await upsertLinkedInAccount({
      id: uuidv4(),
      userId: user.id,
      providerAccountId: memberId,
      accessTokenEncrypted: encryptString(token.accessToken),
      expiresAt: token.expiresAt,
    })

    const refreshTokenId = uuidv4()
    const refreshToken = signRefreshToken({ userId: user.id, tokenId: refreshTokenId })
    await insertRefreshToken({
      id: refreshTokenId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    setCookie(res, 'refresh_token', refreshToken, 30 * 24 * 60 * 60 * 1000)

    const accessToken = signAccessToken({ userId: user.id })
    const redirectUrl = new URL(env.FRONTEND_URL)
    redirectUrl.pathname = '/auth/callback'
    redirectUrl.searchParams.set('access_token', accessToken)
    res.redirect(302, redirectUrl.toString())
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refresh_token
    if (!token) {
      throw new AppError({ status: 401, code: 'MISSING_REFRESH_TOKEN', message: 'Missing refresh token' })
    }

    const payload = verifyRefreshToken(token)
    const row = await getRefreshTokenById(payload.jti)
    if (!row || row.user_id !== payload.sub) {
      throw new AppError({ status: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' })
    }
    if (row.revoked_at) {
      throw new AppError({ status: 401, code: 'REFRESH_TOKEN_REVOKED', message: 'Refresh token revoked' })
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new AppError({ status: 401, code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token expired' })
    }

    const accessToken = signAccessToken({ userId: payload.sub })
    res.json({ ok: true, accessToken })
  }),
)

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refresh_token
    if (token) {
      const payload = verifyRefreshToken(token)
      await revokeRefreshTokenById(payload.jti)
    }
    res.clearCookie('refresh_token', { path: '/' })
    res.json({ ok: true })
  }),
)

authRouter.get(
  '/accounts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).auth.userId
    const accounts = await listAccountsForUser(userId)
    res.json({ ok: true, accounts })
  }),
)
