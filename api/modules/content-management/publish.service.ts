import { env } from '../../shared/env.js'
import { decryptString } from '../../shared/crypto.js'
import { AppError } from '../../shared/errors.js'
import { getLinkedInAccountForUser } from '../auth/user.repo.js'
import { LinkedInApi } from '../linkedin-integration/linkedin.api.js'
import { getPostById, updatePost } from './posts.repo.js'
import type { PostRow } from './posts.types.js'

const linkedInApi = new LinkedInApi()

export async function publishPost(params: {
  userId: string
  postId: string
}): Promise<{ post: PostRow; warning?: string }> {
  const post = await getPostById({ id: params.postId, userId: params.userId })
  if (!post) {
    throw new AppError({ status: 404, code: 'POST_NOT_FOUND', message: 'Post not found' })
  }

  if (post.status === 'published') {
    return { post }
  }

  const isOrganizationAuthor = post.linkedin_author_type === 'organization'
  if (isOrganizationAuthor && !env.LINKEDIN_ORG_POSTING_ENABLED) {
    throw new AppError({ status: 400, code: 'FEATURE_DISABLED', message: 'Organization posting disabled' })
  }
  const requiredScope = isOrganizationAuthor ? 'w_organization_social' : 'w_member_social'

  const scopes = (env.LINKEDIN_SCOPES || '').split(/\s+/).map((s) => s.trim()).filter(Boolean)
  if (!scopes.includes(requiredScope)) {
    throw new AppError({
      status: 400,
      code: 'LINKEDIN_SCOPE_MISSING',
      message: `Escopo do LinkedIn ausente: ${requiredScope}`,
      details: { expected: requiredScope, current: scopes },
    })
  }

  const account = await getLinkedInAccountForUser({ userId: params.userId, accountId: post.account_id })
  if (!account) {
    throw new AppError({ status: 400, code: 'LINKEDIN_ACCOUNT_NOT_CONNECTED', message: 'No LinkedIn account connected' })
  }

  if (account.expires_at && new Date(account.expires_at).getTime() < Date.now()) {
    throw new AppError({ status: 401, code: 'LINKEDIN_ACCESS_TOKEN_EXPIRED', message: 'LinkedIn access token expired' })
  }

  const accessToken = decryptString(account.access_token_encrypted)

  const tokenInfo = await linkedInApi.introspectToken(accessToken)
  if (tokenInfo?.active && typeof tokenInfo.scope === 'string') {
    const tokenScopes = tokenInfo.scope.split(',').map((s) => s.trim()).filter(Boolean)
    if (!tokenScopes.includes(requiredScope)) {
      throw new AppError({
        status: 400,
        code: 'LINKEDIN_TOKEN_SCOPE_MISSING',
        message: `O token do LinkedIn não tem o escopo ${requiredScope}. Refaça a conexão (logout/login) para reautorizar.`,
        details: { tokenInfo },
      })
    }
  }

  const { authorUrn, uploadOwnerUrn } = await (async (): Promise<{ authorUrn: string; uploadOwnerUrn: string }> => {
    if (!isOrganizationAuthor) {
      return linkedInApi.resolveAuthorUrn(accessToken)
    }

    const orgUrn = post.linkedin_author_urn
    if (!orgUrn || !/^urn:li:organization:\d+$/.test(orgUrn.trim())) {
      throw new AppError({
        status: 400,
        code: 'LINKEDIN_ORGANIZATION_NOT_SET',
        message: 'Organização do LinkedIn não configurada no post',
      })
    }

    const orgs = await linkedInApi.listAdminOrganizations(accessToken)
    const match = orgs.find((o) => o.urn === orgUrn)
    if (!match) {
      throw new AppError({
        status: 403,
        code: 'LINKEDIN_ORGANIZATION_NOT_ALLOWED',
        message: 'Você não tem permissão para postar nesta organização',
        details: { organizationUrn: orgUrn },
      })
    }

    return { authorUrn: match.urn, uploadOwnerUrn: match.urn }
  })()
  const isRestPostsDenied = (e: unknown): boolean => {
    if (!(e instanceof AppError)) return false
    if (e.code !== 'LINKEDIN_POSTS_CREATE_FAILED') return false
    if (e.status !== 403) return false
    const details = e.details as { response?: string } | undefined
    const response = typeof details?.response === 'string' ? details.response : ''
    return /partnerApiPostsExternal\.CREATE/i.test(response)
  }

  try {
    const published = await (async (): Promise<{ urn: string; mode: 'text' | 'image' | 'text_fallback' }> => {
      if (!post.cover_image_data_url) {
        try {
          const result = await linkedInApi.createPost({ accessToken, authorUrn, commentary: post.content })
          return { urn: result.urn, mode: 'text' }
        } catch (e) {
          if (isRestPostsDenied(e)) {
            const result = await linkedInApi.createTextPost({ accessToken, authorUrn, text: post.content })
            return { urn: result.urn, mode: 'text_fallback' }
          }
          throw e
        }
      }

      const match = /^data:(image\/(png|jpeg));base64,(.*)$/.exec(post.cover_image_data_url)
      if (!match) {
        throw new AppError({ status: 400, code: 'INVALID_COVER_IMAGE', message: 'Invalid cover image format' })
      }

      const contentType = match[1]
      const bytes = Buffer.from(match[3], 'base64')
      try {
        const { uploadUrl, imageUrn } = await linkedInApi.initializeImageUpload({ accessToken, ownerUrn: uploadOwnerUrn })
        await linkedInApi.uploadToLinkedIn({ accessToken, uploadUrl, bytes, contentType })
        try {
          const result = await linkedInApi.createPost({ accessToken, authorUrn, commentary: post.content, imageUrn })
          return { urn: result.urn, mode: 'image' }
        } catch (e) {
          if (isRestPostsDenied(e)) {
            const result = await linkedInApi.createTextPost({ accessToken, authorUrn, text: post.content })
            return { urn: result.urn, mode: 'text_fallback' }
          }
          throw e
        }
      } catch (e) {
        if (e instanceof AppError && e.code === 'LINKEDIN_IMAGE_INIT_FAILED') {
          const result = await linkedInApi.createTextPost({ accessToken, authorUrn, text: post.content })
          return { urn: result.urn, mode: 'text_fallback' }
        }
        throw e
      }
    })()

    const updated = await updatePost({
      id: params.postId,
      userId: params.userId,
      status: 'published',
      publishedAt: new Date(),
      scheduledAt: null,
      linkedinPostUrn: published.urn,
      publishLastError: null,
      publishLockedAt: null,
    })

    if (!updated) {
      throw new AppError({ status: 404, code: 'POST_NOT_FOUND', message: 'Post not found' })
    }

    if (published.mode === 'text_fallback') {
      return {
        post: updated,
        warning:
          'O LinkedIn não liberou publicação via /rest (ou upload de imagem) para este app/token. O post foi publicado como texto (sem imagem).',
      }
    }

    return { post: updated }
  } catch (e) {
    if (e instanceof AppError && e.status === 403) {
      const tokenInfo = await linkedInApi.introspectToken(accessToken)
      throw new AppError({
        status: e.status,
        code: e.code,
        message: e.message,
        details: {
          original: e.details,
          tokenInfo,
          hint: 'Se tokenInfo.scope não contiver w_member_social, faça logout/login para reautorizar com os scopes corretos.',
        },
      })
    }
    throw e
  }
}
