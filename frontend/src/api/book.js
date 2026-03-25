import api from './axios'

export const getBooks = (keyword = '', page = 0) =>
  keyword
    ? api.get('/api/v1/books/search', { params: { keyword, page, size: 15 } })
    : api.get('/api/v1/books', { params: { page, size: 15 } })

export const getBook = (id) =>
  api.get(`/api/v1/books/${id}`)

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
