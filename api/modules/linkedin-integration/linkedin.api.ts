import { env } from '../../shared/env.js'
import { AppError } from '../../shared/errors.js'

export type LinkedInTokenResponse = {
  access_token: string
  expires_in: number
  id_token?: string
}

export type LinkedInTokenIntrospection = {
  active: boolean
  status?: 'revoked' | 'expired' | 'active'
  scope?: string
  auth_type?: '3L' | '2L' | 'Enterprise_User' | string
  expires_at?: number
  created_at?: number
  authorized_at?: number
  client_id?: string
}

export type LinkedInProfile = {
  id: string
  firstName?: { localized?: Record<string, string> }
  lastName?: { localized?: Record<string, string> }
}

export type LinkedInUserInfo = {
  sub: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  locale?: string
  email?: string
  email_verified?: boolean
}

export type LinkedInUgcPostResponse = {
  id: string
}

export type LinkedInRegisterUploadResponse = {
  value: {
    asset: string
    uploadMechanism: {
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'?: {
        uploadUrl: string
        headers?: Record<string, string>
      }
    }
  }
}

type LinkedInInitializeImageUploadResponse = {
  value: {
    uploadUrl: string
    image: string
    uploadUrlExpiresAt?: number
  }
}

type LinkedInCreatePostResponse = {
  id?: string
}

type LinkedInMeResponse = {
  id: string
}

type LinkedInOrganizationAclResponse = {
  elements?: Array<{ organizationTarget?: string; organization?: string; state?: string; role?: string }>
  paging?: { start?: number; count?: number; links?: Array<{ rel?: string; href?: string }> }
}

type LinkedInOrganizationsResults = {
  results?: Record<string, { id?: number; localizedName?: string; vanityName?: string; $URN?: string }>
  statuses?: Record<string, number>
  errors?: Record<string, unknown>
}

export class LinkedInApi {
  private getApiHeaders(accessToken: string, extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      ...(extra ?? {}),
    }
    return headers
  }

  private getV2Version(): string {
    const raw = env.LINKEDIN_VERSION
    const yyyymm = raw ? raw.split('.')[0] : null
    if (yyyymm && /^\d{6}$/.test(yyyymm)) return yyyymm
    const now = new Date()
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  }

  private applyV2VersionHeaders(headers: Record<string, string>): void {
    const version = this.getV2Version()
    headers['X-LinkedIn-Version'] = version
    headers['LinkedIn-Version'] = version
  }

  private async fetchJson(params: {
    url: string
    accessToken: string
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    body?: string
    errorCode: string
    errorMessage: string
  }): Promise<unknown> {
    const reqHeaders = this.getApiHeaders(params.accessToken, params.headers)
    this.applyV2VersionHeaders(reqHeaders)
    const resp = await fetch(params.url, {
      method: params.method ?? 'GET',
      headers: reqHeaders,
      body: params.body,
    })
    const text = await resp.text().catch(() => '')
    if (!resp.ok) {
      const headersNoAuth = { ...reqHeaders }
      delete headersNoAuth.Authorization
      throw new AppError({
        status: resp.status,
        code: params.errorCode,
        message: params.errorMessage,
        details: { response: text, request: { url: params.url, headers: headersNoAuth } },
      })
    }
    return text ? (JSON.parse(text) as unknown) : null
  }

  async listAdminOrganizations(accessToken: string): Promise<Array<{ id: number; urn: string; name: string | null; vanityName: string | null }>> {
    const tokenInfo = await this.introspectToken(accessToken)
    if (tokenInfo?.active && typeof tokenInfo.scope === 'string') {
      const tokenScopes = tokenInfo.scope.split(',').map((s) => s.trim()).filter(Boolean)
      if (!tokenScopes.includes('rw_organization_admin')) {
        throw new AppError({
          status: 400,
          code: 'LINKEDIN_TOKEN_SCOPE_MISSING',
          message: 'O token do LinkedIn não tem o escopo rw_organization_admin. Refaça a conexão para reautorizar.',
          details: { expected: 'rw_organization_admin', tokenInfo },
        })
      }
    }

    const acs = await (async (): Promise<LinkedInOrganizationAclResponse> => {
      try {
        return (await this.fetchJson({
          url: 'https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=100&start=0',
          accessToken,
          errorCode: 'LINKEDIN_ORG_ACLS_FAILED',
          errorMessage: 'Failed to list LinkedIn organizations for the member',
        })) as LinkedInOrganizationAclResponse
      } catch (e) {
        if (e instanceof AppError && (e.status === 403 || e.status === 404)) {
          return (await this.fetchJson({
            url: 'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=100&start=0',
            accessToken,
            errorCode: 'LINKEDIN_ORG_ACLS_FAILED',
            errorMessage: 'Failed to list LinkedIn organizations for the member',
          })) as LinkedInOrganizationAclResponse
        }
        throw e
      }
    })()

    const urns = (acs.elements ?? [])
      .map((e) => (typeof e.organizationTarget === 'string' ? e.organizationTarget : typeof e.organization === 'string' ? e.organization : null))
      .filter((v): v is string => Boolean(v))

    const ids = urns
      .map((urn) => {
        const m = /^urn:li:organization:(\d+)$/.exec(urn.trim())
        return m ? Number(m[1]) : null
      })
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))

    if (ids.length === 0) return []

    const idsParam = `List(${ids.join(',')})`
    const url = new URL('https://api.linkedin.com/rest/organizations')
    url.searchParams.set('ids', idsParam)
    const orgs = (await this.fetchJson({
      url: url.toString(),
      accessToken,
      errorCode: 'LINKEDIN_ORGS_LOOKUP_FAILED',
      errorMessage: 'Failed to lookup LinkedIn organization details',
    })) as LinkedInOrganizationsResults

    return ids.map((id) => {
      const key = String(id)
      const row = orgs.results?.[key]
      const urn = row?.$URN && typeof row.$URN === 'string' ? row.$URN : `urn:li:organization:${id}`
      const name = typeof row?.localizedName === 'string' ? row.localizedName : null
      const vanityName = typeof row?.vanityName === 'string' ? row.vanityName : null
      return { id, urn, name, vanityName }
    })
  }

  private getVersionCandidates(): string[] {
    const candidates: string[] = []
    const envVersion = env.LINKEDIN_VERSION
    if (envVersion) candidates.push(envVersion)

    const now = new Date()
    let year = now.getUTCFullYear()
    let month = now.getUTCMonth() + 1
    for (let i = 0; i < 24; i++) {
      const yyyymm = `${year}${String(month).padStart(2, '0')}`
      candidates.push(yyyymm)
      candidates.push(`${yyyymm}.01`)
      month -= 1
      if (month === 0) {
        month = 12
        year -= 1
      }
    }

    return Array.from(new Set(candidates)).filter((v) => /^\d{6}(\.\d{2})?$/.test(v))
  }

  private getMissingEnv(required: Array<'LINKEDIN_CLIENT_ID' | 'LINKEDIN_CLIENT_SECRET' | 'LINKEDIN_REDIRECT_URI'>): string[] {
    const missing: string[] = []
    for (const key of required) {
      if (key === 'LINKEDIN_CLIENT_ID' && !env.LINKEDIN_CLIENT_ID) missing.push(key)
      if (key === 'LINKEDIN_CLIENT_SECRET' && !env.LINKEDIN_CLIENT_SECRET) missing.push(key)
      if (key === 'LINKEDIN_REDIRECT_URI' && !env.LINKEDIN_REDIRECT_URI) missing.push(key)
    }
    return missing
  }

  buildAuthUrl(params: { state: string }): string {
    const missing = this.getMissingEnv(['LINKEDIN_CLIENT_ID', 'LINKEDIN_REDIRECT_URI'])
    if (missing.length > 0) {
      throw new AppError({
        status: 400,
        code: 'LINKEDIN_NOT_CONFIGURED',
        message: 'LinkedIn OAuth env vars are missing',
        details: { missing },
      })
    }

    const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', env.LINKEDIN_CLIENT_ID)
    url.searchParams.set('redirect_uri', env.LINKEDIN_REDIRECT_URI)
    url.searchParams.set('state', params.state)
    const scopes = (env.LINKEDIN_SCOPES || 'r_liteprofile').split(/\s+/).map((s) => s.trim()).filter(Boolean)
    url.searchParams.set('scope', scopes.join(' '))
    url.searchParams.set('prompt', 'consent')
    return url.toString()
  }

  async exchangeCodeForAccessToken(code: string): Promise<{ accessToken: string; expiresAt: Date | null }> {
    const missing = this.getMissingEnv(['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT_URI'])
    if (missing.length > 0) {
      throw new AppError({
        status: 400,
        code: 'LINKEDIN_NOT_CONFIGURED',
        message: 'LinkedIn OAuth env vars are missing',
        details: { missing },
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

  async introspectToken(accessToken: string): Promise<LinkedInTokenIntrospection | null> {
    const missing = this.getMissingEnv(['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'])
    if (missing.length > 0) return null

    const body = new URLSearchParams({
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
      token: accessToken,
    })

    const resp = await fetch('https://www.linkedin.com/oauth/v2/introspectToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!resp.ok) return null
    const data = (await resp.json()) as LinkedInTokenIntrospection
    return data
  }

  async getProfile(accessToken: string): Promise<LinkedInProfile> {
    const resp = await fetch('https://api.linkedin.com/v2/me', {
      headers: this.getApiHeaders(accessToken),
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
      headers: this.getApiHeaders(accessToken),
    })

    if (!resp.ok) return null
    const data = (await resp.json()) as {
      elements?: Array<{ ['handle~']?: { emailAddress?: string } }>
    }
    const email = data.elements?.[0]?.['handle~']?.emailAddress
    return email ?? null
  }

  async getUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
    const resp = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: this.getApiHeaders(accessToken),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new AppError({
        status: 401,
        code: 'LINKEDIN_USERINFO_FAILED',
        message: 'Failed to fetch LinkedIn userinfo',
        details: text,
      })
    }

    return (await resp.json()) as LinkedInUserInfo
  }

  async getMeId(accessToken: string): Promise<string | null> {
    const reqHeaders = this.getApiHeaders(accessToken)
    this.applyV2VersionHeaders(reqHeaders)
    const resp = await fetch('https://api.linkedin.com/v2/me', {
      headers: reqHeaders,
    })

    if (!resp.ok) return null
    const data = (await resp.json()) as LinkedInMeResponse
    return typeof data?.id === 'string' ? data.id : null
  }

  async resolveAuthorUrn(accessToken: string): Promise<{ authorUrn: string; uploadOwnerUrn: string }> {
    const meId = await this.getMeId(accessToken)
    if (meId) {
      const authorUrn = `urn:li:person:${meId}`
      return { authorUrn, uploadOwnerUrn: authorUrn }
    }

    const userInfo = await this.getUserInfo(accessToken)
    const authorUrn = `urn:li:person:${userInfo.sub}`
    return { authorUrn, uploadOwnerUrn: authorUrn }
  }

  async createTextPost(params: {
    accessToken: string
    authorUrn: string
    text: string
  }): Promise<{ urn: string }> {
    const reqHeaders = this.getApiHeaders(params.accessToken, { 'Content-Type': 'application/json' })
    this.applyV2VersionHeaders(reqHeaders)
    const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        author: params.authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: params.text },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    })

    const text = await resp.text().catch(() => '')
    if (!resp.ok) {
      const headersNoAuth = { ...reqHeaders }
      delete headersNoAuth.Authorization
      throw new AppError({
        status: resp.status,
        code: 'LINKEDIN_PUBLISH_FAILED',
        message: 'Failed to publish on LinkedIn',
        details: { response: text, request: { url: 'https://api.linkedin.com/v2/ugcPosts', headers: headersNoAuth } },
      })
    }

    const parsed = text ? (JSON.parse(text) as LinkedInUgcPostResponse) : null
    const urn = typeof parsed?.id === 'string' ? parsed.id : resp.headers.get('x-restli-id')
    if (!urn) {
      return { urn: 'unknown' }
    }
    return { urn }
  }

  async registerImageUpload(params: { accessToken: string; ownerUrn: string }): Promise<{ asset: string; uploadUrl: string }> {
    const reqHeaders = this.getApiHeaders(params.accessToken, { 'Content-Type': 'application/json' })
    this.applyV2VersionHeaders(reqHeaders)
    const resp = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: params.ownerUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
          supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
        },
      }),
    })

    const text = await resp.text().catch(() => '')
    if (!resp.ok) {
      const headersNoAuth = { ...reqHeaders }
      delete headersNoAuth.Authorization
      throw new AppError({
        status: resp.status,
        code: 'LINKEDIN_REGISTER_UPLOAD_FAILED',
        message: 'Failed to register LinkedIn image upload',
        details: {
          response: text,
          request: {
            url: 'https://api.linkedin.com/v2/assets?action=registerUpload',
            headers: headersNoAuth,
            owner: params.ownerUrn,
          },
        },
      })
    }

    const parsed = (text ? (JSON.parse(text) as LinkedInRegisterUploadResponse) : null) as LinkedInRegisterUploadResponse | null
    const upload = parsed?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']
    const uploadUrl = upload?.uploadUrl
    const asset = parsed?.value?.asset
    if (!uploadUrl || !asset) {
      throw new AppError({
        status: 500,
        code: 'LINKEDIN_REGISTER_UPLOAD_INVALID',
        message: 'LinkedIn registerUpload response missing uploadUrl/asset',
        details: parsed,
      })
    }

    return { asset, uploadUrl }
  }

  async initializeImageUpload(params: {
    accessToken: string
    ownerUrn: string
  }): Promise<{ uploadUrl: string; imageUrn: string }> {
    const body = JSON.stringify({
      initializeUploadRequest: {
        owner: params.ownerUrn,
      },
    })

    let lastError: AppError | null = null
    for (const version of this.getVersionCandidates()) {
      const reqHeaders = this.getApiHeaders(params.accessToken, { 'Content-Type': 'application/json' })
      reqHeaders['LinkedIn-Version'] = version
      const resp = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
        method: 'POST',
        headers: reqHeaders,
        body,
      })

      const text = await resp.text().catch(() => '')
      if (resp.ok) {
        const parsed = text ? (JSON.parse(text) as LinkedInInitializeImageUploadResponse) : null
        const uploadUrl = parsed?.value?.uploadUrl
        const imageUrn = parsed?.value?.image
        if (!uploadUrl || !imageUrn) {
          throw new AppError({
            status: 500,
            code: 'LINKEDIN_IMAGE_INIT_INVALID',
            message: 'LinkedIn initializeUpload response missing uploadUrl/image',
            details: parsed,
          })
        }
        return { uploadUrl, imageUrn }
      }

      const isNonexistentVersion = resp.status === 426 && /NONEXISTENT_VERSION/i.test(text)
      const headersNoAuth = { ...reqHeaders }
      delete headersNoAuth.Authorization
      lastError = new AppError({
        status: resp.status,
        code: 'LINKEDIN_IMAGE_INIT_FAILED',
        message: 'Failed to initialize LinkedIn image upload',
        details: {
          response: text,
          request: {
            url: 'https://api.linkedin.com/rest/images?action=initializeUpload',
            headers: headersNoAuth,
            owner: params.ownerUrn,
          },
        },
      })

      if (!isNonexistentVersion) break
    }

    throw lastError ??
      new AppError({ status: 500, code: 'LINKEDIN_IMAGE_INIT_FAILED', message: 'Failed to initialize LinkedIn image upload' })
  }

  async createPost(params: {
    accessToken: string
    authorUrn: string
    commentary: string
    imageUrn?: string
  }): Promise<{ urn: string }> {
    const baseBody: Record<string, unknown> = {
      author: params.authorUrn,
      commentary: params.commentary,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }
    if (params.imageUrn) {
      baseBody.content = { media: { id: params.imageUrn } }
    }
    const body = JSON.stringify(baseBody)

    let lastError: AppError | null = null
    for (const version of this.getVersionCandidates()) {
      const reqHeaders = this.getApiHeaders(params.accessToken, { 'Content-Type': 'application/json' })
      reqHeaders['LinkedIn-Version'] = version
      const resp = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: reqHeaders,
        body,
      })

      const text = await resp.text().catch(() => '')
      if (resp.ok) {
        const headerUrn = resp.headers.get('x-restli-id')
        if (headerUrn) return { urn: headerUrn }
        const parsed = text ? (JSON.parse(text) as LinkedInCreatePostResponse) : null
        const urn = typeof parsed?.id === 'string' ? parsed.id : null
        return { urn: urn ?? 'unknown' }
      }

      const isNonexistentVersion = resp.status === 426 && /NONEXISTENT_VERSION/i.test(text)
      const headersNoAuth = { ...reqHeaders }
      delete headersNoAuth.Authorization
      lastError = new AppError({
        status: resp.status,
        code: 'LINKEDIN_POSTS_CREATE_FAILED',
        message: 'Failed to create post on LinkedIn',
        details: { response: text, request: { url: 'https://api.linkedin.com/rest/posts', headers: headersNoAuth } },
      })

      if (!isNonexistentVersion) break
    }

    throw lastError ?? new AppError({ status: 500, code: 'LINKEDIN_POSTS_CREATE_FAILED', message: 'Failed to create post on LinkedIn' })
  }

  async uploadToLinkedIn(params: {
    accessToken: string
    uploadUrl: string
    bytes: Uint8Array
    contentType: string
  }): Promise<void> {
    const resp = await fetch(params.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': params.contentType,
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: params.bytes,
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new AppError({
        status: resp.status,
        code: 'LINKEDIN_UPLOAD_FAILED',
        message: 'Failed to upload image bytes to LinkedIn',
        details: text,
      })
    }
  }

  async createImagePost(params: {
    accessToken: string
    authorUrn: string
    text: string
    assetUrn: string
  }): Promise<{ urn: string }> {
    const reqHeaders = this.getApiHeaders(params.accessToken, { 'Content-Type': 'application/json' })
    this.applyV2VersionHeaders(reqHeaders)
    const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        author: params.authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: params.text },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                media: params.assetUrn,
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    })

    const text = await resp.text().catch(() => '')
    if (!resp.ok) {
      const headersNoAuth = { ...reqHeaders }
      delete headersNoAuth.Authorization
      throw new AppError({
        status: resp.status,
        code: 'LINKEDIN_PUBLISH_FAILED',
        message: 'Failed to publish on LinkedIn',
        details: { response: text, request: { url: 'https://api.linkedin.com/v2/ugcPosts', headers: headersNoAuth } },
      })
    }

    const parsed = text ? (JSON.parse(text) as LinkedInUgcPostResponse) : null
    const urn = typeof parsed?.id === 'string' ? parsed.id : resp.headers.get('x-restli-id')
    if (!urn) {
      return { urn: 'unknown' }
    }
    return { urn }
  }
}
