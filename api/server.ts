/**
 * local server entry file, for local development
 */
import app from './app.js';
import { env } from './shared/env.js'
import { processDueScheduledPosts } from './modules/scheduling/scheduler.service.js'

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

if (env.SCHEDULER_ENABLED && process.env.NODE_ENV !== 'test') {
  const pollMs = Math.max(5_000, env.SCHEDULER_POLL_MS)
  const batchSize = Math.max(1, Math.min(20, env.SCHEDULER_BATCH_SIZE))
  let running = false

  setInterval(() => {
    if (running) return
    running = true
    void processDueScheduledPosts({ limit: batchSize }).finally(() => {
      running = false
    })
  }, pollMs)
}

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
