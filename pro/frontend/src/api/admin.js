import api from './axios'

export const getDashboard = () =>
  api.get('/api/admin/dashboard')
