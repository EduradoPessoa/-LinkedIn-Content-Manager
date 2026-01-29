import { ExternalLink, ImageOff } from 'lucide-react'
import type { Post } from '@/types/post'
import { getLinkedInPostUrl } from '@/utils/linkedin'

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function statusLabel(status: Post['status']): string {
  if (status === 'draft') return 'Draft'
  if (status === 'scheduled') return 'Agendado'
  if (status === 'publishing') return 'Publicando'
  if (status === 'published') return 'Publicado'
  return 'Falhou'
}

function statusClass(status: Post['status']): string {
  if (status === 'published') return 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
  if (status === 'draft') return 'border-zinc-700 bg-zinc-900/60 text-zinc-200'
  if (status === 'scheduled') return 'border-amber-900/60 bg-amber-950/40 text-amber-200'
  if (status === 'publishing') return 'border-sky-900/60 bg-sky-950/40 text-sky-200'
  return 'border-red-900/60 bg-red-950/40 text-red-200'
}

export function PostCard(props: {
  post: Post
  onDetails: () => void
}): JSX.Element {
  const { post } = props
  const liUrl = getLinkedInPostUrl(post.linkedin_post_urn)
  const publishedAt = post.published_at ?? null

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 shadow-sm transition hover:bg-zinc-900/55">
      <div className="relative">
        {post.cover_image_data_url ? (
          <img
            src={post.cover_image_data_url}
            alt="Capa"
            className="h-36 w-full border-b border-zinc-800 object-cover"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center gap-2 border-b border-zinc-800 bg-zinc-950/40 text-xs text-zinc-400">
            <ImageOff className="h-4 w-4" />
            Sem imagem
          </div>
        )}

        <div className={`absolute right-3 top-3 rounded-full border px-2 py-1 text-[11px] ${statusClass(post.status)}`}>
          {statusLabel(post.status)}
        </div>
      </div>

      <div className="p-4">
        <div
          className="text-sm text-zinc-100"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.content}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
          <div className="text-xs text-zinc-400">Publicado em: {formatDateTime(publishedAt)}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={props.onDetails}
              className="rounded-md bg-sky-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-sky-500"
            >
              Detalhes
            </button>

            {liUrl ? (
              <a
                href={liUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn
              </a>
            ) : (
              <div className="rounded-md border border-zinc-800 bg-zinc-950/20 px-3 py-2 text-xs text-zinc-500">
                Sem link
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

