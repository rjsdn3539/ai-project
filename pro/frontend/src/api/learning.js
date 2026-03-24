import api from './axios'

export const generateProblems = (body) =>
  api.post('/api/learning/generate', body)

export const submitAttempt = (body) =>
  api.post('/api/learning/attempts', body)

