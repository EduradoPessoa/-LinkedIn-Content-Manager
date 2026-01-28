import { env } from '../../shared/env.js'
import { AppError } from '../../shared/errors.js'

export type LinkedInTokenResponse = {
  access_token: string
  expires_in: number
}

export type LinkedInProfile = {
  id: string
  firstName?: { localized?: Record<string, string> }
  lastName?: { localized?: Record<string, string> }
}

export class LinkedInApi {
  buildAuthUrl(params: { state: string }): string {
    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_REDIRECT_URI) {
      throw new AppError({
        status: 500,
        code: 'LINKEDIN_NOT_CONFIGURED',
        message: 'LinkedIn OAuth env vars are missing',
      })
    }

    const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', env.LINKEDIN_CLIENT_ID)
    url.searchParams.set('redirect_uri', env.LINKEDIN_REDIRECT_URI)
    url.searchParams.set('state', params.state)
    url.searchParams.set('scope', 'r_liteprofile r_emailaddress w_member_social')
    return url.toString()
  }

  async exchangeCodeForAccessToken(code: string): Promise<{ accessToken: string; expiresAt: Date | null }> {
    if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET || !env.LINKEDIN_REDIRECT_URI) {
      throw new AppError({
        status: 500,
        code: 'LINKEDIN_NOT_CONFIGURED',
        message: 'LinkedIn OAuth env vars are missing',
      })
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.LINKEDIN_REDIRECT_URI,
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
    })

    const resp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new AppError({
        status: 401,
        code: 'LINKEDIN_TOKEN_EXCHANGE_FAILED',
        message: 'Failed to exchange LinkedIn code for token',
        details: text,
      })
    }

    const data = (await resp.json()) as LinkedInTokenResponse
    const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
    return { accessToken: data.access_token, expiresAt }
  }

  async getProfile(accessToken: string): Promise<LinkedInProfile> {
    const resp = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new AppError({
        status: 401,
        code: 'LINKEDIN_PROFILE_FAILED',
        message: 'Failed to fetch LinkedIn profile',
        details: text,
      })
    }
    return (await resp.json()) as LinkedInProfile
  }

  async getEmail(accessToken: string): Promise<string | null> {
    const url = new URL('https://api.linkedin.com/v2/emailAddress')
    url.searchParams.set('q', 'members')
    url.searchParams.set('projection', '(elements*(handle~))')

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!resp.ok) return null
    const data = (await resp.json()) as {
      elements?: Array<{ ['handle~']?: { emailAddress?: string } }>
    }
    const email = data.elements?.[0]?.['handle~']?.emailAddress
    return email ?? null
  }
}

