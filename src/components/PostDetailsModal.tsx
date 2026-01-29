import { ExternalLink, X } from 'lucide-react'
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

export function PostDetailsModal(props: {
  post: Post
  loading: boolean
  publishing: boolean
  deleting: boolean
  scheduleValue: string
  onScheduleValueChange: (next: string) => void
  onClose: () => void
  onPublishNow: () => void
  onSchedule: () => void
  onCancelSchedule: () => void
  onDelete: () => void
}): JSX.Element {
  const liUrl = getLinkedInPostUrl(props.post.linkedin_post_urn)
  const canPublish = props.post.status === 'draft' || props.post.status === 'failed'
  const canSchedule = props.post.status === 'draft' || props.post.status === 'failed'
  const canCancel = props.post.status === 'scheduled'
  const canDelete = props.post.status !== 'published' && props.post.status !== 'publishing'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(props.post.status)}`}>
              {statusLabel(props.post.status)}
            </div>
            <div className="text-sm font-medium">Detalhes do post</div>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-md border border-zinc-800 bg-zinc-950/30 p-2 text-zinc-200 transition hover:bg-zinc-900"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-5">
          {props.post.cover_image_data_url ? (
            <img
              src={props.post.cover_image_data_url}
              alt="Capa"
              className="h-56 w-full rounded-xl border border-zinc-800 object-cover"
            />
          ) : null}

          <div className="mt-4 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-100">
            {props.post.content}
          </div>

          {props.post.publish_last_error ? (
            <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">
              Falha ao publicar: {props.post.publish_last_error}
            </div>
          ) : null}

          <div className="mt-4 grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 text-xs text-zinc-300 sm:grid-cols-2">
            <div>Criado em: {formatDateTime(props.post.created_at)}</div>
            <div>Publicado em: {formatDateTime(props.post.published_at)}</div>
            <div className="sm:col-span-2">Agendado para: {formatDateTime(props.post.scheduled_at)}</div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {liUrl ? (
                <a
                  href={liUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver no LinkedIn
                </a>
              ) : (
                <div className="rounded-md border border-zinc-800 bg-zinc-950/20 px-3 py-2 text-xs text-zinc-500">
                  Sem link do LinkedIn
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canPublish ? (
                <button
                  type="button"
                  disabled={props.loading || props.publishing}
                  onClick={props.onPublishNow}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {props.publishing ? 'Publicando...' : 'Publicar agora'}
                </button>
              ) : null}

              {canSchedule ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="datetime-local"
                    value={props.scheduleValue}
                    onChange={(e) => props.onScheduleValueChange(e.target.value)}
                    className="rounded-md border border-zinc-800 bg-zinc-950/40 px-2 py-2 text-xs text-zinc-100"
                  />
                  <button
                    type="button"
                    disabled={props.loading || !props.scheduleValue}
                    onClick={props.onSchedule}
                    className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
                  >
                    Agendar
                  </button>
                </div>
              ) : null}

              {canCancel ? (
                <button
                  type="button"
                  disabled={props.loading}
                  onClick={props.onCancelSchedule}
                  className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
                >
                  Cancelar agendamento
                </button>
              ) : null}

              {canDelete ? (
                <button
                  type="button"
                  disabled={props.loading || props.deleting}
                  onClick={props.onDelete}
                  className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-950/50 disabled:opacity-60"
                >
                  {props.deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

