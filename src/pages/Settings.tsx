import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'

type AiSettings = {
  ai_default_post_context: string | null
  ai_default_image_context: string | null
}

export default function Settings() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [context, setContext] = useState('')
  const [imageContext, setImageContext] = useState('')

  useEffect(() => {
    if (!accessToken) navigate('/', { replace: true })
  }, [accessToken, navigate])

  async function load() {
    setLoading(true)
    setError(null)
    setSaved(null)
    try {
      const resp = await apiFetch<{ ok: true; settings: AiSettings }>('/api/ai/settings')
      setContext(resp.settings.ai_default_post_context ?? '')
      setImageContext(resp.settings.ai_default_image_context ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setLoading(true)
    setError(null)
    setSaved(null)
    try {
      await apiFetch('/api/ai/settings', {
        method: 'PUT',
        body: JSON.stringify({
          aiDefaultPostContext: context.trim() ? context : null,
          aiDefaultImageContext: imageContext.trim() ? imageContext : null,
        }),
      })
      setSaved('Salvo')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Configurações</h1>
            <p className="text-xs text-zinc-400">Contexto padrão para geração de post</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900"
          >
            Voltar
          </button>
        </div>

        {error ? <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div> : null}
        {saved ? <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">{saved}</div> : null}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={14}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-600"
            placeholder="Cole aqui seu contexto padrão (tom, estrutura, público, regras, exemplos...)"
          />

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-xs text-zinc-400">{context.length.toLocaleString()} / 20.000</div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void save()}
              className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="mb-2 text-xs text-zinc-400">Contexto padrão de imagem (estilo/diretrizes)</div>
          <textarea
            value={imageContext}
            onChange={(e) => setImageContext(e.target.value)}
            rows={10}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-600"
            placeholder="Ex.: estilo minimalista, paleta, fotografia/ilustração, sem texto, sem pessoas, foco em ícones/objetos abstratos..."
          />

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-xs text-zinc-400">{imageContext.length.toLocaleString()} / 20.000</div>
            <button
              type="button"
              disabled={loading}
              onClick={() => void save()}
              className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

