import { create } from 'zustand'
import * as authApi from '../api/auth'

const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password)
    const { accessToken, refreshToken } = data.data
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ accessToken })
    const { data: meData } = await authApi.getMe()
    set({ user: meData.data })
  },

  logout: async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null })
  },

  fetchMe: async () => {
    const { data } = await authApi.getMe()
    set({ user: data.data })
  },
}))

export default useAuthStore
