import api from './axios'

export const getMySubscription = () => api.get('/api/v1/subscription/my')

export const upgradeSubscription = (tier, billing) =>
  api.post('/api/v1/subscription/upgrade', { tier, billing })

export const scheduleDowngrade = (tier) =>
  api.post('/api/v1/subscription/downgrade', { tier })

export const cancelDowngrade = () =>
  api.delete('/api/v1/subscription/downgrade')
