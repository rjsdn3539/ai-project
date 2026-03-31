import { create } from 'zustand'
import * as authApi from '../api/auth'
import {
  AUTH_CLEARED_EVENT,
  dispatchAuthChanged,
  dispatchAuthCleared,
} from '../utils/userScopedStorage'

const savedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
})()

const useAuthStore = create((set) => {
  // axios 인터셉터가 토큰을 강제 삭제할 때 Zustand 상태도 동기화
  window.addEventListener(AUTH_CLEARED_EVENT, () => {
    set({ user: null, accessToken: null })
  })

  return {
  user: savedUser,
  accessToken: localStorage.getItem('accessToken') || null,

  login: async (email, password) => {
    const { data } = await authApi.login(email, password)
    const { accessToken, refreshToken, userId, name, email: userEmail, role, subscriptionTier } = data.data
    const user = { id: userId, name, email: userEmail, role, subscriptionTier }
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, accessToken })
    dispatchAuthChanged(user)
  },

  updateName: (name) => {
    set((state) => {
      const user = { ...state.user, name }
      localStorage.setItem('user', JSON.stringify(user))
      dispatchAuthChanged(user)
      return { user }
    })
  },

  updateSubscriptionTier: (subscriptionTier) => {
    set((state) => {
      const user = { ...state.user, subscriptionTier }
      localStorage.setItem('user', JSON.stringify(user))
      dispatchAuthChanged(user)
      return { user }
    })
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { await authApi.logout(refreshToken) } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ user: null, accessToken: null })
    dispatchAuthCleared()
  },
  }
})

export default useAuthStore
