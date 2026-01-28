import { query } from '../../shared/database/pool.js'

export type UserRow = {
  id: string
  linkedin_member_id: string
  name: string | null
  email: string | null
  created_at: string
}

export async function getUserByLinkedInMemberId(memberId: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `select id, linkedin_member_id, name, email, created_at from users where linkedin_member_id = $1`,
    [memberId],
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

