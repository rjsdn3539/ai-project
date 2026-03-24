import api from './axios'

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/api/v1/admin/dashboard')

// ── Users ──────────────────────────────────────────────────────────────────────
export const getUsers = (page = 0, size = 10, search = '') =>
  api.get('/api/v1/admin/users', { params: { page, size, search: search || undefined } })

export const changeUserRole = (id, role) =>
  api.patch(`/api/v1/admin/users/${id}/role`, { role })

export const changeUserSubscription = (id, tier, durationMonths) =>
  api.patch(`/api/v1/admin/users/${id}/subscription`, { tier, durationMonths })

export const deleteUser = (id) =>
  api.delete(`/api/v1/admin/users/${id}`)

// ── Sessions ───────────────────────────────────────────────────────────────────
export const getSessions = (page = 0, size = 10, status = '') =>
  api.get('/api/v1/admin/sessions', { params: { page, size, status: status || undefined } })

export const deleteSession = (id) =>
  api.delete(`/api/v1/admin/sessions/${id}`)

// ── Books ──────────────────────────────────────────────────────────────────────
export const getBooks = (page = 0, size = 10, search = '') =>
  api.get('/api/v1/admin/books', { params: { page, size, search: search || undefined } })

export const createBook = (data) => api.post('/api/v1/admin/books', data)

export const updateBook = (id, data) => api.put(`/api/v1/admin/books/${id}`, data)

export const deleteBook = (id) => api.delete(`/api/v1/admin/books/${id}`)

// ── Orders (사용자) ────────────────────────────────────────────────────────────
// (admin.js에 임시 배치 — 별도 api/order.js로 분리 가능)

// ── Orders (결제 관리) ─────────────────────────────────────────────────────────
export const getAdminOrders = (page = 0, size = 10, paymentStatus = '') =>
  api.get('/api/v1/admin/orders', { params: { page, size, paymentStatus: paymentStatus || undefined } })

export const updatePaymentStatus = (id, paymentStatus) =>
  api.patch(`/api/v1/admin/orders/${id}/payment`, { paymentStatus })

// ── Deliveries (배송 관리) ──────────────────────────────────────────────────────
export const getAdminDeliveries = (page = 0, size = 10, deliveryStatus = '') =>
  api.get('/api/v1/admin/deliveries', { params: { page, size, deliveryStatus: deliveryStatus || undefined } })

export const updateDelivery = (id, deliveryStatus, trackingNumber) =>
  api.patch(`/api/v1/admin/orders/${id}/delivery`, { deliveryStatus, trackingNumber })
