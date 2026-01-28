import { useAuthStore } from '@/stores/authStore'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

  const text = await resp.text()
  const data = text ? (JSON.parse(text) as unknown) : null

  if (!resp.ok) {
    const maybeObj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null
    const message = typeof maybeObj?.error === 'string' ? maybeObj.error : `HTTP ${resp.status}`
    throw new Error(message)
  }
  return data as T
}

