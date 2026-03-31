import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import {
  clearWrongNotes,
  createWrongNote,
  deleteWrongNote,
  listWrongNotes,
} from '../api/learning'

const SUBJECT_ICON = { 영어: '🇺🇸', 국사: '📜', 파이썬: '🐍', 자바스크립트: '🟨', 'C++': '⚡', 일본어: '🇯🇵', 데이터베이스: '🗄️', 자바: '☕', 스프링: '🍃' }
const DIFF_LABEL = { EASY: '쉬움', MEDIUM: '보통', HARD: '어려움' }
const DIFF_COLOR = { EASY: 'var(--success)', MEDIUM: 'var(--warning)', HARD: '#ef4444' }

function WrongNotesPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('전체')
  const [expandedId, setExpandedId] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [undoQueue, setUndoQueue] = useState([])

  useEffect(() => {
    let cancelled = false

    const loadNotes = async () => {
      setLoading(true)
      try {
        const { data } = await listWrongNotes()
        if (!cancelled) {
          setNotes(Array.isArray(data?.data) ? data.data : [])
        }
      } catch {
        if (!cancelled) {
          setNotes([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadNotes()
    return () => {
      cancelled = true
    }
  }, [])

  const subjects = ['전체', ...Array.from(new Set(notes.map((n) => n.subject)))]
  const filtered = filterSubject === '전체' ? notes : notes.filter((n) => n.subject === filterSubject)

  const sorted = [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const grouped = sorted.reduce((acc, note) => {
    const dateKey = note.date || '날짜 없음'
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(note)
    return acc
  }, {})

  const handleDelete = async (note) => {
    const previousNotes = notes
    const updated = notes.filter((item) => item.id !== note.id)
    setNotes(updated)

    try {
      await deleteWrongNote(note.id)
    } catch {
      setNotes(previousNotes)
      alert('오답 삭제에 실패했습니다.')
      return
    }

    const timer = setTimeout(() => {
      setUndoQueue((queue) => queue.filter((entry) => entry.clientKey !== note.id))
    }, 4000)
    setUndoQueue((queue) => [...queue, { clientKey: note.id, item: note, timer }])
  }

  const handleUndo = async (clientKey) => {
    const entry = undoQueue.find((item) => item.clientKey === clientKey)
    if (!entry) return

    clearTimeout(entry.timer)
    setUndoQueue((queue) => queue.filter((item) => item.clientKey !== clientKey))

    try {
      const { data } = await createWrongNote({
        date: entry.item.date,
        subject: entry.item.subject,
        difficulty: entry.item.difficulty,
        question: entry.item.question,
        type: entry.item.type,
        choices: entry.item.choices || [],
        answer: entry.item.answer,
        userAnswer: entry.item.userAnswer,
        aiFeedback: entry.item.aiFeedback,
        explanation: entry.item.explanation,
      })
      const restored = data?.data || entry.item
      setNotes((current) => [restored, ...current])
    } catch {
      alert('오답 복구에 실패했습니다.')
    }
  }

  const handleClearAll = async () => {
    try {
      await clearWrongNotes()
      setNotes([])
      setConfirmClear(false)
    } catch {
      alert('오답노트 전체 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p style={{ fontSize: 15 }}>오답노트를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setFilterSubject(subject)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  border: `1.5px solid ${filterSubject === subject ? '#4f46e5' : 'var(--border)'}`,
                  background: filterSubject === subject ? '#4f46e5' : 'var(--surface)',
                  color: filterSubject === subject ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {subject !== '전체' ? `${SUBJECT_ICON[subject] || '📚'} ` : ''}{subject}
                {subject !== '전체' && <span style={{ marginLeft: 4, opacity: 0.75 }}>({notes.filter((n) => n.subject === subject).length})</span>}
              </button>
            ))}
          </div>

          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{date}</span>
                <span style={{ fontWeight: 400 }}>· {items.length}개</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((note) => {
                  const expanded = expandedId === note.id
                  return (
                    <div key={note.id} style={{
                      background: 'var(--surface)', borderRadius: 14,
                      border: '1px solid var(--border-error)', borderLeft: '4px solid var(--danger)',
                      boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
                    }}>
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
                            onClick={(event) => { event.stopPropagation(); handleDelete(note) }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '2px 4px', lineHeight: 1, transition: 'color 0.15s' }}
                            title="삭제"
                            onMouseEnter={(event) => event.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(event) => event.currentTarget.style.color = 'var(--text-muted)'}
                          >×</button>
                        </div>
                      </div>

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

      {undoQueue.length > 0 && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {undoQueue.map((entry) => (
            <div key={entry.clientKey} style={{
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
                onClick={() => handleUndo(entry.clientKey)}
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
