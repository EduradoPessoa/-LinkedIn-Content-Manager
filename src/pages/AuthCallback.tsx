import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const error = params.get('error')
  const errorDescription = params.get('error_description')

  useEffect(() => {
    const token = params.get('access_token')
    if (token) {
      setAccessToken(token)
      navigate('/dashboard', { replace: true })
      return
    }
    if (params.get('error')) return
    navigate('/', { replace: true })
  }, [navigate, params, setAccessToken])

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Falha no login do LinkedIn</h1>
            <p className="text-sm text-zinc-300">
              O LinkedIn retornou um erro no callback de autenticação.
            </p>
          </div>

          <div className="rounded-xl border border-red-900/40 bg-red-950/40 p-6 text-sm">
            <div className="font-medium">{error}</div>
            {errorDescription ? <div className="mt-2 break-words text-zinc-200/90">{errorDescription}</div> : null}

            <div className="mt-4 text-xs text-zinc-300/90">
              Dica: se o erro for <span className="font-mono">unauthorized_scope_error</span>, ajuste
              <span className="font-mono"> LINKEDIN_SCOPES</span> no seu <span className="font-mono">.env</span>{' '}
              (ex.: <span className="font-mono">openid profile</span>) ou habilite o produto/permissões no LinkedIn Developer.
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
        <div className="h-3 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-64 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  )
}

