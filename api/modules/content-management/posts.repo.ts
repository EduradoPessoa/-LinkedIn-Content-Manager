import { query } from '../../shared/database/pool.js'
import type { PostRow, PostStatus } from './posts.types.js'

export async function listPostsByUser(userId: string): Promise<PostRow[]> {
  const result = await query<PostRow>(
    `select id, user_id, account_id, content, status, scheduled_at, published_at, created_at, updated_at
     from posts
     where user_id = $1
     order by created_at desc`,
    [userId],
  )
  return result.rows
}

export async function listScheduledPostsByUser(userId: string): Promise<PostRow[]> {
  const result = await query<PostRow>(
    `select id, user_id, account_id, content, status, scheduled_at, published_at, created_at, updated_at
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
}): Promise<PostRow> {
  const result = await query<PostRow>(
    `insert into posts (id, user_id, account_id, content, status, scheduled_at)
     values ($1, $2, $3, $4, $5, $6)
     returning id, user_id, account_id, content, status, scheduled_at, published_at, created_at, updated_at`,
    [
      params.id,
      params.userId,
      params.accountId,
      params.content,
      params.status,
      params.scheduledAt ? params.scheduledAt.toISOString() : null,
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
}): Promise<PostRow | null> {
  const content = params.content ?? null
  const status = params.status ?? null
  const hasScheduledAt = params.scheduledAt !== undefined
  const scheduledAt = params.scheduledAt === undefined ? null : params.scheduledAt
  const hasPublishedAt = params.publishedAt !== undefined
  const publishedAt = params.publishedAt === undefined ? null : params.publishedAt

  const result = await query<PostRow>(
    `update posts
     set content = coalesce($1, content),
         status = coalesce($2, status),
         scheduled_at = case when $3::boolean then $4 else scheduled_at end,
         published_at = case when $5::boolean then $6 else published_at end,
         updated_at = now()
     where id = $7 and user_id = $8
     returning id, user_id, account_id, content, status, scheduled_at, published_at, created_at, updated_at`,
    [
      content,
      status,
      hasScheduledAt,
      scheduledAt ? scheduledAt.toISOString() : null,
      hasPublishedAt,
      publishedAt ? publishedAt.toISOString() : null,
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
    `select id, user_id, account_id, content, status, scheduled_at, published_at, created_at, updated_at
     from posts
     where id = $1 and user_id = $2`,
    [params.id, params.userId],
  )
  return result.rows[0] ?? null
}
