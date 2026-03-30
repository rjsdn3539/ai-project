import api from './axios'

export const createInquiry = (payload) =>
  api.post('/api/v1/inquiries', payload)

export const getMyInquiries = (page = 0, size = 5, status = '') =>
  api.get('/api/v1/inquiries/me', { params: { page, size, status: status || undefined } })
