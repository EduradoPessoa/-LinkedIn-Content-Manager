export type PostStatus = 'draft' | 'scheduled' | 'published'

export type PostRow = {
  id: string
  user_id: string
  account_id: string | null
  content: string
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

