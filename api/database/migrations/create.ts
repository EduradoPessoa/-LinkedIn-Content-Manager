import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run(): Promise<void> {
  const name = process.argv.slice(2).join('-').trim()
  if (!name) {
    throw new Error('Usage: pnpm migration:create <name>')
  }

  const migrationsDir = path.join(__dirname, 'sql')
  await fs.mkdir(migrationsDir, { recursive: true })
  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()
  const last = files.at(-1)
  const nextNumber = last ? Number(last.slice(0, 3)) + 1 : 1
  const prefix = String(nextNumber).padStart(3, '0')
  const filename = `${prefix}_${name}.sql`
  const fullPath = path.join(migrationsDir, filename)
  await fs.writeFile(fullPath, '', 'utf8')
  process.stdout.write(`${filename}\n`)
}

void run().catch((e) => {
  console.error(e)
  process.exit(1)
})

