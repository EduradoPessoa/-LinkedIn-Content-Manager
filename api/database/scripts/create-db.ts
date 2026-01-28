import { Client } from 'pg'
import { env } from '../../shared/env.js'

async function run(): Promise<void> {
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: 'postgres',
  })

  await client.connect()
  const exists = await client.query<{ exists: boolean }>(
    `select exists(select 1 from pg_database where datname = $1) as exists`,
    [env.DB_NAME],
  )

  if (!exists.rows[0]?.exists) {
    await client.query(`create database "${env.DB_NAME}"`)
  }

  await client.end()
}

void run()

