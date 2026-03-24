import { useState } from 'react'

const lsGet = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
const lsSet = (key, val) => localStorage.setItem(key, JSON.stringify(val))
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

const PRIMARY = 'var(--primary)'
const BORDER = 'var(--border)'

const INTERVIEW_TYPES = ['서류 전형', '1차 면접', '2차 면접', '임원 면접', '최종 면접', '코딩 테스트', '과제 전형', '기타']
const STATUS_OPTIONS = [
  { value: 'upcoming', label: '예정', color: '#7c6af0', bg: 'var(--bg-purple)' },
  { value: 'done',     label: '완료', color: 'var(--success)', bg: 'var(--bg-success)' },
  { value: 'canceled', label: '취소', color: 'var(--text-muted)', bg: 'var(--bg-slate)' },
]

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

function DdayBadge({ dateStr }) {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / 86400000)
  if (diff < 0) return null
  const label = diff === 0 ? 'D-Day' : `D-${diff}`
  const color = diff <= 3 ? '#ef4444' : diff <= 7 ? 'var(--warning)' : '#7c6af0'
  return <span style={{ fontSize: 11, fontWeight: 800, color, background: color + '18', borderRadius: 99, padding: '2px 8px' }}>{label}</span>
}

function ScheduleCard({ item, onStatusChange, onDelete }) {
  const s = STATUS_OPTIONS.find((x) => x.value === item.status) || STATUS_OPTIONS[0]
  const dateStr = item.date ? new Date(item.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) : ''

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '18px 22px', border: `1.5px solid ${item.status === 'upcoming' ? 'var(--primary)' : 'var(--border-light)'}`, boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* 날짜 블록 */}
      <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
        {item.date ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>
              {new Date(item.date).toLocaleDateString('ko-KR', { month: 'short' })}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.status === 'upcoming' ? PRIMARY : 'var(--text-muted)', lineHeight: 1 }}>
              {new Date(item.date).getDate()}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 22 }}>📅</div>
        )}
      </div>

      {/* 내용 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', margin: 0 }}>{item.company}</p>
          <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 99, padding: '2px 8px' }}>{s.label}</span>
          {item.status === 'upcoming' && <DdayBadge dateStr={item.date} />}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
          {item.position && <span style={{ fontWeight: 600 }}>{item.position}</span>}
          {item.type && <span style={{ color: 'var(--text-muted)' }}> · {item.type}</span>}
        </p>
        {dateStr && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 2px' }}>
            📅 {dateStr}{item.time ? ` · ${item.time}` : ''}
          </p>
        )}
        {item.memo && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0', fontStyle: 'italic' }}>{item.memo}</p>}

        {/* 상태 변경 */}
        <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
          {STATUS_OPTIONS.map(({ value, label, color, bg }) => (
            <button key={value} onClick={() => onStatusChange(value)} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: `1.5px solid ${item.status === value ? color : BORDER}`, background: item.status === value ? bg : 'var(--surface)', color: item.status === value ? color : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* 삭제 */}
      <button
        onClick={onDelete}
        title="삭제 (실행취소 가능)"
        style={{ flexShrink: 0, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, transition: 'color 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >×</button>
    </div>
  )
}

function SchedulePage() {
  const [items, setItems] = useState(() => lsGet('schedule_items'))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ company: '', position: '', type: '1차 면접', date: '', time: '', memo: '' })
  const [focused, setFocused] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [undoQueue, setUndoQueue] = useState([])

  const save = (next) => { setItems(next); lsSet('schedule_items', next) }

  const handleAdd = () => {
    if (!form.company.trim()) { setError('회사명을 입력해주세요.'); return }
    save([...items, { id: uid(), status: 'upcoming', ...form }])
    setForm({ company: '', position: '', type: '1차 면접', date: '', time: '', memo: '' })
    setShowForm(false); setError('')
  }

  const handleStatusChange = (id, status) => save(items.map((i) => i.id === id ? { ...i, status } : i))

  const handleDelete = (id) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const updated = items.filter((i) => i.id !== id)
    save(updated)
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
    const current = lsGet('schedule_items')
    const restored = [...current, entry.item]
    save(restored)
  }

  const ist = (f) => inputStyle(focused, f)

  const upcoming = items.filter((i) => i.status === 'upcoming' && i.date).sort((a, b) => new Date(a.date) - new Date(b.date))
  const noDate   = items.filter((i) => i.status === 'upcoming' && !i.date)
  const rest     = items.filter((i) => i.status !== 'upcoming')

  const filtered = filter === 'all' ? [...upcoming, ...noDate, ...rest]
                 : filter === 'upcoming' ? [...upcoming, ...noDate]
                 : items.filter((i) => i.status === filter)

  const upcomingCount = items.filter((i) => i.status === 'upcoming').length

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>면접 일정</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>예정된 면접 일정을 관리하고 D-day를 확인하세요.</p>
      </div>

      {/* 요약 카드 */}
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: '전체 일정', value: items.length, color: '#7c6af0' },
            { label: '예정', value: upcomingCount, color: '#7c6af0' },
            { label: '완료', value: items.filter((i) => i.status === 'done').length, color: 'var(--success)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--surface)', borderRadius: 14, padding: '16px 20px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 폼 */}
      {showForm && (
        <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '24px 28px', boxShadow: 'var(--shadow-sm)', border: `1.5px dashed ${PRIMARY}`, marginBottom: 20 }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: PRIMARY, marginBottom: 16 }}>+ 새 면접 일정 추가</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input placeholder="회사명 *" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} onFocus={() => setFocused('company')} onBlur={() => setFocused(null)} style={ist('company')} />
              <input placeholder="지원 직무" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} onFocus={() => setFocused('position')} onBlur={() => setFocused(null)} style={ist('position')} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>전형 단계</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {INTERVIEW_TYPES.map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, type: t })} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, border: `1.5px solid ${form.type === t ? PRIMARY : BORDER}`, background: form.type === t ? 'var(--primary-light)' : 'var(--surface)', color: form.type === t ? PRIMARY : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>날짜</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} onFocus={() => setFocused('date')} onBlur={() => setFocused(null)} style={ist('date')} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>시간</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} onFocus={() => setFocused('time')} onBlur={() => setFocused(null)} style={ist('time')} />
              </div>
            </div>

            <input placeholder="메모 (선택)" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} onFocus={() => setFocused('memo')} onBlur={() => setFocused(null)} style={ist('memo')} />

            {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setError('') }} style={{ padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
              <button onClick={handleAdd} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 목록 */}
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '24px 28px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', '전체'], ['upcoming', '예정'], ['done', '완료'], ['canceled', '취소']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, border: `1.5px solid ${filter === val ? PRIMARY : BORDER}`, background: filter === val ? 'var(--primary-light)' : 'var(--surface)', color: filter === val ? PRIMARY : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
            ))}
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ 일정 추가</button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <p style={{ fontSize: 15, marginBottom: 16 }}>등록된 면접 일정이 없습니다.</p>
            <button onClick={() => setShowForm(true)} style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ 지금 추가하기</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((item) => (
              <ScheduleCard key={item.id} item={item} onStatusChange={(status) => handleStatusChange(item.id, status)} onDelete={() => handleDelete(item.id)} />
            ))}
          </div>
        )}
      </div>

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
                🗑️ <b style={{ fontWeight: 700 }}>{entry.item.company}</b> 일정 삭제됨
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

export default SchedulePage
