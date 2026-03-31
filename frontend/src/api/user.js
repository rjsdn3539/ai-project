import api from './axios'

export const getWidgetConfig = () => api.get('/api/v1/users/me/widgets')
export const saveWidgetConfig = (config) => api.patch('/api/v1/users/me/widgets', { config })
