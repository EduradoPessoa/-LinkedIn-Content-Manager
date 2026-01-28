import { Pool } from 'pg'
import { env } from '../env.js'

function getConnectionString(): string | undefined {
  if (env.DATABASE_URL && env.DATABASE_URL.length > 0) return env.DATABASE_URL
  if (!env.DB_HOST || !env.DB_NAME || !env.DB_USER) return undefined
  const password = env.DB_PASSWORD ?? ''
  return `postgresql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(password)}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`
}

const connectionString = getConnectionString()
if (!connectionString) {
  throw new Error('Database configuration missing (DATABASE_URL or DB_* env vars)')
}

export const pool = new Pool({
  connectionString,
})

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
  const result = await pool.query(text, params)
  return { rows: result.rows as T[] }
}

