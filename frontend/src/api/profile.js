import api from './axios'

export const getResumes = () => api.get('/api/v1/profiles/resumes')
export const getCoverLetters = () => api.get('/api/v1/profiles/cover-letters')
export const getJobPostings = () => api.get('/api/v1/profiles/job-postings')

export const createResume = (body) => api.post('/api/v1/profiles/resumes', body)
export const createCoverLetter = (body) => api.post('/api/v1/profiles/cover-letters', body)
export const createJobPosting = (body) => api.post('/api/v1/profiles/job-postings', body)
export const uploadResume = (formData) => api.post('/api/v1/profiles/resumes/upload', formData)
export const uploadCoverLetter = (formData) => api.post('/api/v1/profiles/cover-letters/upload', formData)

export const updateResume = (id, body) => api.put(`/api/v1/profiles/resumes/${id}`, body)
export const deleteResume = (id) => api.delete(`/api/v1/profiles/resumes/${id}`)

export const updateCoverLetter = (id, body) => api.put(`/api/v1/profiles/cover-letters/${id}`, body)
export const deleteCoverLetter = (id) => api.delete(`/api/v1/profiles/cover-letters/${id}`)

export const updateJobPosting = (id, body) => api.put(`/api/v1/profiles/job-postings/${id}`, body)
export const deleteJobPosting = (id) => api.delete(`/api/v1/profiles/job-postings/${id}`)

export const parseJobPosting = ({ url, content }) => api.post('/api/v1/profiles/job-postings/parse-url', { url, content })
