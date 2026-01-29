import { claimDueScheduledPosts, updatePost } from '../content-management/posts.repo.js'
import { publishPost } from '../content-management/publish.service.js'

export async function processDueScheduledPosts(params?: {
  limit?: number
}): Promise<{ processed: number; published: number; failed: number }> {
  const limit = Math.max(1, Math.min(20, params?.limit ?? 5))
  const claimed = await claimDueScheduledPosts({ limit })

  let published = 0
  let failed = 0

  for (const item of claimed) {
    try {
      await publishPost({ userId: item.user_id, postId: item.id })
      published += 1
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao publicar'
      const attempts = item.publish_attempts
      const shouldFail = attempts >= 5
      const delaySeconds = Math.min(60 * 60, 60 * 5 * attempts)
      const scheduledAt = shouldFail ? null : new Date(Date.now() + delaySeconds * 1000)

      await updatePost({
        id: item.id,
        userId: item.user_id,
        status: shouldFail ? 'failed' : 'scheduled',
        scheduledAt,
        publishLastError: message.slice(0, 2000),
        publishLockedAt: null,
      })

      failed += 1
    }
  }

  return { processed: claimed.length, published, failed }
}
