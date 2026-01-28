import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, LogOut, Plus, RefreshCcw } from 'lucide-react'
import { apiFetch } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'

type Post = {
  id: string
  content: string
  status: 'draft' | 'scheduled' | 'published'
  created_at: string
  scheduled_at: string | null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const logoutLocal = useAuthStore((s) => s.logoutLocal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [content, setContent] = useState('')

  const scheduledCount = useMemo(() => posts.filter((p) => p.status === 'scheduled').length, [posts])

  useEffect(() => {
    if (!accessToken) navigate('/', { replace: true })
  }, [accessToken, navigate])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const h = await apiFetch<{ ok: true; status: string }>('/api/health')
      setHealth(h.status)
      const list = await apiFetch<{ ok: true; posts: Post[] }>('/api/posts')
      setPosts(list.posts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  async function create() {
    if (!content.trim()) return
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      })
      setContent('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar post')
    } finally {
      setLoading(false)
    }
  }

  async function refreshToken() {
    setLoading(true)
    setError(null)
    try {
      const resp = await apiFetch<{ ok: true; accessToken: string }>('/auth/refresh', { method: 'POST' })
      useAuthStore.getState().setAccessToken(resp.accessToken)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao renovar token')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
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
  }, [])

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
              onClick={refreshToken}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-60"
            >
              <CalendarClock className="h-4 w-4" />
              Refresh JWT
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">Novo post</h2>
              <div className="text-xs text-zinc-400">Agendados: {scheduledCount}</div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-600"
              placeholder="Escreva seu post..."
            />
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
            <div className="h-[360px] overflow-auto pr-2">
              {posts.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-300">
                  Nenhum post ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((p) => (
                    <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs text-zinc-400">{new Date(p.created_at).toLocaleString()}</div>
                        <div className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200">
                          {p.status}
                        </div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">{p.content}</div>
                      {p.scheduled_at ? (
                        <div className="mt-2 text-xs text-zinc-400">
                          Agendado para: {new Date(p.scheduled_at).toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

