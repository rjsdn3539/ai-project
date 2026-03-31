import api from './axios'

export const startSession = (body) =>
  api.post('/api/v1/interviews/sessions', body)

export const getSessions = () =>
  api.get('/api/v1/interviews/sessions')

export const getSession = (id) =>
  api.get(`/api/v1/interviews/sessions/${id}`)

export const submitAnswer = (id, body) =>
  api.post(`/api/v1/interviews/sessions/${id}/answers`, body)

export const endSession = (id) =>
  api.post(`/api/v1/interviews/sessions/${id}/end`)

export const getFeedback = (id) =>
  api.get(`/api/v1/interviews/sessions/${id}/report`)
