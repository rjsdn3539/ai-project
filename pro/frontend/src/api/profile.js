import api from './axios'

export const getResumes = () => api.get('/api/profile/resumes')
export const getCoverLetters = () => api.get('/api/profile/cover-letters')
export const getJobPostings = () => api.get('/api/profile/job-postings')
