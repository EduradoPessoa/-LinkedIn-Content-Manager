import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const EnvSchema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().optional().default(3001),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:5173'),

  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional().default('localhost'),
  DB_PORT: z.coerce.number().optional().default(5432),
  DB_NAME: z.string().optional().default('linkedin-content-manager'),
  DB_USER: z.string().optional().default('postgres'),
  DB_PASSWORD: z.string().optional().default('postgres'),

  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_REDIRECT_URI: z.string().url().optional(),

  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),

  JWT_SECRET: z.string().min(16).optional().default('dev_only_change_me_please_1234'),
  ENCRYPTION_KEY: z.string().min(32).optional().default('dev_only_change_me_please_32_chars_minimum'),
})

export const env = EnvSchema.parse(process.env)

