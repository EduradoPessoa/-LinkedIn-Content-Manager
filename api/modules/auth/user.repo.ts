import { query } from '../../shared/database/pool.js'

export type UserRow = {
  id: string
  linkedin_member_id: string
  name: string | null
  email: string | null
  created_at: string
  updated_at?: string
  ai_default_post_context?: string | null
  ai_default_image_context?: string | null
}

export async function getUserByLinkedInMemberId(memberId: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `select id, linkedin_member_id, name, email, ai_default_post_context, ai_default_image_context, created_at, updated_at from users where linkedin_member_id = $1`,
    [memberId],
  )
  return result.rows[0] ?? null
}

export async function getUserAiSettings(
  userId: string,
): Promise<{ ai_default_post_context: string | null; ai_default_image_context: string | null } | null> {
  const result = await query<{ ai_default_post_context: string | null; ai_default_image_context: string | null }>(
    `select ai_default_post_context, ai_default_image_context from users where id = $1`,
    [userId],
  )
  return result.rows[0] ?? null
}

export async function updateUserAiSettings(params: {
  userId: string
  aiDefaultPostContext: string | null
  aiDefaultImageContext: string | null
}): Promise<{ ai_default_post_context: string | null; ai_default_image_context: string | null } | null> {
  const result = await query<{ ai_default_post_context: string | null; ai_default_image_context: string | null }>(
    `update users
     set ai_default_post_context = $1,
         ai_default_image_context = $2,
         updated_at = now()
     where id = $3
     returning ai_default_post_context, ai_default_image_context`,
    [params.aiDefaultPostContext, params.aiDefaultImageContext, params.userId],
  )
  return result.rows[0] ?? null
}

export async function createUser(params: {
  id: string
  linkedinMemberId: string
  name: string | null
  email: string | null
}): Promise<UserRow> {
  const result = await query<UserRow>(
    `insert into users (id, linkedin_member_id, name, email)
     values ($1, $2, $3, $4)
     returning id, linkedin_member_id, name, email, created_at`,
    [params.id, params.linkedinMemberId, params.name, params.email],
  )
  return result.rows[0]
}

export async function upsertLinkedInAccount(params: {
  id: string
  userId: string
  providerAccountId: string
  accessTokenEncrypted: string
  expiresAt: Date | null
}): Promise<void> {
  await query(
    `insert into linkedin_accounts (id, user_id, provider, provider_account_id, access_token_encrypted, expires_at)
     values ($1, $2, 'linkedin', $3, $4, $5)
     on conflict (provider, provider_account_id)
     do update set access_token_encrypted = excluded.access_token_encrypted, expires_at = excluded.expires_at`,
    [
      params.id,
      params.userId,
      params.providerAccountId,
      params.accessTokenEncrypted,
      params.expiresAt ? params.expiresAt.toISOString() : null,
    ],
  )
}

export type LinkedInAccountRow = {
  id: string
  user_id: string
  provider: string
  provider_account_id: string
  access_token_encrypted: string
  expires_at: string | null
  created_at: string
}

export async function getLinkedInAccountForUser(params: {
  userId: string
  accountId?: string | null
}): Promise<LinkedInAccountRow | null> {
  if (params.accountId) {
    const result = await query<LinkedInAccountRow>(
      `select id, user_id, provider, provider_account_id, access_token_encrypted, expires_at, created_at
       from linkedin_accounts
       where user_id = $1 and id = $2 and provider = 'linkedin'
       limit 1`,
      [params.userId, params.accountId],
    )
    return result.rows[0] ?? null
  }

  const result = await query<LinkedInAccountRow>(
    `select id, user_id, provider, provider_account_id, access_token_encrypted, expires_at, created_at
     from linkedin_accounts
     where user_id = $1 and provider = 'linkedin'
     order by created_at desc
     limit 1`,
    [params.userId],
  )
  return result.rows[0] ?? null
}

