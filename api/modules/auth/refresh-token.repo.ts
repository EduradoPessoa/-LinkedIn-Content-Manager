import { query } from '../../shared/database/pool.js'

export type RefreshTokenRow = {
  id: string
  user_id: string
  expires_at: string
  revoked_at: string | null
}

export async function insertRefreshToken(params: {
  id: string
  userId: string
  expiresAt: Date
}): Promise<void> {
  await query(
    `insert into refresh_tokens (id, user_id, expires_at) values ($1, $2, $3)`,
    [params.id, params.userId, params.expiresAt.toISOString()],
  )
}

export async function getRefreshTokenById(id: string): Promise<RefreshTokenRow | null> {
  const result = await query<RefreshTokenRow>(
    `select id, user_id, expires_at, revoked_at from refresh_tokens where id = $1`,
    [id],
  )
  return result.rows[0] ?? null
}

export async function revokeRefreshTokenById(id: string): Promise<void> {
  await query(`update refresh_tokens set revoked_at = now() where id = $1 and revoked_at is null`, [id])
}

export async function listAccountsForUser(userId: string): Promise<{ id: string; provider: string }[]> {
  const result = await query<{ id: string; provider: string }>(
    `select id, provider from linkedin_accounts where user_id = $1 order by created_at desc`,
    [userId],
  )
  return result.rows
}

