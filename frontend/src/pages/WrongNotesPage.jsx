import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'

const SUBJECT_ICON = { 영어: '🇺🇸', 국사: '📜', 파이썬: '🐍', 자바스크립트: '🟨', 'C++': '⚡', 일본어: '🇯🇵', 데이터베이스: '🗄️', 자바: '☕', 스프링: '🍃' }
const DIFF_LABEL = { EASY: '쉬움', MEDIUM: '보통', HARD: '어려움' }
const DIFF_COLOR = { EASY: 'var(--success)', MEDIUM: 'var(--warning)', HARD: '#ef4444' }

function WrongNotesPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('wrongNotes') || '[]'))
  const [filterSubject, setFilterSubject] = useState('전체')
  const [expandedId, setExpandedId] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [undoQueue, setUndoQueue] = useState([])

  const subjects = ['전체', ...Array.from(new Set(notes.map(n => n.subject)))]
  const filtered = filterSubject === '전체' ? notes : notes.filter(n => n.subject === filterSubject)

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))
  const grouped = sorted.reduce((acc, note) => {
    const d = note.date
    if (!acc[d]) acc[d] = []
    acc[d].push(note)
    return acc
  }, {})

  const handleDelete = (id) => {
    const item = notes.find(n => n.id === id)
    if (!item) return
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    localStorage.setItem('wrongNotes', JSON.stringify(updated))

    const timer = setTimeout(() => {
      setUndoQueue(q => q.filter(u => u.id !== id))
    }, 4000)
    setUndoQueue(q => [...q, { id, item, timer }])
  }

  const handleUndo = (id) => {
    const entry = undoQueue.find(u => u.id === id)
    if (!entry) return
    clearTimeout(entry.timer)
    setUndoQueue(q => q.filter(u => u.id !== id))
    const current = JSON.parse(localStorage.getItem('wrongNotes') || '[]')
    const restored = [...current, entry.item]
    localStorage.setItem('wrongNotes', JSON.stringify(restored))
    setNotes(restored)
  }

  const handleClearAll = () => {
    setNotes([])
    localStorage.removeItem('wrongNotes')
    setConfirmClear(false)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>📒 오답노트</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>총 {notes.length}개의 오답이 저장되어 있습니다.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => navigate('/learning')}>← 학습으로</Button>
          {notes.length > 0 && (
            confirmClear ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>전체 삭제?</span>
                <button onClick={handleClearAll} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>확인</button>
                <button onClick={() => setConfirmClear(false)} style={{ padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>취소</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} style={{ padding: '7px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'inherit' }}>전체 삭제</button>
            )
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>저장된 오답이 없습니다</p>
          <p style={{ fontSize: 14, marginBottom: 24 }}>학습을 완료하면 틀린 문제가 자동으로 저장됩니다.</p>
          <Button onClick={() => navigate('/learning')}>학습 시작하기</Button>
        </div>
      ) : (
        <>
          {/* Subject filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {subjects.map(s => (
              <button key={s} onClick={() => setFilterSubject(s)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                border: `1.5px solid ${filterSubject === s ? '#4f46e5' : 'var(--border)'}`,
                background: filterSubject === s ? '#4f46e5' : 'var(--surface)',
                color: filterSubject === s ? '#fff' : 'var(--text-secondary)',
              }}>
                {s !== '전체' ? `${SUBJECT_ICON[s] || '📚'} ` : ''}{s}
                {s !== '전체' && <span style={{ marginLeft: 4, opacity: 0.75 }}>({notes.filter(n => n.subject === s).length})</span>}
              </button>
            ))}
          </div>

          {/* Notes grouped by date */}
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{date}</span>
                <span style={{ fontWeight: 400 }}>· {items.length}개</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(note => {
                  const expanded = expandedId === note.id
                  return (
                    <div key={note.id} style={{
                      background: 'var(--surface)', borderRadius: 14,
                      border: '1px solid var(--border-error)', borderLeft: '4px solid var(--danger)',
                      boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                    }}>
                      {/* Note header */}
                      <div
                        onClick={() => setExpandedId(expanded ? null : note.id)}
                        style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ background: 'var(--bg-warm)', color: 'var(--text)', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                              {SUBJECT_ICON[note.subject] || '📚'} {note.subject}
                            </span>
                            {note.difficulty && (
                              <span style={{ background: `${DIFF_COLOR[note.difficulty]}15`, color: DIFF_COLOR[note.difficulty], fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                                {DIFF_LABEL[note.difficulty] || note.difficulty}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                            {note.question}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '2px 4px', lineHeight: 1, transition: 'color 0.15s' }}
                            title="삭제"
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          >×</button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {expanded && (
                        <div style={{ borderTop: '1px solid #fee2e2', padding: '16px 18px', background: 'var(--surface)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--bg-error)', borderRadius: 8, padding: '8px 12px' }}>
                              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>✕ 내 답변</span>
                              <span style={{ fontSize: 13, color: 'var(--danger)' }}>{note.userAnswer || '(미입력)'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--bg-success)', borderRadius: 8, padding: '8px 12px' }}>
                              <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>✓ 정답</span>
                              <span style={{ fontSize: 13, color: 'var(--success)' }}>{note.answer}</span>
                            </div>
                          </div>
                          {note.aiFeedback && (
                            <div style={{ background: 'var(--bg-indigo)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-indigo)' }}>
                              <p style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>AI 해설</p>
                              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{note.aiFeedback}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Undo 토스트 */}
      {undoQueue.length > 0 && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {undoQueue.map((entry) => (
            <div key={entry.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#18181b', color: '#fff',
              borderRadius: 14, padding: '13px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              animation: 'fadeIn 0.2s ease',
              minWidth: 300,
            }}>
              <span style={{ fontSize: 13, flex: 1 }}>
                🗑️ <b style={{ fontWeight: 700 }}>{entry.item.question?.slice(0, 24)}...</b> 삭제됨
              </span>
              <button
                onClick={() => handleUndo(entry.id)}
                style={{
                  background: '#7c6af0', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '6px 16px',
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >실행취소</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WrongNotesPage
