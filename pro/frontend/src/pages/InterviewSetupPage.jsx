import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as profileApi from '../api/profile'
import * as interviewApi from '../api/interview'
import Button from '../components/Button'

const MOCK_RESUMES = [
  { id: 1, title: '백엔드 개발자 이력서' },
  { id: 2, title: '프론트엔드 개발자 이력서' },
]
const MOCK_COVER_LETTERS = [
  { id: 1, title: '카카오 지원 자기소개서' },
  { id: 2, title: '네이버 지원 자기소개서' },
]
const MOCK_JOB_POSTINGS = [
  { id: 1, company: '카카오', position: '백엔드 개발자' },
  { id: 2, company: '네이버', position: '프론트엔드 개발자' },
  { id: 3, company: '라인', position: '풀스택 개발자' },
]

function InterviewSetupPage() {
  const [resumes, setResumes] = useState([])
  const [coverLetters, setCoverLetters] = useState([])
  const [jobPostings, setJobPostings] = useState([])
  const [selected, setSelected] = useState({ resumeId: '', coverLetterId: '', jobPostingId: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([profileApi.getResumes(), profileApi.getCoverLetters(), profileApi.getJobPostings()])
      .then(([r, c, j]) => {
        setResumes(r.data.data?.length ? r.data.data : MOCK_RESUMES)
        setCoverLetters(c.data.data?.length ? c.data.data : MOCK_COVER_LETTERS)
        setJobPostings(j.data.data?.length ? j.data.data : MOCK_JOB_POSTINGS)
      })
      .catch(() => {
        setResumes(MOCK_RESUMES)
        setCoverLetters(MOCK_COVER_LETTERS)
        setJobPostings(MOCK_JOB_POSTINGS)
      })
  }, [])

  const handleStart = async () => {
    if (!selected.resumeId || !selected.coverLetterId || !selected.jobPostingId) {
      alert('이력서, 자기소개서, 채용공고를 모두 선택해주세요.')
      return
    }
    setLoading(true)
    try {
      const { data } = await interviewApi.startSession(selected)
      navigate('/interview/session', { state: { sessionId: data.data.id } })
    } catch {
      alert('면접 세션 시작에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const selectStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '14px', background: '#fff', color: '#111',
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>면접 시작하기</h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>AI 면접관이 이력서와 채용공고를 분석해 맞춤 질문을 드립니다.</p>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>이력서 선택</label>
          <select style={selectStyle} value={selected.resumeId} onChange={(e) => setSelected({ ...selected, resumeId: e.target.value })}>
            <option value="">-- 이력서를 선택하세요 --</option>
            {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>자기소개서 선택</label>
          <select style={selectStyle} value={selected.coverLetterId} onChange={(e) => setSelected({ ...selected, coverLetterId: e.target.value })}>
            <option value="">-- 자기소개서를 선택하세요 --</option>
            {coverLetters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>채용공고 선택</label>
          <select style={selectStyle} value={selected.jobPostingId} onChange={(e) => setSelected({ ...selected, jobPostingId: e.target.value })}>
            <option value="">-- 채용공고를 선택하세요 --</option>
            {jobPostings.map((j) => <option key={j.id} value={j.id}>{j.company} - {j.position}</option>)}
          </select>
        </div>

        <Button fullWidth loading={loading} onClick={handleStart}>면접 시작</Button>
      </div>
    </div>
  )
}

export default InterviewSetupPage
