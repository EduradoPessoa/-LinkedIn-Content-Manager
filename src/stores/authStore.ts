import { create } from 'zustand'

type AuthState = {
  accessToken: string | null
  setAccessToken: (token: string | null) => void
  hydrate: () => void
  logoutLocal: () => void
}

const STORAGE_KEY = 'lcm_access_token'

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => {
    set({ accessToken: token })
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  },
  hydrate: () => {
    const token = localStorage.getItem(STORAGE_KEY)
    set({ accessToken: token })
  },
  logoutLocal: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ accessToken: null })
  },
}))

