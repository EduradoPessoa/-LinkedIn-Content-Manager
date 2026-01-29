import { Router } from 'express'
import { asyncHandler } from '../../shared/http/async-handler.js'
import { requireAuth, type AuthenticatedRequest } from '../../shared/http/auth.js'
import { AppError } from '../../shared/errors.js'
import { env } from '../../shared/env.js'
import { decryptString } from '../../shared/crypto.js'
import { getLinkedInAccountForUser } from '../auth/user.repo.js'
import { LinkedInApi } from './linkedin.api.js'

export const linkedInRouter = Router()

const linkedInApi = new LinkedInApi()

linkedInRouter.get(
  '/organizations',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!env.LINKEDIN_ORG_POSTING_ENABLED) {
      throw new AppError({ status: 404, code: 'FEATURE_DISABLED', message: 'Organization posting disabled' })
    }
    const userId = (req as AuthenticatedRequest).auth.userId
    const account = await getLinkedInAccountForUser({ userId, accountId: null })
    if (!account) {
      throw new AppError({ status: 400, code: 'LINKEDIN_ACCOUNT_NOT_CONNECTED', message: 'No LinkedIn account connected' })
    }
    const accessToken = decryptString(account.access_token_encrypted)
    const organizations = await linkedInApi.listAdminOrganizations(accessToken)
    res.json({ ok: true, organizations })
  }),
)
