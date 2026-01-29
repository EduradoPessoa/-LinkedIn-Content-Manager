import { query } from '../../shared/database/pool.js'
import type { PostRow, PostStatus } from './posts.types.js'

export async function listPostsByUser(userId: string): Promise<PostRow[]> {
  const result = await query<PostRow>(
    `select id, user_id, account_id, content, status, scheduled_at, published_at, linkedin_post_urn, linkedin_author_type, linkedin_author_urn, cover_image_data_url, ai_post_context, ai_image_context, ai_image_prompt, publish_attempts, publish_last_error, publish_locked_at, created_at, updated_at
     from posts
     where user_id = $1
     order by created_at desc`,
    [userId],
  )
  return result.rows
}

export async function listScheduledPostsByUser(userId: string): Promise<PostRow[]> {
  const result = await query<PostRow>(
    `select id, user_id, account_id, content, status, scheduled_at, published_at, linkedin_post_urn, linkedin_author_type, linkedin_author_urn, cover_image_data_url, ai_post_context, ai_image_context, ai_image_prompt, publish_attempts, publish_last_error, publish_locked_at, created_at, updated_at
     from posts
     where user_id = $1 and status = 'scheduled'
     order by scheduled_at asc nulls last`,
    [userId],
  )
  return result.rows
}

export async function createPost(params: {
  id: string
  userId: string
  accountId: string | null
  content: string
  status: PostStatus
  scheduledAt: Date | null
  linkedinAuthorType?: 'person' | 'organization'
  linkedinAuthorUrn?: string | null
  coverImageDataUrl?: string | null
  aiPostContext?: string | null
  aiImageContext?: string | null
  aiImagePrompt?: string | null
}): Promise<PostRow> {
  const result = await query<PostRow>(
    `insert into posts (id, user_id, account_id, content, status, scheduled_at, linkedin_author_type, linkedin_author_urn, cover_image_data_url, ai_post_context, ai_image_context, ai_image_prompt)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning id, user_id, account_id, content, status, scheduled_at, published_at, linkedin_post_urn, linkedin_author_type, linkedin_author_urn, cover_image_data_url, ai_post_context, ai_image_context, ai_image_prompt, publish_attempts, publish_last_error, publish_locked_at, created_at, updated_at`,
    [
      params.id,
      params.userId,
      params.accountId,
      params.content,
      params.status,
      params.scheduledAt ? params.scheduledAt.toISOString() : null,
      params.linkedinAuthorType ?? 'person',
      params.linkedinAuthorUrn ?? null,
      params.coverImageDataUrl ?? null,
      params.aiPostContext ?? null,
      params.aiImageContext ?? null,
      params.aiImagePrompt ?? null,
    ],
  )
  return result.rows[0]
}

export async function updatePost(params: {
  id: string
  userId: string
  content?: string
  status?: PostStatus
  scheduledAt?: Date | null
  publishedAt?: Date | null
  linkedinPostUrn?: string | null
  linkedinAuthorType?: 'person' | 'organization'
  linkedinAuthorUrn?: string | null
  coverImageDataUrl?: string | null
  aiPostContext?: string | null
  aiImageContext?: string | null
  aiImagePrompt?: string | null
  publishAttempts?: number
  publishLastError?: string | null
  publishLockedAt?: Date | null
}): Promise<PostRow | null> {
  const content = params.content ?? null
  const status = params.status ?? null
  const hasScheduledAt = params.scheduledAt !== undefined
  const scheduledAt = params.scheduledAt === undefined ? null : params.scheduledAt
  const hasPublishedAt = params.publishedAt !== undefined
  const publishedAt = params.publishedAt === undefined ? null : params.publishedAt

  const hasLinkedinPostUrn = params.linkedinPostUrn !== undefined
  const linkedinPostUrn = params.linkedinPostUrn === undefined ? null : params.linkedinPostUrn

  const hasLinkedinAuthorType = params.linkedinAuthorType !== undefined
  const linkedinAuthorType = params.linkedinAuthorType === undefined ? null : params.linkedinAuthorType

  const hasLinkedinAuthorUrn = params.linkedinAuthorUrn !== undefined
  const linkedinAuthorUrn = params.linkedinAuthorUrn === undefined ? null : params.linkedinAuthorUrn

  const hasCoverImageDataUrl = params.coverImageDataUrl !== undefined
  const coverImageDataUrl = params.coverImageDataUrl === undefined ? null : params.coverImageDataUrl

  const hasAiPostContext = params.aiPostContext !== undefined
  const aiPostContext = params.aiPostContext === undefined ? null : params.aiPostContext

  const hasAiImagePrompt = params.aiImagePrompt !== undefined
  const aiImagePrompt = params.aiImagePrompt === undefined ? null : params.aiImagePrompt

  const hasAiImageContext = params.aiImageContext !== undefined
  const aiImageContext = params.aiImageContext === undefined ? null : params.aiImageContext

  const hasPublishAttempts = params.publishAttempts !== undefined
  const publishAttempts = params.publishAttempts === undefined ? null : params.publishAttempts

  const hasPublishLastError = params.publishLastError !== undefined
  const publishLastError = params.publishLastError === undefined ? null : params.publishLastError

  const hasPublishLockedAt = params.publishLockedAt !== undefined
  const publishLockedAt = params.publishLockedAt === undefined ? null : params.publishLockedAt

  const result = await query<PostRow>(
    `update posts
     set content = coalesce($1, content),
         status = coalesce($2, status),
         scheduled_at = case when $3::boolean then $4 else scheduled_at end,
         published_at = case when $5::boolean then $6 else published_at end,
         linkedin_post_urn = case when $7::boolean then $8 else linkedin_post_urn end,
         linkedin_author_type = case when $9::boolean then $10 else linkedin_author_type end,
         linkedin_author_urn = case when $11::boolean then $12 else linkedin_author_urn end,
         cover_image_data_url = case when $13::boolean then $14 else cover_image_data_url end,
         ai_post_context = case when $15::boolean then $16 else ai_post_context end,
         ai_image_context = case when $17::boolean then $18 else ai_image_context end,
         ai_image_prompt = case when $19::boolean then $20 else ai_image_prompt end,
         publish_attempts = case when $21::boolean then $22 else publish_attempts end,
         publish_last_error = case when $23::boolean then $24 else publish_last_error end,
         publish_locked_at = case when $25::boolean then $26 else publish_locked_at end,
         updated_at = now()
     where id = $27 and user_id = $28
     returning id, user_id, account_id, content, status, scheduled_at, published_at, linkedin_post_urn, linkedin_author_type, linkedin_author_urn, cover_image_data_url, ai_post_context, ai_image_context, ai_image_prompt, publish_attempts, publish_last_error, publish_locked_at, created_at, updated_at`,
    [
      content,
      status,
      hasScheduledAt,
      scheduledAt ? scheduledAt.toISOString() : null,
      hasPublishedAt,
      publishedAt ? publishedAt.toISOString() : null,
      hasLinkedinPostUrn,
      linkedinPostUrn,
      hasLinkedinAuthorType,
      linkedinAuthorType,
      hasLinkedinAuthorUrn,
      linkedinAuthorUrn,
      hasCoverImageDataUrl,
      coverImageDataUrl,
      hasAiPostContext,
      aiPostContext,
      hasAiImageContext,
      aiImageContext,
      hasAiImagePrompt,
      aiImagePrompt,
      hasPublishAttempts,
      publishAttempts,
      hasPublishLastError,
      publishLastError,
      hasPublishLockedAt,
      publishLockedAt ? publishLockedAt.toISOString() : null,
      params.id,
      params.userId,
    ],
  )
  return result.rows[0] ?? null
}

export async function deletePost(params: { id: string; userId: string }): Promise<boolean> {
  const result = await query<{ id: string }>(`delete from posts where id = $1 and user_id = $2 returning id`, [
    params.id,
    params.userId,
  ])
  return Boolean(result.rows[0])
}

export async function getPostById(params: { id: string; userId: string }): Promise<PostRow | null> {
  const result = await query<PostRow>(
    `select id, user_id, account_id, content, status, scheduled_at, published_at, linkedin_post_urn, linkedin_author_type, linkedin_author_urn, cover_image_data_url, ai_post_context, ai_image_context, ai_image_prompt, publish_attempts, publish_last_error, publish_locked_at, created_at, updated_at
     from posts
     where id = $1 and user_id = $2`,
    [params.id, params.userId],
  )
  return result.rows[0] ?? null
}

export async function claimDueScheduledPosts(params: {
  limit: number
}): Promise<Array<{ id: string; user_id: string; publish_attempts: number }>> {
  const result = await query<{ id: string; user_id: string; publish_attempts: number }>(
    `with due as (
      select id
      from posts
      where status = 'scheduled'
        and scheduled_at is not null
        and scheduled_at <= now()
      order by scheduled_at asc
      for update skip locked
      limit $1
    )
    update posts
    set status = 'publishing',
        publish_attempts = publish_attempts + 1,
        publish_locked_at = now(),
        updated_at = now()
    where id in (select id from due)
    returning id, user_id, publish_attempts`,
    [params.limit],
  )
  return result.rows
}
