import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  useEffect(() => {
    const token = params.get('access_token')
    if (token) {
      setAccessToken(token)
      navigate('/dashboard', { replace: true })
      return
    }
    navigate('/', { replace: true })
  }, [navigate, params, setAccessToken])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
        <div className="h-3 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="h-3 w-64 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  )
}

