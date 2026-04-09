import { useState, useEffect, useRef } from 'react'
import * as profileApi from '../api/profile'
import { reviewDocument } from '../api/profile'

const PRIMARY = 'var(--primary)'
const BORDER = 'var(--border)'

function SectionHeader({ title, count, onAdd }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{title}</h2>
        {count > 0 && (
          <span style={{ background: 'var(--primary-light)', color: PRIMARY, fontSize: 12, fontWeight: 700, borderRadius: 20, padding: '2px 10px' }}>
            {count}개
          </span>
        )}
      </div>
      <button
        onClick={onAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: PRIMARY, color: '#fff', border: 'none',
          borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        + 새로 추가
      </button>
    </div>
  )
}

function ReviewResult({ result, onClose }) {
  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 14, padding: '20px 22px',
      border: '1.5px solid var(--primary)', marginTop: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: PRIMARY }}>AI 첨삭 결과</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>✕</button>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, marginBottom: 16, padding: '12px 14px', background: 'var(--surface)', borderRadius: 10 }}>
        {result.overall}
      </p>

      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>강점</p>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {result.strengths.map((s, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{s}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>개선점</p>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {result.improvements.map((s, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{s}</li>
          ))}
        </ul>
      </div>

      {result.revisedSuggestions && result.revisedSuggestions.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>수정 제안</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.revisedSuggestions.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, background: 'var(--surface)', borderRadius: 8, padding: '10px 12px' }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DocCard({ title, content, sub, updatedAt, onDelete, onReview, reviewing, reviewResult, onCloseReview }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const preview = content ? content.replace(/\s+/g, ' ').trim().slice(0, 120) : ''
  const date = updatedAt ? new Date(updatedAt).toLocaleDateString('ko-KR') : ''
  const hasContent = content && content.trim().length > 0

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 16, padding: '20px 24px',
      border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 2px' }}>{title}</p>
          {sub && <p style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, margin: '0 0 6px' }}>{sub}</p>}
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            {preview ? preview + (content.length > 120 ? '…' : '') : '내용 없음'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
          {hasContent && !confirmDelete && (
            <button
              onClick={onReview}
              disabled={reviewing}
              style={{
                background: reviewing ? 'var(--bg)' : 'var(--primary-light)', border: `1.5px solid ${PRIMARY}`,
                borderRadius: 8, color: PRIMARY, padding: '5px 10px', fontSize: 12, fontWeight: 700,
                cursor: reviewing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >{reviewing ? '분석 중...' : 'AI 첨삭'}</button>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                background: 'none', border: '1.5px solid var(--border-error)', borderRadius: 8,
                color: 'var(--danger)', padding: '5px 10px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >삭제</button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={onDelete}
                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >확인</button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ background: 'none', border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}
              >취소</button>
            </div>
          )}
        </div>
      </div>
      {date && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>수정일: {date}</p>}
      {reviewResult && <ReviewResult result={reviewResult} onClose={onCloseReview} />}
    </div>
  )
}

function AddForm({ type, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mode, setMode] = useState('file') // 'file' | 'text' (resume only)
  const [file, setFile] = useState(null)
  const [focused, setFocused] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    setError('')
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (type === 'coverLetter' && !file) { setError('파일을 업로드해주세요.'); return }
    if (type === 'resume' && mode === 'file' && !file) { setError('파일을 업로드해주세요.'); return }
    if (type === 'resume' && mode === 'text' && !content.trim()) { setError('내용을 입력해주세요.'); return }
    setSaving(true)
    setError('')
    try {
      if (type === 'resume') {
        if (mode === 'text') {
          await profileApi.createResume({ title: title.trim(), content: content.slice(0, 5000) })
        } else {
          const formData = new FormData()
          formData.append('title', title.trim())
          formData.append('file', file)
          await profileApi.uploadResume(formData)
        }
      } else {
        const formData = new FormData()
        formData.append('title', title.trim())
        formData.append('companyName', '')
        formData.append('file', file)
        await profileApi.uploadCoverLetter(formData)
      }
      onSave()
    } catch {
      setError('저장에 실패했습니다. 파일 형식(.txt, .pdf, .doc, .docx)을 확인해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${focused === field ? PRIMARY : BORDER}`,
    borderRadius: 10, fontSize: 14, outline: 'none',
    background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box',
    boxShadow: focused === field ? '0 0 0 3px rgba(124,106,240,0.1)' : 'none',
    transition: 'all 0.15s', fontFamily: 'inherit',
  })

  const FileUploadArea = (
    <div>
      <input type="file" accept=".txt,.pdf,.doc,.docx" ref={fileRef} style={{ display: 'none' }} onChange={handleFile} />
      <div
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${file ? PRIMARY : BORDER}`,
          borderRadius: 12, padding: '24px 20px',
          background: file ? 'var(--primary-light)' : 'var(--bg)',
          cursor: 'pointer', textAlign: 'center',
        }}
      >
        {file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 14 }}>{file.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>클릭해서 변경</span>
          </div>
        ) : (
          <>
            <span style={{ fontSize: 32 }}>📄</span>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, margin: '8px 0 4px' }}>클릭하여 파일 업로드</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>.txt · .pdf · .doc 지원</p>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 16, padding: '24px',
      border: `1.5px dashed ${PRIMARY}`, marginBottom: 16,
    }}>
      <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 16 }}>
        {type === 'resume' ? '이력서 추가' : '자기소개서 추가'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 제목 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>제목</label>
          <input
            placeholder={type === 'resume' ? '예: 2025 상반기 이력서' : '예: 카카오 자기소개서'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setFocused('title')}
            onBlur={() => setFocused(null)}
            style={inputStyle('title')}
          />
        </div>

        {/* 자기소개서: 파일 업로드 전용 */}
        {type === 'coverLetter' ? FileUploadArea : (
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>내용 입력 방식</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[['file', '📁 파일 업로드'], ['text', '✏️ 직접 입력']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setMode(val)}
                  style={{
                    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: `1.5px solid ${mode === val ? PRIMARY : BORDER}`,
                    background: mode === val ? 'var(--primary-light)' : 'var(--surface)',
                    color: mode === val ? PRIMARY : 'var(--text-secondary)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{label}</button>
              ))}
            </div>

            {mode === 'file' ? FileUploadArea : (
              <textarea
                placeholder="이력서 내용을 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                onFocus={() => setFocused('content')}
                onBlur={() => setFocused(null)}
                rows={8}
                style={{ ...inputStyle('content'), resize: 'vertical', lineHeight: 1.7 }}
              />
            )}

            {mode === 'text' && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                {content.length} / 5000자
              </p>
            )}
          </div>
        )}

        {error && <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >취소</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: PRIMARY, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}
          >{saving ? '저장 중...' : '저장'}</button>
        </div>
      </div>
    </div>
  )
}

function ResumePage() {
  const [resumes, setResumes] = useState([])
  const [coverLetters, setCoverLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddResume, setShowAddResume] = useState(false)
  const [showAddCoverLetter, setShowAddCoverLetter] = useState(false)
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewResults, setReviewResults] = useState({}) // { "resume-{id}" | "cover-{id}": result }

  const load = async () => {
    try {
      const [rRes, cRes] = await Promise.all([profileApi.getResumes(), profileApi.getCoverLetters()])
      setResumes(rRes.data?.data ?? [])
      setCoverLetters(cRes.data?.data ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDeleteResume = async (id) => {
    await profileApi.deleteResume(id)
    setResumes((prev) => prev.filter((r) => r.id !== id))
  }

  const handleDeleteCoverLetter = async (id) => {
    await profileApi.deleteCoverLetter(id)
    setCoverLetters((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSavedResume = () => {
    setShowAddResume(false)
    load()
  }

  const handleSavedCoverLetter = () => {
    setShowAddCoverLetter(false)
    load()
  }

  const handleReview = async (id, content, docType) => {
    const key = `${docType}-${id}`
    if (reviewingId) return
    setReviewingId(key)
    try {
      const { data } = await reviewDocument(content, docType)
      setReviewResults((prev) => ({ ...prev, [key]: data.data }))
    } catch {
      alert('AI 첨삭 요청에 실패했습니다. AI 서버 연결을 확인해주세요.')
    } finally {
      setReviewingId(null)
    }
  }

  const handleCloseReview = (key) => {
    setReviewResults((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>내 문서 관리</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>이력서와 자기소개서를 저장해두면 면접 시작 시 바로 불러올 수 있어요.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>불러오는 중...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>

          {/* 이력서 */}
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '28px 28px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)' }}>
            <SectionHeader title="이력서" count={resumes.length} onAdd={() => { setShowAddResume(true); setShowAddCoverLetter(false) }} />

            {showAddResume && (
              <AddForm type="resume" onSave={handleSavedResume} onCancel={() => setShowAddResume(false)} />
            )}

            {resumes.length === 0 && !showAddResume ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
                <p style={{ fontSize: 14 }}>저장된 이력서가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {resumes.map((r) => (
                  <DocCard
                    key={r.id}
                    title={r.title}
                    content={r.content}
                    updatedAt={r.updatedAt}
                    onDelete={() => handleDeleteResume(r.id)}
                    onReview={() => handleReview(r.id, r.content, 'resume')}
                    reviewing={reviewingId === `resume-${r.id}`}
                    reviewResult={reviewResults[`resume-${r.id}`]}
                    onCloseReview={() => handleCloseReview(`resume-${r.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 자기소개서 */}
          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '28px 28px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)' }}>
            <SectionHeader title="자기소개서" count={coverLetters.length} onAdd={() => { setShowAddCoverLetter(true); setShowAddResume(false) }} />

            {showAddCoverLetter && (
              <AddForm type="coverLetter" onSave={handleSavedCoverLetter} onCancel={() => setShowAddCoverLetter(false)} />
            )}

            {coverLetters.length === 0 && !showAddCoverLetter ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                <p style={{ fontSize: 14 }}>저장된 자기소개서가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {coverLetters.map((c) => (
                  <DocCard
                    key={c.id}
                    title={c.title}
                    sub={c.companyName}
                    content={c.content}
                    updatedAt={c.updatedAt}
                    onDelete={() => handleDeleteCoverLetter(c.id)}
                    onReview={() => handleReview(c.id, c.content, 'coverLetter')}
                    reviewing={reviewingId === `coverLetter-${c.id}`}
                    reviewResult={reviewResults[`coverLetter-${c.id}`]}
                    onCloseReview={() => handleCloseReview(`coverLetter-${c.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default ResumePage
