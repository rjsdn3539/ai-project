import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import useAuthStore from '../store/authStore'

const FREE_DAILY_LIMIT = 20
const getDailyUsed = () => parseInt(localStorage.getItem(`learningDaily_${new Date().toISOString().slice(0, 10)}`) || '0', 10)

const SUBJECTS = [
  { id: '영어', label: '영어', icon: '🇺🇸', desc: '문법 · 독해 · 어휘' },
  { id: '국사', label: '국사', icon: '📜', desc: '한국사 · 근현대사' },
  { id: '일본어', label: '일본어', icon: '🇯🇵', desc: '히라가나 · 문법 · 어휘' },
  { id: '자바스크립트', label: 'JavaScript', icon: '🟨', desc: 'ES6+ · DOM · 비동기' },
  { id: 'C++', label: 'C++', icon: '⚡', desc: '포인터 · STL · 메모리' },
  { id: '파이썬', label: 'Python', icon: '🐍', desc: '문법 · 자료형 · 라이브러리' },
  { id: '데이터베이스', label: '데이터베이스', icon: '🗄️', desc: 'SQL · 인덱스 · 트랜잭션' },
  { id: '자바', label: 'Java', icon: '☕', desc: 'OOP · JVM · 컬렉션' },
  { id: '스프링', label: 'Spring', icon: '🍃', desc: 'IoC · AOP · MVC' },
]

const DIFFICULTY_META = {
  EASY:   { label: '쉬움',   color: 'var(--success)', bg: 'var(--bg-success)', border: 'var(--bg-success)', emoji: '🟢' },
  MEDIUM: { label: '보통',   color: 'var(--warning)', bg: 'var(--bg-warning)', border: 'var(--border-warning)', emoji: '🟡' },
  HARD:   { label: '어려움', color: 'var(--danger)', bg: 'var(--bg-error)', border: 'var(--border-error)', emoji: '🔴' },
}

const COUNT_OPTIONS = [10, 15, 20, 25, 30, 35, 40]

function getAllSavedProgress() {
  const results = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('learningProgress_')) continue
    try {
      const data = JSON.parse(localStorage.getItem(key) || 'null')
      if (data) results.push(data)
    } catch {}
  }
  return results.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
}

function LearningPage() {
  const { user } = useAuthStore()
  const isFree = (user?.subscriptionTier || 'FREE') === 'FREE'
  const dailyUsed = getDailyUsed()
  const remaining = isFree ? Math.max(0, FREE_DAILY_LIMIT - dailyUsed) : Infinity
  const availableOptions = COUNT_OPTIONS.filter(n => n <= remaining)

  const [subject, setSubject] = useState('')
  const [savedList, setSavedList] = useState(() => getAllSavedProgress())
  const [count, setCount] = useState(() => {
    const def = 10
    if (isFree && remaining < def) return availableOptions[0] || 0
    return def
  })
  const [difficulty, setDifficulty] = useState(
    localStorage.getItem('placementDifficulty') || 'MEDIUM'
  )
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const navigate = useNavigate()

  const placementDone = localStorage.getItem('placementDone') === 'true'
  const diffMeta      = DIFFICULTY_META[difficulty]

  // 저장된 진행상황 감지
  const savedProgress = subject
    ? JSON.parse(localStorage.getItem(`learningProgress_${subject}_${difficulty}`) || 'null')
    : null
  const savedAnsweredCount = savedProgress ? Object.keys(savedProgress.userAnswers || {}).length : 0

  const handleDifficultyChange = (d) => {
    setDifficulty(d)
    localStorage.setItem('placementDifficulty', d)
  }

  const handleStart = () => {
    if (!subject) { alert('과목을 선택해주세요.'); return }
    if (isFree && remaining === 0) return
    navigate('/learning/session', { state: { subject, difficulty, count } })
  }

  const handleResume = () => {
    navigate('/learning/session', {
      state: {
        subject: savedProgress.subject,
        difficulty: savedProgress.difficulty,
        count: savedProgress.count,
        savedProgress,
      }
    })
  }

  const handleDiscardAndStart = () => {
    localStorage.removeItem(`learningProgress_${subject}_${difficulty}`)
    handleStart()
  }

  const handleResumeFromList = (progress) => {
    navigate('/learning/session', {
      state: {
        subject: progress.subject,
        difficulty: progress.difficulty,
        count: progress.count,
        savedProgress: progress,
      }
    })
  }

  const handleDeleteFromList = (progress, e) => {
    e.stopPropagation()
    localStorage.removeItem(`learningProgress_${progress.subject}_${progress.difficulty}`)
    setSavedList(getAllSavedProgress())
  }

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>AI 학습</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>AI가 맞춤 문제를 생성하고 상세한 해설을 제공합니다.</p>
        </div>
        {(() => {
          const count = JSON.parse(localStorage.getItem('wrongNotes') || '[]').length
          return count > 0 ? (
            <button
              onClick={() => navigate('/learning/wrong-notes')}
              style={{
                background: 'var(--surface)', border: '1.5px solid var(--border-error)', borderRadius: 12,
                padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-error)' }}
            >
              <span style={{ fontSize: 16 }}>📒</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>오답노트</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', margin: 0 }}>{count}개</p>
              </div>
            </button>
          ) : null
        })()}
      </div>

      {/* 저장된 진행상황 목록 */}
      {savedList.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>📌 이어서 풀기</span>
            <span style={{
              background: 'var(--primary-light)', color: 'var(--primary)',
              borderRadius: 99, padding: '2px 9px', fontSize: 12, fontWeight: 700,
            }}>{savedList.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedList.map((prog, idx) => {
              const subjectInfo = SUBJECTS.find(s => s.id === prog.subject)
              const diffMeta = DIFFICULTY_META[prog.difficulty] || DIFFICULTY_META.MEDIUM
              const answered = Object.keys(prog.userAnswers || {}).length
              const pct = Math.round((answered / prog.count) * 100)
              const dateStr = prog.savedAt
                ? new Date(prog.savedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : ''
              return (
                <div
                  key={idx}
                  onClick={() => handleResumeFromList(prog)}
                  style={{
                    background: 'var(--surface)', borderRadius: 14,
                    border: '1.5px solid var(--border-light)',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                >
                  {/* 과목 아이콘 */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {subjectInfo?.icon || '📚'}
                  </div>

                  {/* 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                        {subjectInfo?.label || prog.subject}
                      </span>
                      <span style={{
                        background: diffMeta.bg, color: diffMeta.color,
                        borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700,
                        border: `1px solid ${diffMeta.border}`,
                      }}>
                        {diffMeta.emoji} {diffMeta.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {dateStr}
                      </span>
                    </div>
                    {/* 진행 바 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        flex: 1, height: 6, background: 'var(--border-light)',
                        borderRadius: 99, overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${pct}%`, height: '100%',
                          background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                          borderRadius: 99, transition: 'width 0.4s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {answered} / {prog.count}문제
                      </span>
                    </div>
                  </div>

                  {/* 버튼들 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{
                      background: 'var(--primary)', color: '#fff',
                      borderRadius: 10, padding: '8px 16px',
                      fontSize: 13, fontWeight: 700,
                    }}>
                      ▶ 이어서
                    </div>
                    <button
                      onClick={(e) => handleDeleteFromList(prog, e)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'none', border: '1.5px solid var(--border)',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, transition: 'all 0.15s', fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-error)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'var(--border-error)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                    >✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Placement banner */}
      {!placementDone ? (
        <div style={{
          background: 'linear-gradient(130deg, #3d2ee0 0%, #7c6af0 52%, #0ea5e9 100%)',
          borderRadius: 20, padding: '28px 36px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
          boxShadow: '0 10px 36px rgba(61,46,224,0.28)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: 200, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.055)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🎯</div>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 6 }}>수준 진단 테스트를 먼저 해보세요!</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.65 }}>
              20문제로 여러분의 수준을 파악하고 AI가 최적 난이도를 자동 설정합니다.
            </p>
          </div>
          <button
            onClick={() => navigate('/learning/placement')}
            style={{
              background: 'var(--surface)', color: '#3d2ee0', border: 'none', borderRadius: 12,
              padding: '14px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
          >테스트 시작 →</button>
        </div>
      ) : (
        <div style={{
          background: diffMeta.bg, border: `1.5px solid ${diffMeta.border}`,
          borderRadius: 16, padding: '16px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>AI 추천 난이도</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: diffMeta.color }}>{diffMeta.emoji} {diffMeta.label}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/learning/placement')}
            style={{
              background: 'none', border: `1px solid ${diffMeta.border}`, color: diffMeta.color,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              padding: '7px 16px', borderRadius: 8, transition: 'all 0.15s',
            }}
          >재진단 →</button>
        </div>
      )}

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>

        {/* Subject grid */}
        <div style={{
          background: 'var(--surface)', borderRadius: 20,
          padding: '32px 36px',
          boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)',
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 20 }}>과목 선택</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {SUBJECTS.map((s) => {
              const active = subject === s.id
              return (
                <div
                  key={s.id}
                  onClick={() => setSubject(s.id)}
                  style={{
                    padding: '28px 16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary-light)' : 'var(--surface)',
                    transition: 'all 0.18s ease',
                    transform: active ? 'translateY(-3px)' : 'none',
                    boxShadow: active ? '0 8px 24px rgba(124,106,240,0.22)' : 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = 'var(--primary-border)'
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = 'var(--shadow)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }
                  }}
                >
                  <div style={{ fontSize: 38, marginBottom: 10 }}>{s.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: active ? 'var(--primary)' : 'var(--text)', marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel: count + start */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Count picker */}
          <div style={{
            background: 'var(--surface)', borderRadius: 20,
            padding: '28px 28px',
            boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>문제 수</h2>
              {isFree && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                  background: remaining === 0 ? 'var(--bg-error)' : 'var(--bg-success)',
                  color: remaining === 0 ? '#ef4444' : 'var(--success)',
                  border: `1px solid ${remaining === 0 ? 'var(--border-error)' : 'var(--bg-success)'}`,
                }}>
                  오늘 {remaining === 0 ? '0' : `${remaining}`}문제 남음
                </span>
              )}
            </div>

            {remaining === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>오늘 학습 한도를 모두 사용했습니다.</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>내일 다시 이용하거나 플랜을 업그레이드하세요.</p>
                <button
                  onClick={() => navigate('/subscription')}
                  style={{
                    padding: '8px 18px', borderRadius: 9, border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >플랜 업그레이드 →</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {COUNT_OPTIONS.map((n) => {
                    const disabled = isFree && n > remaining
                    return (
                      <button
                        key={n}
                        onClick={() => !disabled && setCount(n)}
                        style={{
                          height: 52, borderRadius: 12, fontWeight: 800,
                          fontSize: 16, fontFamily: 'inherit',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          border: `2px solid ${count === n ? 'var(--primary)' : 'var(--border)'}`,
                          background: disabled ? 'var(--bg)' : count === n ? 'var(--primary)' : 'var(--surface)',
                          color: disabled ? 'var(--text-muted)' : count === n ? '#fff' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                          boxShadow: count === n ? '0 4px 14px rgba(124,106,240,0.35)' : 'none',
                          transform: count === n ? 'scale(1.06)' : 'none',
                          opacity: disabled ? 0.5 : 1,
                        }}
                      >{n}</button>
                    )
                  })}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14, textAlign: 'center' }}>
                  {count}문제 · 약 {count}~{count * 2}분 소요
                </p>
              </>
            )}
          </div>

          {/* Difficulty picker */}
          <div style={{
            background: 'var(--surface)', borderRadius: 20,
            padding: '24px 24px',
            boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)',
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 14 }}>난이도</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(DIFFICULTY_META).map(([key, meta]) => {
                const active = difficulty === key
                return (
                  <button
                    key={key}
                    onClick={() => handleDifficultyChange(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left',
                      border: `2px solid ${active ? meta.color : 'var(--border)'}`,
                      background: active ? meta.bg : 'var(--surface)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${active ? meta.color : 'var(--border)'}`,
                      background: active ? meta.color : 'var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--surface)' }} />}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? meta.color : 'var(--text-secondary)' }}>
                      {meta.emoji} {meta.label}
                    </span>
                    {placementDone && localStorage.getItem('placementDifficulty') === key && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: meta.color, fontWeight: 600, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 20, padding: '2px 7px' }}>
                        AI 추천
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 이어서 풀기 배너 */}
          {savedProgress && (
            <div style={{
              background: 'var(--bg-success)', border: '1.5px solid var(--border-success)', borderRadius: 14,
              padding: '16px 18px', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 2 }}>📌 저장된 진행상황</p>
                  <p style={{ fontSize: 12, color: 'var(--success)' }}>
                    {savedProgress.subject} · {DIFFICULTY_META[savedProgress.difficulty]?.label} · {savedAnsweredCount}/{savedProgress.count}문제 완료
                  </p>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {new Date(savedProgress.savedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleResume} style={{
                  flex: 2, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  background: 'var(--success)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                }}>▶ 이어서 풀기</button>
                <button onClick={handleDiscardAndStart} style={{
                  flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                }}>처음부터</button>
              </div>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={() => {
              if (savedProgress) { setShowDiscardConfirm(true) } else { handleStart() }
            }}
            disabled={!subject || (isFree && remaining === 0)}
            style={{
              width: '100%', padding: '18px',
              background: subject && !(isFree && remaining === 0)
                ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                : 'var(--border)',
              color: subject && !(isFree && remaining === 0) ? '#fff' : 'var(--text-muted)',
              border: 'none', borderRadius: 16,
              fontSize: 16, fontWeight: 800,
              cursor: subject && !(isFree && remaining === 0) ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              boxShadow: subject ? '0 8px 28px rgba(124,106,240,0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { if (subject) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
          >
            {subject ? `📚 ${subject} 학습 시작 →` : '과목을 선택해주세요'}
          </button>

          {/* 진행상황 삭제 확인 모달 */}
          {showDiscardConfirm && (
            <div
              onClick={() => setShowDiscardConfirm(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 999,
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'var(--surface)', borderRadius: 20, padding: '36px 40px',
                  width: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                  진행상황을 삭제할까요?
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
                  저장된 진행상황({savedAnsweredCount}/{savedProgress?.count}문제 완료)이 삭제되고<br />처음부터 새로 시작합니다.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowDiscardConfirm(false)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                      background: 'var(--bg)', border: '1.5px solid var(--border)',
                      color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >취소</button>
                  <button
                    onClick={() => { setShowDiscardConfirm(false); handleDiscardAndStart() }}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: 'var(--danger)', border: 'none',
                      color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >삭제하고 시작</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LearningPage
