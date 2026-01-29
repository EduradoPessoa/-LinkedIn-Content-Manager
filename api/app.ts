import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { errorToHttpResponse } from './shared/errors.js'
import { healthRouter } from './shared/health.js'
import { authRouter } from './modules/auth/auth.router.js'
import { postsRouter } from './modules/content-management/posts.router.js'
import { scheduleRouter } from './modules/scheduling/schedule.router.js'
import { schedulerRouter } from './modules/scheduling/scheduler.router.js'
import { aiRouter } from './modules/ai-services/ai.router.js'
import { analyticsRouter } from './modules/analytics/analytics.router.js'
import { linkedInRouter } from './modules/linkedin-integration/linkedin.router.js'

const app: express.Application = express()

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)

app.use(helmet())
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/health', healthRouter)
app.use('/auth', authRouter)
app.use('/api/auth', authRouter)
app.use('/api/posts', postsRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/scheduler', schedulerRouter)
app.use('/api/ai', aiRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/linkedin', linkedInRouter)

app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: 'API not found',
  })
})

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  void _next
  const response = errorToHttpResponse(error)
  res.status(response.status).json(response.body)
})

export default app
