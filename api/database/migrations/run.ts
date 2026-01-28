import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../../shared/database/pool.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(
    `create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )`,
  )
}

async function getAppliedIds(): Promise<Set<string>> {
  const result = await pool.query<{ id: string }>(`select id from schema_migrations order by id asc`)
  return new Set(result.rows.map((r) => r.id))
}

async function run(): Promise<void> {
  await ensureMigrationsTable()

  const migrationsDir = path.join(__dirname, 'sql')
  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()
  const applied = await getAppliedIds()

  for (const file of files) {
    if (applied.has(file)) continue
    const fullPath = path.join(migrationsDir, file)
    const sql = await fs.readFile(fullPath, 'utf8')

    const client = await pool.connect()
    try {
      await client.query('begin')
      await client.query(sql)
      await client.query(`insert into schema_migrations (id) values ($1)`, [file])
      await client.query('commit')
      process.stdout.write(`applied ${file}\n`)
    } catch (e) {
      await client.query('rollback')
      throw e
    } finally {
      client.release()
    }
  }
}

void run().then(
  () => {
    void pool.end()
  },
  async (e) => {
    console.error(e)
    await pool.end()
    process.exit(1)
  },
)

