import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Linkedin, Loader2 } from 'lucide-react'
import { apiFetch } from '@/api/http'
import { useAuthStore } from '@/stores/authStore'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)

  async function startLinkedInLogin() {
    setLoading(true)
    try {
      const resp = await apiFetch<{ ok: true; url: string }>('/auth/linkedin')
      window.location.href = resp.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">LinkedIn Content Manager</h1>
          <p className="text-sm text-zinc-300">
            Base inicial: OAuth do LinkedIn + JWT, PostgreSQL local com migrations e API REST.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={startLinkedInLogin}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4" />}
              Entrar com LinkedIn
            </button>

            {accessToken ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
              >
                Ir para Dashboard
              </button>
            ) : null}
          </div>

          <div className="mt-6 text-xs text-zinc-400">
            Configure `.env` baseado em `.env.example` (principalmente LinkedIn + JWT/ENCRYPTION).
          </div>
        </div>
      </div>
    </div>
  )
}

