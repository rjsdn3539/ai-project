import api from './axios'

export const generateProblems = (body) =>
  api.post('/api/learning/generate', body)

export const submitAttempt = (body) =>
  api.post('/api/learning/attempts', body)

export const getLearningStats = () =>
  api.get('/api/learning/stats')

export const getLearningOverview = () =>
  api.get('/api/learning/overview')

export const getLearningDashboardSummary = () =>
  api.get('/api/learning/dashboard-summary')

export const listLearningProgress = () =>
  api.get('/api/learning/progress')

export const getLearningProgress = (subject, difficulty) =>
  api.get('/api/learning/progress/detail', { params: { subject, difficulty } })

export const saveLearningProgress = (body) =>
  api.put('/api/learning/progress', body)

export const deleteLearningProgress = (subject, difficulty) =>
  api.delete('/api/learning/progress', { params: { subject, difficulty } })

export const saveLearningPreferences = (body) =>
  api.put('/api/learning/preferences', body)

export const submitLearningSessionResult = (body) =>
  api.post('/api/learning/session-results', body)

export const generatePlacementProblems = (count = 20) =>
  api.post('/api/learning/placement/generate', { count })

export const getHint = (body) =>
  api.post('/api/learning/hint', body)

export const listWrongNotes = () =>
  api.get('/api/learning/wrong-notes')

export const createWrongNote = (body) =>
  api.post('/api/learning/wrong-notes', body)

export const deleteWrongNote = (noteId) =>
  api.delete(`/api/learning/wrong-notes/${noteId}`)

export const clearWrongNotes = () =>
  api.delete('/api/learning/wrong-notes')

export const getAchievementState = () =>
  api.get('/api/learning/achievement-state')

export const saveAchievementState = (stats) =>
  api.put('/api/learning/achievement-state', { stats })

export const addInterviewBookmark = (body) =>
  api.post('/api/learning/bookmarks', body)

export const deleteInterviewBookmark = (bookmarkKey) =>
  api.delete(`/api/learning/bookmarks/${encodeURIComponent(bookmarkKey)}`)
