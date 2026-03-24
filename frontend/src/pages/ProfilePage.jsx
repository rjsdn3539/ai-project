import { useState, useEffect, useRef } from 'react'
import * as profileApi from '../api/profile'
import * as authApi from '../api/auth'
import useAuthStore from '../store/authStore'

const PRIMARY = 'var(--primary)'
const BORDER = 'var(--border)'

const lsGet = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
const lsSet = (key, val) => localStorage.setItem(key, JSON.stringify(val))
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

const TABS = [
  { id: 'resume',           label: '📄 이력서' },
  { id: 'coverLetter',      label: '📝 자기소개서' },
  { id: 'portfolio',        label: '🔗 포트폴리오' },
  { id: 'skills',           label: '🛠 기술스택' },
  { id: 'certifications',   label: '🏆 자격증·어학' },
  { id: 'targets',          label: '🎯 목표회사' },
  { id: 'account',          label: '⚙ 내 정보 수정' },
]

const SKILL_LEVELS = ['입문', '초급', '중급', '고급', '전문가']
const SKILL_COLORS = { '입문': 'var(--text-muted)', '초급': '#60a5fa', '중급': '#34d399', '고급': '#a78bfa', '전문가': 'var(--warning)' }

// ─── 공통 컴포넌트 ───────────────────────────────────────────

function inputStyle(focused, field) {
  return {
    width: '100%', padding: '10px 13px', boxSizing: 'border-box',
    border: `1.5px solid ${focused === field ? PRIMARY : BORDER}`,
    borderRadius: 9, fontSize: 13, outline: 'none',
    background: 'var(--surface)', color: 'var(--text)',
    boxShadow: focused === field ? '0 0 0 3px rgba(124,106,240,0.1)' : 'none',
    transition: 'all 0.15s', fontFamily: 'inherit',
  }
}

function EmptyState({ icon, text, onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontSize: 14, marginBottom: 12 }}>{text}</p>
      <button onClick={onAdd} style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        + 지금 추가하기
      </button>
    </div>
  )
}

function SectionHeader({ title, count, onAdd }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
        {count > 0 && <span style={{ background: 'var(--primary-light)', color: PRIMARY, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>{count}</span>}
      </div>
      <button onClick={onAdd} style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        + 추가
      </button>
    </div>
  )
}

// ─── 이력서 / 자기소개서 ──────────────────────────────────────

function DocCard({ title, sub, content, updatedAt, onDelete }) {
  const [confirm, setConfirm] = useState(false)
  const preview = content ? content.replace(/\s+/g, ' ').trim().slice(0, 100) : ''
  const date = updatedAt ? new Date(updatedAt).toLocaleDateString('ko-KR') : ''
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '16px 20px', border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{title}</p>
          {sub && <p style={{ fontSize: 12, color: PRIMARY, fontWeight: 600, margin: '0 0 4px' }}>{sub}</p>}
        </div>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} style={{ background: 'none', border: '1.5px solid var(--border-error)', borderRadius: 7, color: 'var(--danger)', padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>삭제</button>
        ) : (
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button onClick={onDelete} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>확인</button>
            <button onClick={() => setConfirm(false)} style={{ background: 'none', border: `1.5px solid ${BORDER}`, borderRadius: 7, padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          </div>
        )}
      </div>
      {date && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>수정일: {date}</p>}
    </div>
  )
}

function DocAddForm({ type, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mode, setMode] = useState('file')
  const [file, setFile] = useState(null)
  const [focused, setFocused] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()
  const isCover = type === 'coverLetter'

  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    setError('')
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (isCover && !file) { setError('파일을 업로드해주세요.'); return }
    if (!isCover && mode === 'file' && !file) { setError('파일을 업로드해주세요.'); return }
    if (!isCover && mode === 'text' && !content.trim()) { setError('내용을 입력해주세요.'); return }
    setSaving(true); setError('')
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
    } catch { setError('저장에 실패했습니다. 파일 형식(.txt, .pdf, .doc, .docx)을 확인해주세요.') } finally { setSaving(false) }
  }

  const ist = (f) => inputStyle(focused, f)

  const UploadArea = (
    <>
      <input type="file" accept=".txt,.pdf,.doc,.docx" ref={fileRef} style={{ display: 'none' }} onChange={handleFile} />
      <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${file ? PRIMARY : BORDER}`, borderRadius: 10, padding: '20px', cursor: 'pointer', textAlign: 'center', background: file ? 'var(--primary-light)' : 'var(--bg)' }}>
        {file
          ? <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 13 }}>✅ {file.name}</span>
          : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📄 클릭하여 업로드 (.txt · .pdf · .doc)</span>}
      </div>
    </>
  )

  return (
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '20px', border: `1.5px dashed ${PRIMARY}`, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
      <p style={{ fontWeight: 700, fontSize: 13, color: PRIMARY, margin: 0 }}>{isCover ? '+ 새 자기소개서' : '+ 새 이력서'}</p>
      <input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} onFocus={() => setFocused('title')} onBlur={() => setFocused(null)} style={ist('title')} />

      {isCover ? UploadArea : (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['file', '📁 파일'], ['text', '✏️ 직접입력']].map(([val, label]) => (
              <button key={val} onClick={() => setMode(val)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, border: `1.5px solid ${mode === val ? PRIMARY : BORDER}`, background: mode === val ? 'var(--primary-light)' : 'var(--surface)', color: mode === val ? PRIMARY : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
            ))}
          </div>
          {mode === 'file' ? UploadArea : (
            <div>
              <textarea placeholder="이력서 내용을 입력하세요..." value={content} onChange={(e) => setContent(e.target.value.slice(0, 5000))} onFocus={() => setFocused('content')} onBlur={() => setFocused(null)} rows={5} style={{ ...ist('content'), resize: 'vertical', lineHeight: 1.7 }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', margin: '2px 0 0' }}>{content.length} / 5000</p>
            </div>
          )}
        </>
      )}

      {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? '저장 중...' : '저장'}</button>
      </div>
    </div>
  )
}

function DocumentSection({ type }) {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = type === 'resume' ? await profileApi.getResumes() : await profileApi.getCoverLetters()
      setItems(res.data?.data ?? [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [type])

  const handleDelete = async (id) => {
    if (type === 'resume') await profileApi.deleteResume(id)
    else await profileApi.deleteCoverLetter(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>불러오는 중...</p>

  const emptyText = type === 'resume' ? '저장된 이력서가 없습니다.' : '저장된 자기소개서가 없습니다.'
  const emptyIcon = type === 'resume' ? '📄' : '📝'

  return (
    <div>
      <SectionHeader title={type === 'resume' ? '이력서' : '자기소개서'} count={items.length} onAdd={() => setShowForm(true)} />
      {showForm && <DocAddForm type={type} onSave={() => { setShowForm(false); load() }} onCancel={() => setShowForm(false)} />}
      {items.length === 0 && !showForm
        ? <EmptyState icon={emptyIcon} text={emptyText} onAdd={() => setShowForm(true)} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => (
              <DocCard key={item.id} title={item.title} sub={item.companyName || undefined} content={item.content} updatedAt={item.updatedAt} onDelete={() => handleDelete(item.id)} />
            ))}
          </div>}
    </div>
  )
}

// ─── 포트폴리오 ──────────────────────────────────────────────

function PortfolioSection() {
  const [items, setItems] = useState(() => lsGet('profile_portfolio'))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', description: '' })
  const [focused, setFocused] = useState(null)
  const [error, setError] = useState('')

  const save = (next) => { setItems(next); lsSet('profile_portfolio', next) }

  const handleAdd = () => {
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!form.url.trim()) { setError('URL을 입력해주세요.'); return }
    save([...items, { id: uid(), ...form }])
    setForm({ title: '', url: '', description: '' }); setShowForm(false); setError('')
  }

  const ist = (f) => inputStyle(focused, f)

  return (
    <div>
      <SectionHeader title="포트폴리오 링크" count={items.length} onAdd={() => setShowForm(true)} />
      {showForm && (
        <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '20px', border: `1.5px dashed ${PRIMARY}`, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="제목 (예: GitHub, 개인 블로그)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onFocus={() => setFocused('title')} onBlur={() => setFocused(null)} style={ist('title')} />
          <input placeholder="URL (https://...)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} onFocus={() => setFocused('url')} onBlur={() => setFocused(null)} style={ist('url')} />
          <input placeholder="설명 (선택)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)} style={ist('desc')} />
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setError('') }} style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={handleAdd} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
          </div>
        </div>
      )}
      {items.length === 0 && !showForm
        ? <EmptyState icon="🔗" text="등록된 포트폴리오가 없습니다." onAdd={() => setShowForm(true)} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 18px', border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{item.title}</p>
                  <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: PRIMARY, textDecoration: 'none', wordBreak: 'break-all' }}>{item.url}</a>
                  {item.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{item.description}</p>}
                </div>
                <button onClick={() => save(items.filter((i) => i.id !== item.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>}
    </div>
  )
}

// ─── 기술 스택 ────────────────────────────────────────────────

function SkillsSection() {
  const [items, setItems] = useState(() => lsGet('profile_skills'))
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState('중급')
  const [focused, setFocused] = useState(null)
  const [error, setError] = useState('')

  const save = (next) => { setItems(next); lsSet('profile_skills', next) }

  const handleAdd = () => {
    if (!name.trim()) { setError('기술명을 입력해주세요.'); return }
    if (items.find((i) => i.name.toLowerCase() === name.trim().toLowerCase())) { setError('이미 추가된 기술입니다.'); return }
    save([...items, { id: uid(), name: name.trim(), level }])
    setName(''); setShowForm(false); setError('')
  }

  return (
    <div>
      <SectionHeader title="기술 스택" count={items.length} onAdd={() => setShowForm(true)} />
      {showForm && (
        <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '20px', border: `1.5px dashed ${PRIMARY}`, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="기술명 (예: React, Java, Python)" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} style={inputStyle(focused, 'name')} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>숙련도</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SKILL_LEVELS.map((l) => (
                <button key={l} onClick={() => setLevel(l)} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, border: `1.5px solid ${level === l ? SKILL_COLORS[l] : BORDER}`, background: level === l ? SKILL_COLORS[l] + '22' : 'var(--surface)', color: level === l ? SKILL_COLORS[l] : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
              ))}
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setError('') }} style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={handleAdd} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
          </div>
        </div>
      )}
      {items.length === 0 && !showForm
        ? <EmptyState icon="🛠" text="등록된 기술스택이 없습니다." onAdd={() => setShowForm(true)} />
        : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: SKILL_COLORS[item.level] + '18', border: `1.5px solid ${SKILL_COLORS[item.level]}44`, borderRadius: 99, padding: '6px 12px' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{item.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: SKILL_COLORS[item.level] }}>{item.level}</span>
                <button onClick={() => save(items.filter((i) => i.id !== item.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 0 0 2px' }}>×</button>
              </div>
            ))}
          </div>}
    </div>
  )
}

// ─── 자격증·어학 ──────────────────────────────────────────────

function CertificationsSection() {
  const [items, setItems] = useState(() => lsGet('profile_certifications'))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', score: '', date: '' })
  const [focused, setFocused] = useState(null)
  const [error, setError] = useState('')

  const save = (next) => { setItems(next); lsSet('profile_certifications', next) }

  const handleAdd = () => {
    if (!form.name.trim()) { setError('자격증명을 입력해주세요.'); return }
    save([...items, { id: uid(), ...form }])
    setForm({ name: '', score: '', date: '' }); setShowForm(false); setError('')
  }

  const ist = (f) => inputStyle(focused, f)

  return (
    <div>
      <SectionHeader title="자격증 · 어학" count={items.length} onAdd={() => setShowForm(true)} />
      {showForm && (
        <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '20px', border: `1.5px dashed ${PRIMARY}`, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="자격증명 (예: 정보처리기사, TOEIC)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} style={ist('name')} />
          <input placeholder="점수 / 등급 (예: 895점, 1급)" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} onFocus={() => setFocused('score')} onBlur={() => setFocused(null)} style={ist('score')} />
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} onFocus={() => setFocused('date')} onBlur={() => setFocused(null)} style={ist('date')} />
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setError('') }} style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={handleAdd} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
          </div>
        </div>
      )}
      {items.length === 0 && !showForm
        ? <EmptyState icon="🏆" text="등록된 자격증이 없습니다." onAdd={() => setShowForm(true)} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 18px', border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b22, #f59e0b44)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏆</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{item.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    {[item.score, item.date && new Date(item.date).toLocaleDateString('ko-KR')].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button onClick={() => save(items.filter((i) => i.id !== item.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>}
    </div>
  )
}

// ─── 목표 회사 ────────────────────────────────────────────────

const PRIORITIES = [{ value: 'high', label: '1순위', color: '#ef4444' }, { value: 'mid', label: '2순위', color: 'var(--warning)' }, { value: 'low', label: '3순위', color: 'var(--text-muted)' }]

function TargetsSection() {
  const [items, setItems] = useState(() => lsGet('profile_targets'))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ company: '', position: '', priority: 'mid', memo: '' })
  const [focused, setFocused] = useState(null)
  const [error, setError] = useState('')

  const save = (next) => { setItems(next); lsSet('profile_targets', next) }

  const handleAdd = () => {
    if (!form.company.trim()) { setError('회사명을 입력해주세요.'); return }
    if (!form.position.trim()) { setError('지원 직무를 입력해주세요.'); return }
    save([...items, { id: uid(), ...form }])
    setForm({ company: '', position: '', priority: 'mid', memo: '' }); setShowForm(false); setError('')
  }

  const ist = (f) => inputStyle(focused, f)

  return (
    <div>
      <SectionHeader title="목표 회사" count={items.length} onAdd={() => setShowForm(true)} />
      {showForm && (
        <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '20px', border: `1.5px dashed ${PRIMARY}`, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="회사명 (예: 카카오)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} onFocus={() => setFocused('company')} onBlur={() => setFocused(null)} style={ist('company')} />
            <input placeholder="지원 직무 (예: 백엔드 개발자)" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} onFocus={() => setFocused('position')} onBlur={() => setFocused(null)} style={ist('position')} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRIORITIES.map(({ value, label, color }) => (
              <button key={value} onClick={() => setForm({ ...form, priority: value })} style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, border: `1.5px solid ${form.priority === value ? color : BORDER}`, background: form.priority === value ? color + '18' : 'var(--surface)', color: form.priority === value ? color : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
            ))}
          </div>
          <input placeholder="메모 (선택)" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} onFocus={() => setFocused('memo')} onBlur={() => setFocused(null)} style={ist('memo')} />
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowForm(false); setError('') }} style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${BORDER}`, background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={handleAdd} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
          </div>
        </div>
      )}
      {items.length === 0 && !showForm
        ? <EmptyState icon="🎯" text="등록된 목표 회사가 없습니다." onAdd={() => setShowForm(true)} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...items].sort((a, b) => ['high','mid','low'].indexOf(a.priority) - ['high','mid','low'].indexOf(b.priority)).map((item) => {
              const p = PRIORITIES.find((x) => x.value === item.priority)
              return (
                <div key={item.id} style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 18px', border: `1.5px solid ${p.color}33`, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.color, background: p.color + '18', borderRadius: 99, padding: '3px 9px', flexShrink: 0 }}>{p.label}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{item.company}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{item.position}{item.memo ? ` · ${item.memo}` : ''}</p>
                  </div>
                  <button onClick={() => save(items.filter((i) => i.id !== item.id))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              )
            })}
          </div>}
    </div>
  )
}

// ─── 내 정보 수정 ─────────────────────────────────────────────

function AccountSection() {
  const { user, updateName } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [nameFocused, setNameFocused] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState(null) // { type: 'success'|'error', text }

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwFocused, setPwFocused] = useState(null)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)

  const handleNameSave = async () => {
    if (!name.trim()) { setNameMsg({ type: 'error', text: '이름을 입력해주세요.' }); return }
    if (name.trim() === user?.name) { setNameMsg({ type: 'error', text: '현재 이름과 동일합니다.' }); return }
    setNameSaving(true); setNameMsg(null)
    try {
      await authApi.updateProfile(name.trim())
      updateName(name.trim())
      setNameMsg({ type: 'success', text: '이름이 변경됐습니다.' })
    } catch (err) {
      setNameMsg({ type: 'error', text: err?.response?.data?.error?.message || '변경에 실패했습니다.' })
    } finally { setNameSaving(false) }
  }

  const handlePwSave = async () => {
    if (!pw.current) { setPwMsg({ type: 'error', text: '현재 비밀번호를 입력해주세요.' }); return }
    if (pw.next.length < 8) { setPwMsg({ type: 'error', text: '새 비밀번호는 8자 이상이어야 합니다.' }); return }
    if (pw.next !== pw.confirm) { setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' }); return }
    setPwSaving(true); setPwMsg(null)
    try {
      await authApi.changePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      setPwMsg({ type: 'success', text: '비밀번호가 변경됐습니다.' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err?.response?.data?.error?.message || '변경에 실패했습니다.' })
    } finally { setPwSaving(false) }
  }

  const ist = (f, focused) => inputStyle(focused, f)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* 기본 정보 */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>기본 정보</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>이메일</label>
            <input value={user?.email || ''} disabled style={{ ...ist('email', null), background: 'var(--bg)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>이메일은 변경할 수 없습니다.</p>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>이름</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} style={{ ...ist('name', nameFocused ? 'name' : null), flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && handleNameSave()} />
              <button onClick={handleNameSave} disabled={nameSaving} style={{ padding: '0 18px', borderRadius: 9, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: nameSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: nameSaving ? 0.7 : 1, flexShrink: 0 }}>
                {nameSaving ? '저장 중...' : '변경'}
              </button>
            </div>
            {nameMsg && <p style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: nameMsg.type === 'success' ? 'var(--success)' : '#dc2626' }}>{nameMsg.text}</p>}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-light)' }} />

      {/* 비밀번호 변경 */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>비밀번호 변경</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'current', label: '현재 비밀번호', placeholder: '현재 비밀번호 입력' },
            { key: 'next',    label: '새 비밀번호',   placeholder: '8자 이상 입력' },
            { key: 'confirm', label: '새 비밀번호 확인', placeholder: '새 비밀번호 재입력' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type="password" placeholder={placeholder}
                value={pw[key]} onChange={(e) => setPw({ ...pw, [key]: e.target.value })}
                onFocus={() => setPwFocused(key)} onBlur={() => setPwFocused(null)}
                style={ist(key, pwFocused)}
              />
            </div>
          ))}
          {pwMsg && <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: pwMsg.type === 'success' ? 'var(--success)' : '#dc2626' }}>{pwMsg.text}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handlePwSave} disabled={pwSaving} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: pwSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: pwSaving ? 0.7 : 1 }}>
              {pwSaving ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 메인 페이지 ──────────────────────────────────────────────

function ProfilePage() {
  const [activeTab, setActiveTab] = useState('resume')

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>내 프로필</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>이력서, 자기소개서, 기술스택 등 면접 준비 정보를 관리하세요.</p>
      </div>

      {/* 탭 바 */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 14, padding: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: activeTab === id ? 700 : 500,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            background: activeTab === id ? 'var(--surface)' : 'transparent',
            color: activeTab === id ? PRIMARY : 'var(--text-muted)',
            boxShadow: activeTab === id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '28px 32px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)', minHeight: 300 }}>
        {activeTab === 'resume'         && <DocumentSection type="resume" />}
        {activeTab === 'coverLetter'    && <DocumentSection type="coverLetter" />}
        {activeTab === 'portfolio'      && <PortfolioSection />}
        {activeTab === 'skills'         && <SkillsSection />}
        {activeTab === 'certifications' && <CertificationsSection />}
        {activeTab === 'targets'        && <TargetsSection />}
        {activeTab === 'account'        && <AccountSection />}
      </div>
    </div>
  )
}

export default ProfilePage
