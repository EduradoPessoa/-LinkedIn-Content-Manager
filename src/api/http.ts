import { useAuthStore } from '@/stores/authStore'

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      const resp = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      const text = await resp.text().catch(() => '')
      if (!resp.ok) return null
      const parsed = text ? (JSON.parse(text) as unknown) : null
      if (!parsed || typeof parsed !== 'object') return null
      const token = (parsed as Record<string, unknown>).accessToken
      return typeof token === 'string' ? token : null
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetchInternal<T>(path, init, false)
}

async function apiFetchInternal<T>(path: string, init: RequestInit | undefined, hasRetried: boolean): Promise<T> {
  const token = useAuthStore.getState().accessToken

  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const resp = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (resp.status === 401 && !hasRetried && path !== '/api/auth/refresh') {
    const newToken = await refreshAccessToken()
    if (newToken) {
      useAuthStore.getState().setAccessToken(newToken)
      return apiFetchInternal<T>(path, init, true)
    }
    useAuthStore.getState().logoutLocal()
  }

  const text = await resp.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = null
    }
  }

  if (!resp.ok) {
    const maybeObj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null
    const message = typeof maybeObj?.error === 'string' ? maybeObj.error : (text || `HTTP ${resp.status}`)

    const code = typeof maybeObj?.code === 'string' ? maybeObj.code : null
    const details = maybeObj?.details
    const detailsText = (() => {
      if (details === undefined || details === null) return null
      if (typeof details === 'string') return details.slice(0, 800)
      try {
        return JSON.stringify(details).slice(0, 800)
      } catch {
        return null
      }
    })()

    const suffix = [code ? `code=${code}` : null, detailsText ? `details=${detailsText}` : null].filter(Boolean).join(' | ')
    throw new Error(suffix ? `${message} (${suffix})` : message)
  }
  return data as T
}

