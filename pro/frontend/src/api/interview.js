import api from './axios'

export const startSession = (body) =>
  api.post('/api/interviews/sessions', body)

export const getSessions = () =>
  api.get('/api/interviews/sessions')

export const getSession = (id) =>
  api.get(`/api/interviews/sessions/${id}`)

export const submitAnswer = (id, formData) =>
  api.post(`/api/interviews/sessions/${id}/answer`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const submitTextAnswer = (id, answerText) =>
  api.post(`/api/interviews/sessions/${id}/answer/text`, { answerText })

export const endSession = (id) =>
  api.post(`/api/interviews/sessions/${id}/end`)

export const getFeedback = (id) =>
  api.get(`/api/interviews/sessions/${id}/feedback`)
