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

// 응답 인터셉터: 401 → 토큰 갱신 시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post('http://localhost:8080/api/auth/refresh', { refreshToken })
        const newToken = data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
