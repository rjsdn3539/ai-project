import api from './axios'

export const createOrder = (body) => api.post('/api/v1/orders', body)
