import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Plus, RefreshCcw } from 'lucide-react'
import { apiFetch } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'
import type { Post } from '@/types/post'
import { PostCard } from '@/components/PostCard'
import { PostDetailsModal } from '@/components/PostDetailsModal'

export default function Dashboard() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const logoutLocal = useAuthStore((s) => s.logoutLocal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [health, setHealth] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')
  const [coverImageDataUrl, setCoverImageDataUrl] = useState<string | null>(null)
  const [aiPostContext, setAiPostContext] = useState('')
  const [aiImageContext, setAiImageContext] = useState('')
  const [aiImagePrompt, setAiImagePrompt] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [scheduleInput, setScheduleInput] = useState<Record<string, string>>({})
  const [detailsPostId, setDetailsPostId] = useState<string | null>(null)

  const [aiBusy, setAiBusy] = useState<'post' | 'image' | null>(null)

  const scheduledCount = useMemo(() => posts.filter((p) => p.status === 'scheduled').length, [posts])
  const detailsPost = useMemo(() => posts.find((p) => p.id === detailsPostId) ?? null, [detailsPostId, posts])

  useEffect(() => {
    if (!accessToken) navigate('/', { replace: true })
  }, [accessToken, navigate])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const h = await apiFetch<{ ok: true; status: string }>('/api/health')
      setHealth(h.status)
      const list = await apiFetch<{ ok: true; posts: Post[] }>('/api/posts')
      setPosts(list.posts)

      const settings = await apiFetch<{
        ok: true
        settings: { ai_default_post_context: string | null; ai_default_image_context: string | null }
      }>('/api/ai/settings')
      setAiPostContext(settings.settings.ai_default_post_context ?? '')
      setAiImageContext(settings.settings.ai_default_image_context ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  async function create() {
    if (!content.trim()) return
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          coverImageDataUrl,
          aiPostContext: aiPostContext.trim() ? aiPostContext.trim() : null,
          aiImageContext: aiImageContext.trim() ? aiImageContext.trim() : null,
          aiImagePrompt,
        }),
      })
      setContent('')
      setCoverImageDataUrl(null)
      setAiImagePrompt(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar post')
    } finally {
      setLoading(false)
    }
  }

  async function generatePostWithAi() {
    if (!aiPostContext.trim()) {
      setError('Preencha o contexto do post para gerar com IA')
      return
    }
    setAiBusy('post')
    setError(null)
    setNotice(null)
    try {
      const resp = await apiFetch<{ ok: true; output: string }>('/api/ai/generate-post', {
        method: 'POST',
        body: JSON.stringify({ context: aiPostContext.trim(), currentDraft: content.trim(), provider: 'gemini' }),
      })
      setContent(resp.output)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar post com IA')
    } finally {
      setAiBusy(null)
    }
  }

  async function generateImageWithAi() {
    if (!content.trim()) {
      setError('Gere ou escreva o texto do post antes de gerar a imagem')
      return
    }
    setAiBusy('image')
    setError(null)
    setNotice(null)
    try {
      const resp = await apiFetch<{ ok: true; imageDataUrl: string; imagePrompt: string }>(
        '/api/ai/generate-image',
        {
          method: 'POST',
          body: JSON.stringify({ postText: content.trim(), context: aiImageContext.trim() || undefined }),
        },
      )
      setCoverImageDataUrl(resp.imageDataUrl)
      setAiImagePrompt(resp.imagePrompt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar imagem com IA')
    } finally {
      setAiBusy(null)
    }
  }

  async function publishNow(postId: string) {
    setPublishingId(postId)
    setError(null)
    setNotice(null)
    try {
      const resp = await apiFetch<{ ok: true; post: Post; warning?: string }>(`/api/posts/${postId}/publish`, {
        method: 'POST',
      })
      if (resp.warning) setNotice(resp.warning)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao publicar')
    } finally {
      setPublishingId(null)
    }
  }

  async function schedulePost(postId: string) {
    const value = scheduleInput[postId]
    if (!value) {
      setError('Selecione data e hora para agendar')
      return
    }
    const iso = new Date(value).toISOString()
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await apiFetch('/api/schedule', {
        method: 'POST',
        body: JSON.stringify({ postId, scheduledAt: iso }),
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao agendar')
    } finally {
      setLoading(false)
    }
  }

  async function cancelSchedule(postId: string) {
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await apiFetch(`/api/schedule/${postId}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao cancelar agendamento')
    } finally {
      setLoading(false)
    }
  }

  async function deletePost(postId: string) {
    if (!window.confirm('Excluir este post?')) return
    setDeletingId(postId)
    setError(null)
    setNotice(null)
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir')
    } finally {
      setDeletingId(null)
    }
  }

  function openDetails(postId: string) {
    setDetailsPostId(postId)
    setScheduleInput((prev) => {
      if (prev[postId] !== undefined) return prev
      const post = posts.find((p) => p.id === postId)
      if (!post?.scheduled_at) return prev
      const d = new Date(post.scheduled_at)
      if (Number.isNaN(d.getTime())) return prev
      const localValue = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(
        d.getHours(),
      ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      return { ...prev, [postId]: localValue }
    })
  }

  async function onPickCover(file: File | null) {
    setError(null)
    if (!file) {
      setCoverImageDataUrl(null)
      return
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('A capa deve ser PNG ou JPEG')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 4MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      if (!result) {
        setError('Falha ao ler imagem')
        return
      }
      setCoverImageDataUrl(result)
      setAiImagePrompt(null)
    }
    reader.onerror = () => setError('Falha ao ler imagem')
    reader.readAsDataURL(file)
  }

  async function logout() {
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      void 0
    } finally {
      logoutLocal()
      navigate('/', { replace: true })
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-zinc-400">Health: {health ?? '...'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
            >
              Configurações
            </button>
            <button
              type="button"
              onClick={logout}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        {notice ? (
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">Novo post</h2>
              <div className="text-xs text-zinc-400">Agendados: {scheduledCount}</div>
            </div>



            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading || aiBusy !== null || !aiPostContext.trim()}
                onClick={() => void generatePostWithAi()}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
              >
                {aiBusy === 'post' ? 'Gerando post...' : 'Gerar post (IA)'}
              </button>
              <button
                type="button"
                disabled={loading || aiBusy !== null || !content.trim()}
                onClick={() => void generateImageWithAi()}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
              >
                {aiBusy === 'image' ? 'Gerando imagem...' : 'Gerar imagem (IA)'}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-600"
              placeholder="Escreva seu post..."
            />


            {aiImagePrompt ? (
              <div className="mt-2 text-xs text-zinc-400">Prompt da imagem (gerado): {aiImagePrompt}</div>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="text-xs text-zinc-300">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onClick={(e) => {
                    ;(e.currentTarget as HTMLInputElement).value = ''
                  }}
                  onChange={(e) => void onPickCover(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-zinc-200 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
                />
              </label>
              {coverImageDataUrl ? (
                <button
                  type="button"
                  onClick={() => setCoverImageDataUrl(null)}
                  className="rounded-md border border-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
                >
                  Remover capa
                </button>
              ) : null}
            </div>

            {coverImageDataUrl ? (
              <div className="mt-3">
                <div className="text-xs text-zinc-400">Preview da capa</div>
                <img
                  src={coverImageDataUrl}
                  alt="Capa"
                  className="mt-2 max-h-40 w-full rounded-lg border border-zinc-800 object-contain"
                />
              </div>
            ) : null}
            <button
              type="button"
              disabled={loading || !content.trim()}
              onClick={create}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Criar
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="mb-3 text-sm font-medium">Posts</h2>
            {posts.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-300">
                Nenhum post ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} onDetails={() => openDetails(p.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailsPost ? (
        <PostDetailsModal
          post={detailsPost}
          loading={loading}
          publishing={publishingId === detailsPost.id}
          deleting={deletingId === detailsPost.id}
          scheduleValue={scheduleInput[detailsPost.id] ?? ''}
          onScheduleValueChange={(next) => setScheduleInput((prev) => ({ ...prev, [detailsPost.id]: next }))}
          onClose={() => setDetailsPostId(null)}
          onPublishNow={() => void publishNow(detailsPost.id)}
          onSchedule={() => void schedulePost(detailsPost.id)}
          onCancelSchedule={() => void cancelSchedule(detailsPost.id)}
          onDelete={() => void deletePost(detailsPost.id)}
        />
      ) : null}
    </div>
  )
}

