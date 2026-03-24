import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
})

// 요청 인터셉터: Authorization 헤더 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// refresh 진행 중일 때 다른 요청들이 대기하도록 큐 관리
let refreshPromise = null

const clearAuth = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  window.dispatchEvent(new CustomEvent('auth:cleared'))
  const publicPaths = ['/home', '/auth/login', '/auth/register', '/books', '/subscription', '/faq']
  const isPublic = publicPaths.some(p => window.location.pathname.startsWith(p))
  if (!isPublic) {
    window.location.href = '/auth/login'
  }
}

// 응답 인터셉터: 401 → 토큰 갱신 시도 (단 한 번만 실행, 나머지는 대기)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true

      // 이미 refresh 중이면 그 Promise를 재사용
      if (!refreshPromise) {
        const refreshToken = localStorage.getItem('refreshToken')
        refreshPromise = axios
          .post('http://localhost:8080/api/v1/auth/refresh', { refreshToken })
          .then(({ data }) => {
            const newToken = data.data.accessToken
            localStorage.setItem('accessToken', newToken)
            return newToken
          })
          .catch((err) => {
            clearAuth()
            return Promise.reject(err)
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      try {
        const newToken = await refreshPromise
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
