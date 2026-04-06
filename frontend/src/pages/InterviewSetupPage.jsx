import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as profileApi from '../api/profile'
import * as interviewApi from '../api/interview'
import useAuthStore from '../store/authStore'

// ──────────────────────────────────────────
// 공통 스타일 헬퍼
// ──────────────────────────────────────────
function FieldInput({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>}
      <input
        style={{
          width: '100%', padding: '11px 14px',
          border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 10, fontSize: 14, outline: 'none',
          background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box',
          boxShadow: focused ? '0 0 0 3px rgba(124,106,240,0.1)' : 'none',
          transition: 'all 0.15s', fontFamily: 'inherit',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </div>
  )
}

function StepBadge({ n, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: '#fff',
        boxShadow: '0 4px 12px rgba(124,106,240,0.3)',
      }}>{n}</div>
      <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', margin: 0 }}>{label}</h2>
    </div>
  )
}

// ──────────────────────────────────────────
// 문서 카드 (선택 가능)
// ──────────────────────────────────────────
function DocCard({ doc, selected, onSelect, onDelete, showCompany }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const preview = (doc.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-light)'}`,
        background: selected ? 'var(--primary-light)' : 'var(--surface)',
        boxShadow: selected ? '0 4px 14px rgba(124,106,240,0.15)' : 'var(--shadow-sm)',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}
    >
      {/* 선택 표시 */}
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        background: selected ? 'var(--primary)' : 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {selected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
      </div>

      {/* 내용 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {doc.title}
        </p>
        {showCompany && doc.companyName && (
          <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, margin: '0 0 4px' }}>{doc.companyName}</p>
        )}
      </div>

      {/* 삭제 */}
      <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
        {!confirmDelete ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
          >×</button>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={handleDelete} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// 새 문서 추가 인라인 폼
// ──────────────────────────────────────────
function AddDocForm({ type, onSaved, onCancel }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [inputMode, setInputMode] = useState('file') // resume only
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(null)
  const fileRef = useRef()

  const readFile = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(f, 'UTF-8')
  })

  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    try {
      const text = await readFile(f)
      setFile(f)
      setContent(text.slice(0, 5000))
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
      setError('')
    } catch { setError('파일을 읽는데 실패했습니다. .txt 파일을 사용해주세요.') }
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!content.trim()) { setError('파일을 업로드해주세요.'); return }
    setSaving(true); setError('')
    try {
      let res
      if (type === 'resume') {
        res = await profileApi.createResume({ title: title.trim(), content: content.slice(0, 5000) })
      } else {
        res = await profileApi.createCoverLetter({ title: title.trim(), companyName: '', content: content.slice(0, 5000) })
      }
      onSaved(res.data.data)
    } catch { setError('저장에 실패했습니다. 다시 시도해주세요.') }
    finally { setSaving(false) }
  }

  const inputStyle = (f) => ({
    width: '100%', padding: '10px 13px',
    border: `1.5px solid ${focused === f ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: 9, fontSize: 13, outline: 'none',
    background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box',
    boxShadow: focused === f ? '0 0 0 3px rgba(124,106,240,0.1)' : 'none',
    transition: 'all 0.15s', fontFamily: 'inherit',
  })

  const FileUploadArea = (
    <>
      <input type="file" accept=".txt,.pdf,.doc,.docx" ref={fileRef} style={{ display: 'none' }} onChange={handleFile} />
      <div onClick={() => fileRef.current.click()} style={{
        border: `2px dashed ${file ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 10, padding: '18px', cursor: 'pointer', textAlign: 'center',
        background: file ? 'var(--primary-light)' : 'var(--surface)',
      }}>
        {file ? (
          <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>✅ {file.name}</span>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📄 클릭하여 업로드 (.txt · .pdf · .doc)</span>
        )}
      </div>
    </>
  )

  return (
    <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, border: '1.5px dashed var(--primary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', margin: 0 }}>
        {type === 'resume' ? '+ 새 이력서 추가' : '+ 새 자기소개서 추가'}
      </p>

      <input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setFocused('title')} onBlur={() => setFocused(null)} style={inputStyle('title')} />

      {/* 자기소개서: 파일 업로드 전용 / 이력서: 파일 or 직접입력 */}
      {type === 'coverLetter' ? FileUploadArea : (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['file', '📁 파일'], ['text', '✏️ 직접입력']].map(([val, label]) => (
              <button key={val} onClick={() => setInputMode(val)} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${inputMode === val ? 'var(--primary)' : 'var(--border)'}`,
                background: inputMode === val ? 'var(--primary-light)' : 'var(--surface)',
                color: inputMode === val ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{label}</button>
            ))}
          </div>

          {inputMode === 'file' ? FileUploadArea : (
            <div>
              <textarea placeholder="내용을 입력하세요..." value={content} onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                onFocus={() => setFocused('content')} onBlur={() => setFocused(null)}
                rows={5} style={{ ...inputStyle('content'), resize: 'vertical', lineHeight: 1.7 }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', margin: '2px 0 0' }}>{content.length} / 5000</p>
            </div>
          )}
        </>
      )}

      {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// 채용공고 카드
// ──────────────────────────────────────────
function JobPostingCard({ posting, selected, onSelect, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-light)'}`,
        background: selected ? 'var(--primary-light)' : 'var(--surface)',
        boxShadow: selected ? '0 4px 14px rgba(124,106,240,0.15)' : 'var(--shadow-sm)',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        background: selected ? 'var(--primary)' : 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {selected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {posting.companyName}
        </p>
        <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{posting.positionTitle}</p>
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
        {!confirmDelete ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}
          >×</button>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// 채용공고 추가 폼
// ──────────────────────────────────────────
function AddJobPostingForm({ onSaved, onCancel }) {
  const [inputMode, setInputMode] = useState('url')
  const [jobUrl, setJobUrl] = useState('')
  const [jobText, setJobText] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [parsedDescription, setParsedDescription] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(null)

  const inputStyle = (f) => ({
    width: '100%', padding: '10px 13px',
    border: `1.5px solid ${focused === f ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: 9, fontSize: 13, outline: 'none',
    background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box',
    boxShadow: focused === f ? '0 0 0 3px rgba(124,106,240,0.1)' : 'none',
    transition: 'all 0.15s', fontFamily: 'inherit',
  })

  const handleParse = async () => {
    const hasUrl = inputMode === 'url' && jobUrl.trim()
    const hasText = inputMode === 'text' && jobText.trim()
    if (!hasUrl && !hasText) return
    setParsing(true)
    setParseError('')
    try {
      const { data } = await profileApi.parseJobPosting({
        url: inputMode === 'url' ? jobUrl.trim() : undefined,
        content: inputMode === 'text' ? jobText.trim() : undefined,
      })
      const result = data.data
      if (result.companyName) setCompany(result.companyName)
      if (result.positionTitle) setPosition(result.positionTitle)
      if (result.description) setParsedDescription(result.description)
    } catch {
      setParseError(inputMode === 'url'
        ? 'URL을 분석하지 못했습니다. 텍스트 방식을 사용하거나 직접 입력해주세요.'
        : '텍스트를 분석하지 못했습니다. 직접 입력해주세요.')
    } finally { setParsing(false) }
  }

  const handleSave = async () => {
    if (!company.trim()) { setError('회사명을 입력해주세요.'); return }
    if (!position.trim()) { setError('직무명을 입력해주세요.'); return }
    const description = parsedDescription || (inputMode === 'text' ? jobText.trim() : jobUrl.trim())
    if (!description) { setError('채용공고 내용 또는 URL을 입력해주세요.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await profileApi.createJobPosting({
        companyName: company.trim(),
        positionTitle: position.trim(),
        description,
        jobUrl: inputMode === 'url' ? jobUrl.trim() : '',
      })
      onSaved(res.data.data)
    } catch { setError('저장에 실패했습니다. 다시 시도해주세요.') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16, border: '1.5px dashed var(--primary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', margin: 0 }}>+ 새 채용공고 추가</p>

      <div style={{ display: 'flex', gap: 6, background: 'var(--surface)', borderRadius: 10, padding: 3, border: '1px solid var(--border-light)' }}>
        {[['url', '🔗 URL'], ['text', '📋 텍스트']].map(([val, label]) => (
          <button key={val} onClick={() => { setInputMode(val); setParseError('') }} style={{
            flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
            background: inputMode === val ? 'var(--primary)' : 'transparent',
            color: inputMode === val ? '#fff' : 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {inputMode === 'url' ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="https://careers.kakao.com/..."
            value={jobUrl}
            onChange={(e) => { setJobUrl(e.target.value); setParseError('') }}
            onFocus={() => setFocused('url')}
            onBlur={() => setFocused(null)}
            style={{ ...inputStyle('url'), flex: 1 }}
          />
          <button
            onClick={handleParse}
            disabled={parsing || !jobUrl.trim()}
            style={{
              flexShrink: 0, padding: '0 12px', height: 40, borderRadius: 9,
              background: jobUrl.trim() ? 'var(--primary)' : 'var(--bg)',
              color: jobUrl.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 700, cursor: parsing || !jobUrl.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: parsing ? 0.7 : 1,
              border: `1.5px solid ${jobUrl.trim() ? 'transparent' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}
          >{parsing ? '분석 중…' : '✨ 자동입력'}</button>
        </div>
      ) : (
        <div>
          <textarea
            placeholder="채용공고 내용을 붙여넣어 주세요."
            value={jobText}
            onChange={(e) => { setJobText(e.target.value.slice(0, 5000)); setParseError('') }}
            rows={4}
            onFocus={() => setFocused('text')}
            onBlur={() => setFocused(null)}
            style={{ ...inputStyle('text'), resize: 'vertical', lineHeight: 1.6 }}
          />
          <button
            onClick={handleParse}
            disabled={parsing || !jobText.trim()}
            style={{
              marginTop: 6, width: '100%', padding: '8px', borderRadius: 9, border: 'none',
              background: jobText.trim() ? 'var(--primary)' : 'var(--bg)',
              color: jobText.trim() ? '#fff' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 700, cursor: parsing || !jobText.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: parsing ? 0.7 : 1, transition: 'all 0.15s',
              border: `1.5px solid ${jobText.trim() ? 'transparent' : 'var(--border)'}`,
            }}
          >{parsing ? '분석 중…' : '✨ 회사명·직무 자동입력'}</button>
        </div>
      )}

      {parseError && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{parseError}</p>}

      <input
        placeholder="회사명"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        onFocus={() => setFocused('company')}
        onBlur={() => setFocused(null)}
        style={inputStyle('company')}
      />
      <input
        placeholder="지원 직무"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        onFocus={() => setFocused('position')}
        onBlur={() => setFocused(null)}
        style={inputStyle('position')}
      />

      {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// 채용공고 선택 섹션 (카드 목록 + 추가 폼)
// ──────────────────────────────────────────
const JOB_PAGE_SIZE = 6

function JobPostingSection({ items, selectedId, onSelect, onAdded, onDeleted }) {
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(items.length / JOB_PAGE_SIZE)
  const pagedItems = items.slice(page * JOB_PAGE_SIZE, page * JOB_PAGE_SIZE + JOB_PAGE_SIZE)

  // JobPostingCard: border(4) + padding(28) + company(21) + margin(2) + position(18) = 73px → 76px (여유 포함)
  const CARD_H = 76
  const CARD_AREA_HEIGHT = CARD_H * JOB_PAGE_SIZE + 8 * (JOB_PAGE_SIZE - 1)

  const handleSaved = (posting) => {
    onAdded(posting)
    onSelect(posting.id)
    setShowForm(false)
    setPage(Math.floor(items.length / JOB_PAGE_SIZE))
  }

  const handleDelete = (id) => {
    onDeleted(id)
    if (pagedItems.length === 1 && page > 0) setPage(page - 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>저장된 채용공고</label>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            background: 'none', border: '1.5px solid var(--primary)', borderRadius: 8,
            color: 'var(--primary)', padding: '4px 12px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>+ 새로 추가</button>
        )}
      </div>

      {/* 카드 영역 - 고정 높이 */}
      <div style={{ minHeight: CARD_AREA_HEIGHT, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {showForm && (
          <AddJobPostingForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        )}

        {items.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg)', borderRadius: 12, border: '1.5px dashed var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>저장된 채용공고가 없습니다.</p>
            <button onClick={() => setShowForm(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ 지금 추가하기</button>
          </div>
        )}

        {pagedItems.map((posting) => (
          <JobPostingCard
            key={posting.id}
            posting={posting}
            selected={selectedId === posting.id}
            onSelect={() => onSelect(posting.id)}
            onDelete={() => handleDelete(posting.id)}
          />
        ))}
      </div>

      {/* 페이지네이션 - 항상 같은 위치에 고정 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, visibility: totalPages > 1 ? 'visible' : 'hidden' }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          style={{
            width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)',
            background: 'var(--surface)', cursor: page === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 14, color: 'var(--text)',
            opacity: page === 0 ? 0.35 : 1, fontFamily: 'inherit',
          }}
        >‹</button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          style={{
            width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)',
            background: 'var(--surface)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 14, color: 'var(--text)',
            opacity: page >= totalPages - 1 ? 0.35 : 1, fontFamily: 'inherit',
          }}
        >›</button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// 문서 선택 섹션 (카드 목록 + 추가 폼)
// ──────────────────────────────────────────
const PAGE_SIZE = 3

function DocSection({ label, type, items, selectedId, onSelect, onAdded, onDeleted }) {
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pagedItems = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const handleSaved = (doc) => {
    onAdded(doc)
    onSelect(doc.id)
    setShowForm(false)
    // Go to last page so newly added item is visible
    setPage(Math.floor(items.length / PAGE_SIZE))
  }

  const handleDelete = (id) => {
    onDeleted(id)
    // If current page becomes empty after delete, go back one page
    if (pagedItems.length === 1 && page > 0) setPage(page - 1)
  }

  // DocCard: border(4) + padding(28) + title(21) + margin(2) + preview(18) = 73px → 76px (여유 포함)
  const CARD_H = 76
  const CARD_AREA_HEIGHT = CARD_H * PAGE_SIZE + 8 * (PAGE_SIZE - 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</label>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            background: 'none', border: '1.5px solid var(--primary)', borderRadius: 8,
            color: 'var(--primary)', padding: '4px 12px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>+ 새로 추가</button>
        )}
      </div>

      {/* 카드 영역 - 고정 높이 */}
      <div style={{ minHeight: CARD_AREA_HEIGHT, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {showForm && (
          <AddDocForm type={type} onSaved={handleSaved} onCancel={() => setShowForm(false)} />
        )}

        {items.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg)', borderRadius: 12, border: '1.5px dashed var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>저장된 {label}가 없습니다.</p>
            <button onClick={() => setShowForm(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ 지금 추가하기</button>
          </div>
        )}

        {pagedItems.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            selected={selectedId === doc.id}
            showCompany={type === 'coverLetter'}
            onSelect={() => onSelect(doc.id)}
            onDelete={() => handleDelete(doc.id)}
          />
        ))}
      </div>

      {/* 페이지네이션 - 항상 같은 위치에 고정 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, visibility: totalPages > 1 ? 'visible' : 'hidden' }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          style={{
            width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)',
            background: 'var(--surface)', cursor: page === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 14, color: 'var(--text)',
            opacity: page === 0 ? 0.35 : 1, fontFamily: 'inherit',
          }}
        >‹</button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          style={{
            width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border)',
            background: 'var(--surface)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 14, color: 'var(--text)',
            opacity: page >= totalPages - 1 ? 0.35 : 1, fontFamily: 'inherit',
          }}
        >›</button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────
function InterviewSetupPage() {
  const navigate = useNavigate()

  const [resumes, setResumes] = useState([])
  const [coverLetters, setCoverLetters] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState(null)
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState(null)
  const [docsLoading, setDocsLoading] = useState(true)

  const [jobPostings, setJobPostings] = useState([])
  const [selectedJobPostingId, setSelectedJobPostingId] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([profileApi.getResumes(), profileApi.getCoverLetters(), profileApi.getJobPostings()])
      .then(([rRes, cRes, jRes]) => {
        const r = rRes.data?.data ?? []
        const c = cRes.data?.data ?? []
        const j = jRes.data?.data ?? []
        setResumes(r)
        setCoverLetters(c)
        setJobPostings(j)
        if (r.length === 1) setSelectedResumeId(r[0].id)
        if (c.length === 1) setSelectedCoverLetterId(c[0].id)
        if (j.length === 1) setSelectedJobPostingId(j[0].id)
      })
      .finally(() => setDocsLoading(false))
  }, [])

  const handleDeleteResume = async (id) => {
    await profileApi.deleteResume(id)
    setResumes((prev) => prev.filter((r) => r.id !== id))
    if (selectedResumeId === id) setSelectedResumeId(null)
  }

  const handleDeleteCoverLetter = async (id) => {
    await profileApi.deleteCoverLetter(id)
    setCoverLetters((prev) => prev.filter((c) => c.id !== id))
    if (selectedCoverLetterId === id) setSelectedCoverLetterId(null)
  }

  const handleDeleteJobPosting = async (id) => {
    await profileApi.deleteJobPosting(id)
    setJobPostings((prev) => prev.filter((j) => j.id !== id))
    if (selectedJobPostingId === id) setSelectedJobPostingId(null)
  }

  const handleStart = async () => {
    if (!selectedResumeId)      { setError({ message: '이력서를 선택해주세요.' }); return }
    if (!selectedCoverLetterId) { setError({ message: '자기소개서를 선택해주세요.' }); return }
    if (!selectedJobPostingId)  { setError({ message: '채용공고를 선택해주세요.' }); return }

    const selectedPosting = jobPostings.find((j) => j.id === selectedJobPostingId)
    setError(null)
    setLoading(true)
    try {
      const { data } = await interviewApi.startSession({
        title: `${selectedPosting.companyName} ${selectedPosting.positionTitle} 면접`,
        positionTitle: selectedPosting.positionTitle,
        resumeId: selectedResumeId,
        coverLetterId: selectedCoverLetterId,
        jobPostingId: selectedJobPostingId,
        questionCount: 5,
      })
      navigate('/interview/session', { state: { sessionId: data.data.id } })
    } catch (err) {
      const code = err?.response?.data?.error?.code
      const msg  = err?.response?.data?.error?.message
      if (code === 'SUBSCRIPTION_REQUIRED') {
        setError({ message: '면접을 시작하려면 구독이 필요합니다.', action: { label: '구독 플랜 보기 →', path: '/subscription' } })
      } else if (code === 'MONTHLY_INTERVIEW_LIMIT_EXCEEDED') {
        setError({ message: '이번 달 면접 횟수를 모두 사용했습니다. 플랜을 업그레이드하면 더 이용할 수 있어요.', action: { label: '플랜 업그레이드 →', path: '/subscription' } })
      } else {
        setError({ message: msg || '면접 세션 시작에 실패했습니다. 잠시 후 다시 시도해주세요.' })
      }
    } finally { setLoading(false) }
  }

  const allFilled = selectedResumeId && selectedCoverLetterId && selectedJobPostingId
  const selectedPosting = jobPostings.find((j) => j.id === selectedJobPostingId)

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>면접 시작하기</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>이력서와 채용공고를 선택하면 AI가 맞춤 면접 질문을 생성합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Step 1: 문서 선택 */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '28px 32px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)', minWidth: 0, overflow: 'hidden' }}>
          <StepBadge n="1" label="이력서 / 자기소개서" />

          {docsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>불러오는 중...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <DocSection
                label="이력서"
                type="resume"
                items={resumes}
                selectedId={selectedResumeId}
                onSelect={setSelectedResumeId}
                onAdded={(doc) => setResumes((prev) => [...prev, doc])}
                onDeleted={handleDeleteResume}
              />
              <div style={{ borderTop: '1px solid var(--border-light)' }} />
              <DocSection
                label="자기소개서"
                type="coverLetter"
                items={coverLetters}
                selectedId={selectedCoverLetterId}
                onSelect={setSelectedCoverLetterId}
                onAdded={(doc) => setCoverLetters((prev) => [...prev, doc])}
                onDeleted={handleDeleteCoverLetter}
              />
            </div>
          )}
        </div>

        {/* Step 2: 채용공고 */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '28px 32px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)', minWidth: 0, overflow: 'hidden' }}>
          <StepBadge n="2" label="채용공고 정보" />

          {docsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>불러오는 중...</p>
          ) : (
            <JobPostingSection
              items={jobPostings}
              selectedId={selectedJobPostingId}
              onSelect={setSelectedJobPostingId}
              onAdded={(posting) => setJobPostings((prev) => [...prev, posting])}
              onDeleted={handleDeleteJobPosting}
            />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-error)', border: '1.5px solid var(--border-error)', borderRadius: 14,
          padding: '14px 20px', marginBottom: 14, gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 14, color: 'var(--danger)', fontWeight: 600 }}>{error.message}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {error.action && (
              <button onClick={() => navigate(error.action.path)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {error.action.label}
              </button>
            )}
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}>×</button>
          </div>
        </div>
      )}

      {/* Start */}
      <div style={{
        background: allFilled ? 'linear-gradient(130deg, #3d2ee0 0%, #7c6af0 52%, #0ea5e9 100%)' : 'var(--surface)',
        borderRadius: 20, padding: '28px 36px',
        border: allFilled ? 'none' : '1.5px solid var(--border-light)',
        boxShadow: allFilled ? '0 10px 36px rgba(61,46,224,0.28)' : 'var(--shadow-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s ease',
      }}>
        <div>
          <p style={{ fontSize: 14, color: allFilled ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', marginBottom: 4 }}>
            {allFilled ? '모든 정보가 입력됐어요!' : '이력서, 자기소개서, 채용공고를 모두 선택해주세요'}
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: allFilled ? '#fff' : 'var(--text)' }}>
            {allFilled ? `${selectedPosting?.companyName} ${selectedPosting?.positionTitle} 면접 시작 준비 완료` : '정보를 입력하면 면접을 시작할 수 있어요'}
          </p>
        </div>
        <button
          onClick={handleStart}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: allFilled ? 'var(--surface)' : 'var(--primary)', color: allFilled ? '#3d2ee0' : 'var(--surface)',
            border: 'none', borderRadius: 14, padding: '16px 36px', fontSize: 16, fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)', transition: 'all 0.18s ease',
            opacity: loading ? 0.7 : 1, flexShrink: 0,
          }}
        >
          {loading ? '⚙️ 면접 생성 중...' : '🎤 AI 면접 시작하기'}
        </button>
      </div>
    </div>
  )
}

export default InterviewSetupPage
