export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'

export type LinkedInAuthorType = 'person' | 'organization'

export type Post = {
  id: string
  content: string
  status: PostStatus
  created_at: string
  scheduled_at: string | null
  published_at?: string | null
  linkedin_post_urn?: string | null
  linkedin_author_type?: LinkedInAuthorType
  linkedin_author_urn?: string | null
  cover_image_data_url?: string | null
  ai_post_context?: string | null
  ai_image_context?: string | null
  ai_image_prompt?: string | null
  publish_attempts?: number
  publish_last_error?: string | null
}

