import api from './axios'

export const getBooks = (keyword = '', page = 0) =>
  api.get('/api/books', { params: { keyword, page } })

export const getBook = (id) =>
  api.get(`/api/books/${id}`)

export const getCart = () =>
  api.get('/api/cart')

export const addToCart = (bookId, quantity = 1) =>
  api.post('/api/cart', { bookId, quantity })

export const updateCart = (bookId, quantity) =>
  api.put(`/api/cart/${bookId}`, { quantity })

export const removeFromCart = (bookId) =>
  api.delete(`/api/cart/${bookId}`)

export const createOrder = (body) =>
  api.post('/api/orders', body)

export const getOrders = () =>
  api.get('/api/orders')

export const getOrder = (id) =>
  api.get(`/api/orders/${id}`)
