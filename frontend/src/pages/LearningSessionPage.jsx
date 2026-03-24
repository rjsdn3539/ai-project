import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useBlocker } from 'react-router-dom'
import { createPortal } from 'react-dom'
import * as learningApi from '../api/learning'
import Button from '../components/Button'
import useAuthStore from '../store/authStore'
import { getStats, saveStats, updateStreak, checkAndUnlock } from '../utils/achievements'

const PROGRESS_KEY = (subject, difficulty) => `learningProgress_${subject}_${difficulty}`

const DIFFICULTY_LABEL = { EASY: '쉬움', MEDIUM: '보통', HARD: '어려움' }
const DIFFICULTY_COLOR = { EASY: '#16a34a', MEDIUM: '#d97706', HARD: '#dc2626' }
const DIFFICULTY_BG    = { EASY: '#f0fdf4', MEDIUM: '#fffbeb', HARD: '#fef2f2' }

const LOADING_STEPS = [
  '과목 분석 중',
  'AI 문제 설계 중',
  '난이도 최적화 중',
  '문제 생성 중',
  '마무리 중',
]

function LearningLoadingScreen({ subject, difficulty }) {
  const [step, setStep] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep(s => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, 900)
    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)
    return () => { clearInterval(stepTimer); clearInterval(dotTimer) }
  }, [])

  const diffColor = DIFFICULTY_COLOR[difficulty] || 'var(--primary)'
  const diffBg    = DIFFICULTY_BG[difficulty]    || 'var(--primary-light)'
  const diffLabel = DIFFICULTY_LABEL[difficulty] || difficulty

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 380,
        animation: 'slideUpSm 0.3s ease both',
      }}>
        {/* 아이콘 */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c6af0 0%, #0ea5e9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40,
            boxShadow: '0 0 0 16px rgba(124,106,240,0.1), 0 0 0 32px rgba(124,106,240,0.05)',
            animation: 'loadingPulse 2s ease-in-out infinite',
          }}>🤖</div>
        </div>

        {/* 제목 */}
        <h2 style={{
          fontSize: 22, fontWeight: 800, color: 'var(--text)',
          marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          AI가 문제를 만들고 있어요
        </h2>

        {/* 과목 + 난이도 뱃지 */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
          {subject && (
            <span style={{
              background: 'var(--bg-indigo)', color: 'var(--primary)',
              border: '1px solid var(--border-indigo)',
              borderRadius: 99, padding: '4px 14px',
              fontSize: 13, fontWeight: 700,
            }}>{subject}</span>
          )}
          {difficulty && (
            <span style={{
              background: diffBg, color: diffColor,
              border: `1px solid ${diffBg}`,
              borderRadius: 99, padding: '4px 14px',
              fontSize: 13, fontWeight: 700,
            }}>{diffLabel}</span>
          )}
        </div>

        {/* 진행 단계 */}
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1.5px solid var(--border-light)',
          padding: '20px 28px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 24,
        }}>
          {LOADING_STEPS.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '7px 0',
              borderBottom: i < LOADING_STEPS.length - 1 ? '1px solid var(--border-light)' : 'none',
              opacity: i > step ? 0.3 : 1,
              transition: 'opacity 0.4s ease',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < step ? '#16a34a' : i === step ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.4s ease',
              }}>
                {i < step ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i === step ? (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#fff',
                    animation: 'blink 1s ease-in-out infinite',
                  }} />
                ) : null}
              </div>
              <span style={{
                fontSize: 13, fontWeight: i === step ? 700 : 500,
                color: i < step ? 'var(--success)' : i === step ? 'var(--text)' : 'var(--text-muted)',
                transition: 'color 0.4s ease',
              }}>
                {s}{i === step ? dots : i < step ? ' ✓' : ''}
              </span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          보통 5~10초 정도 소요됩니다
        </p>
      </div>

      <style>{`
        @keyframes loadingPulse {
          0%, 100% { box-shadow: 0 0 0 16px rgba(124,106,240,0.1), 0 0 0 32px rgba(124,106,240,0.05); }
          50%       { box-shadow: 0 0 0 20px rgba(124,106,240,0.15), 0 0 0 40px rgba(124,106,240,0.06); }
        }
      `}</style>
    </div>
  )
}

const getDailyKey = () => `learningDaily_${new Date().toISOString().slice(0, 10)}`
const getDailyUsed = () => parseInt(localStorage.getItem(getDailyKey()) || '0', 10)
const addDailyUsed = (count) => {
  const key = getDailyKey()
  localStorage.setItem(key, getDailyUsed() + count)
}

function ResultSummary({ problems, results, subject, onRetry }) {
  const [tab, setTab] = useState('all')
  const navigate = useNavigate()

  const allItems = problems.map((p, i) => ({ ...p, ...(results[i] || {}) }))
  const score = allItems.filter(x => x.isCorrect).length
  const wrongCount = allItems.filter(x => !x.isCorrect).length
  const pct = Math.round(score / problems.length * 100)

  const displayed = tab === 'all' ? allItems
    : tab === 'correct' ? allItems.filter(x => x.isCorrect)
    : allItems.filter(x => !x.isCorrect)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 18, padding: '36px',
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)',
        textAlign: 'center', marginBottom: 16,
      }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎓</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>학습 완료!</h2>
        <div style={{ fontSize: 52, fontWeight: 800, marginBottom: 4, color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : '#ef4444' }}>
          {pct}%
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          {problems.length}문제 중 <strong style={{ color: 'var(--success)' }}>{score}문제 정답</strong>
          &nbsp;·&nbsp;
          <strong style={{ color: '#ef4444' }}>{wrongCount}문제 오답</strong>
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {wrongCount > 0 && (
            <Button variant="subtle" onClick={() => navigate('/learning/wrong-notes')}>
              📒 오답노트 보기
            </Button>
          )}
          <Button variant="ghost" onClick={onRetry}>다시 학습</Button>
          <Button onClick={() => navigate('/dashboard')}>대시보드로 →</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { key: 'all', label: `전체 (${allItems.length})` },
          { key: 'correct', label: `✓ 정답 (${score})` },
          { key: 'wrong', label: `✕ 오답 (${wrongCount})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            border: `1.5px solid ${tab === key ? '#4f46e5' : 'var(--border)'}`,
            background: tab === key ? '#4f46e5' : 'var(--surface)',
            color: tab === key ? '#fff' : 'var(--text-secondary)',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.map((item, i) => (
          <div key={i} style={{
            background: 'var(--surface)', borderRadius: 14, padding: '20px',
            boxShadow: 'var(--shadow-sm)',
            border: `1px solid ${item.isCorrect ? 'var(--bg-success)' : 'var(--border-error)'}`,
            borderLeft: `4px solid ${item.isCorrect ? 'var(--success)' : '#ef4444'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {item.question}
              </p>
              <span style={{
                marginLeft: 12, flexShrink: 0, fontSize: 13, fontWeight: 700,
                color: item.isCorrect ? 'var(--success)' : '#dc2626',
                background: item.isCorrect ? 'var(--bg-success)' : 'var(--bg-error)',
                padding: '3px 10px', borderRadius: 20,
              }}>
                {item.isCorrect ? '✓ 정답' : '✕ 오답'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: item.aiFeedback ? 10 : 0 }}>
              {!item.isCorrect && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--bg-error)', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0, fontSize: 12 }}>✕ 내 답변</span>
                  <span style={{ fontSize: 13, color: 'var(--danger)' }}>{item.userAnswer || '(미선택)'}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--bg-success)', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0, fontSize: 12 }}>✓ 정답</span>
                <span style={{ fontSize: 13, color: 'var(--success)' }}>{item.answer}</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-indigo)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-indigo)' }}>
              <p style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 4 }}>AI 해설</p>
              {item.aiFeedback
                ? <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.aiFeedback}</p>
                : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>생성 중...</p>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LearningSessionPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [problems, setProblems] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  // userAnswers: { [idx]: string } — 각 문제별 선택한 답
  const [userAnswers, setUserAnswers] = useState({})
  // results: { [idx]: {isCorrect, aiFeedback, userAnswer} } — 채점 결과
  const [results, setResults] = useState({})
  const [answer, setAnswer] = useState('') // 현재 문제 선택값
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  // 힌트: { [idx]: { text, loading } }
  const [hints, setHints] = useState({})
  const [showExitModal, setShowExitModal] = useState(false)
  const totalCount = state?.count || 1

  // 우발적 네비게이션 차단
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !finished && problems.length > 0 && currentLocation.pathname !== nextLocation.pathname
  )

  // 브라우저 닫기/새로고침 차단
  useEffect(() => {
    if (finished) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [finished])

  const saveAndExit = () => {
    const answeredCount = Object.keys(userAnswers).length
    if (problems.length > 0 && answeredCount < totalCount) {
      localStorage.setItem(PROGRESS_KEY(state.subject, state.difficulty), JSON.stringify({
        subject: state.subject, difficulty: state.difficulty, count: state.count,
        problems, currentIdx, userAnswers, results,
        savedAt: new Date().toISOString(),
      }))
    }
    if (blocker.state === 'blocked') blocker.proceed()
    else navigate('/learning')
  }

  const cancelExit = () => {
    setShowExitModal(false)
    if (blocker.state === 'blocked') blocker.reset()
  }

  // blocker가 활성화되면 모달 표시
  useEffect(() => {
    if (blocker.state === 'blocked') setShowExitModal(true)
  }, [blocker.state])

  useEffect(() => {
    if (!state) { navigate('/learning'); return }

    // 저장된 진행상황 복원
    if (state.savedProgress) {
      const sp = state.savedProgress
      setProblems(sp.problems || [])
      setCurrentIdx(sp.currentIdx || 0)
      setUserAnswers(sp.userAnswers || {})
      setResults(sp.results || {})
      setLoading(false)
      localStorage.removeItem(PROGRESS_KEY(state.subject, state.difficulty))
      return
    }

    let cancelled = false
    let firstProblemReceived = false

    const token = localStorage.getItem('accessToken')
    fetch('http://localhost:8080/api/learning/generate/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ subject: state.subject, difficulty: state.difficulty, count: state.count, type: 'MIX' }),
    }).then(response => {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      function read() {
        return reader.read().then(({ done, value }) => {
          if (done || cancelled) return
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop()

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.replace(/^data:\s*/, '').trim()
              if (data === '[DONE]') return
              try {
                const problem = JSON.parse(data)
                if (!problem.error) {
                  setProblems(prev => [...prev, problem])
                  if (!firstProblemReceived) {
                    firstProblemReceived = true
                    setLoading(false)
                  }
                }
              } catch (e) { /* ignore parse errors */ }
            }
          }
          return read()
        })
      }
      return read()
    }).catch(() => {
      if (!cancelled) { setProblems(mockProblems()); setLoading(false) }
    })

    return () => { cancelled = true }
  }, [])

  // 문제 이동 시 이전 답변 복원
  useEffect(() => {
    setAnswer(userAnswers[currentIdx] || '')
  }, [currentIdx])

  const mockProblems = () => [
    { type: 'MULTIPLE', question: '다음 중 올바른 영어 문장은?', choices: ['I am a student', 'I is a student', 'I are a student', 'I be a student'], answer: 'I am a student', explanation: 'be 동사는 주어에 따라 am/is/are를 사용합니다.' },
  ]

  const problem = problems[currentIdx]
  const answeredCount = Object.keys(results).length
  const allAnswered = problems.length === totalCount && answeredCount === totalCount
  const isLastProblem = currentIdx === totalCount - 1
  const hasResult = results[currentIdx] !== undefined
  const isModifying = hasResult && answer !== userAnswers[currentIdx]
  const hint = hints[currentIdx]
  const isGenerating = problems.length < totalCount

  const handleHint = async () => {
    if (hint?.text || hint?.loading) return
    setHints(prev => ({ ...prev, [currentIdx]: { loading: true } }))
    try {
      const { data } = await learningApi.getHint({
        question: problem.question,
        choices: problem.choices || [],
        subject: state?.subject || '',
        difficulty: state?.difficulty || 'MEDIUM',
      })
      setHints(prev => ({ ...prev, [currentIdx]: { text: data.data?.hint || data.hint || '힌트를 불러오지 못했습니다.' } }))
    } catch {
      setHints(prev => ({ ...prev, [currentIdx]: { text: '힌트를 불러오지 못했습니다.' } }))
    }
  }

  const handleSubmit = () => {
    if (!answer) { alert('선택지를 골라주세요.'); return }
    const isCorrect = answer === problem.answer
    const idx = currentIdx

    // 즉시 결과 반영 + 다음 문제 이동 (딜레이 없음)
    setUserAnswers(prev => ({ ...prev, [idx]: answer }))
    setResults(prev => ({ ...prev, [idx]: { isCorrect, aiFeedback: null, userAnswer: answer } }))
    if (!isLastProblem) setCurrentIdx(i => i + 1)

    // AI 피드백은 백그라운드에서 요청
    learningApi.submitAttempt({
      question: problem.question,
      correctAnswer: problem.answer,
      userAnswer: answer,
      explanation: problem.explanation,
    }).then(({ data }) => {
      const fb = data.data?.aiFeedback
      if (fb) setResults(prev => ({ ...prev, [idx]: { ...prev[idx], aiFeedback: fb } }))
    }).catch(() => {
      const fb = isCorrect ? '정답입니다!' : `오답입니다. 정답은 [${problem.answer}]입니다.`
      setResults(prev => ({ ...prev, [idx]: { ...prev[idx], aiFeedback: fb } }))
    })
  }

  const handleFinish = () => {
    // 오답 저장
    const saveKey = `wrongNotes_saved_${state?.subject}_${problems.length}_${Date.now()}`
    const wrongItems = problems
      .map((p, i) => ({ ...p, ...(results[i] || {}) }))
      .filter(x => !x.isCorrect)
      .map(item => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        date: new Date().toISOString().slice(0, 10),
        subject: state?.subject || '',
        difficulty: state?.difficulty || '',
        question: item.question,
        type: item.type,
        choices: item.choices || [],
        answer: item.answer,
        userAnswer: item.userAnswer,
        aiFeedback: item.aiFeedback || '',
        explanation: item.explanation || '',
      }))
    if (wrongItems.length > 0) {
      const prev = JSON.parse(localStorage.getItem('wrongNotes') || '[]')
      localStorage.setItem('wrongNotes', JSON.stringify([...prev, ...wrongItems]))
    }
    // 오늘 푼 문제 수 누적
    const answeredCountNow = Object.keys(results).length
    addDailyUsed(answeredCountNow)

    // ── Achievement tracking ───────────────────────────────────────────
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const hour = now.getHours()
    const allProblemsCorrect = Object.values(results).every((r) => r.isCorrect)
    const subject = state?.subject || ''

    const stats = getStats()
    let updated = { ...stats }

    // Increment study problem count
    updated.totalStudyProblems = (updated.totalStudyProblems || 0) + answeredCountNow

    // Perfect study session
    if (allProblemsCorrect && answeredCountNow > 0) {
      updated.hadPerfectStudy = true
    }

    // Time-based special achievements
    if (hour < 6) updated.studiedEarlyMorning = true
    if (hour >= 0 && hour < 4) updated.studiedLateNight = true
    if (hour >= 6 && hour < 9) updated.morningStudy = true

    // Weekend activity
    const dow = now.getDay()
    if (dow === 0 || dow === 6) updated.weekendActivity = true

    // Track subjects studied
    if (subject && !updated.subjectsStudied.includes(subject)) {
      updated.subjectsStudied = [...(updated.subjectsStudied || []), subject]
    }

    // Last study date + same-day bonus
    updated.lastStudyDate = today
    if (updated.lastInterviewDate === today) {
      updated.didBothSameDay = true
    }

    // Update streak
    updated = updateStreak(updated)
    saveStats(updated)
    checkAndUnlock(updated)
    // ──────────────────────────────────────────────────────────────────

    setFinished(true)
  }

  if (loading) {
    return <LearningLoadingScreen subject={state?.subject} difficulty={state?.difficulty} />
  }

  if (finished) {
    return (
      <ResultSummary
        problems={problems}
        results={results}
        subject={state?.subject}
        onRetry={() => navigate('/learning')}
      />
    )
  }

  const progress = Math.round((currentIdx + 1) / totalCount * 100)

  if (!problem) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>{currentIdx + 1}번 문제를 생성하고 있습니다...</p>
      </div>
    )
  }

  const exitModal = showExitModal && createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '36px 40px', width: 360, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>학습을 나가시겠어요?</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
          진행 상황을 저장해두면<br />나중에 이어서 풀 수 있습니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={saveAndExit} style={{ padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: '#4f46e5', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            저장하고 나가기
          </button>
          <button onClick={cancelExit} style={{ padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'var(--bg-warm)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>
            계속 풀기
          </button>
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      {exitModal}
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowExitModal(true)}
            style={{
              background: 'none', border: '1.5px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600,
              color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >← 나가기</button>
          {currentIdx > 0 && (
            <button
              onClick={() => setCurrentIdx(i => i - 1)}
              style={{
                background: 'var(--bg)', border: '1.5px solid var(--border)',
                borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              ← 이전
            </button>
          )}
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            {state?.subject} 학습
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 답한 문제 수 표시 */}
          {isGenerating && (
            <span style={{ fontSize: 11, color: 'var(--primary)', background: 'var(--bg-purple)', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
              생성 중 {problems.length}/{totalCount}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {answeredCount}/{totalCount} 완료
          </span>
          <span style={{
            background: 'var(--bg-indigo)', color: 'var(--primary)',
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          }}>
            {currentIdx + 1} / {totalCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#4f46e5', borderRadius: 99,
          width: `${progress}%`, transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: '28px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
      }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 }}>
          <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.75, color: 'var(--text)', whiteSpace: 'pre-line', flex: 1, margin: 0 }}>
            {problem.question}
          </p>
          <button
            onClick={handleHint}
            disabled={hint?.loading || !!hint?.text}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', borderRadius: 9, cursor: hint?.text ? 'default' : 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${hint?.text ? 'var(--border-warning)' : 'var(--bg-indigo)'}`,
              background: hint?.text ? 'var(--bg-warning)' : hint?.loading ? 'var(--bg-purple)' : 'var(--bg-indigo)',
              color: hint?.text ? 'var(--warning)' : hint?.loading ? '#7c3aed' : '#4f46e5',
              transition: 'all 0.15s',
              opacity: hint?.loading ? 0.7 : 1,
            }}
          >
            {hint?.loading ? '⏳ 생성 중...' : hint?.text ? '💡 힌트 확인됨' : '💡 힌트'}
          </button>
        </div>

        {/* 힌트 표시 */}
        {hint?.text && (
          <div style={{
            marginBottom: 18, padding: '12px 16px', borderRadius: 10,
            background: 'var(--bg-warning)', border: '1.5px solid var(--border-warning)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>힌트</p>
              <p style={{ fontSize: 13, color: 'var(--warning)', lineHeight: 1.7 }}>{hint.text}</p>
            </div>
          </div>
        )}

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
          {(problem.choices || []).map((c, i) => {
            const selected = answer === c

            return (
              <button
                key={c}
                onClick={() => setAnswer(c)}
                style={{
                  padding: '13px 16px', borderRadius: 10, textAlign: 'left',
                  cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                  border: `2px solid ${selected ? '#4f46e5' : 'var(--border)'}`,
                  background: selected ? 'var(--bg-indigo)' : 'var(--bg)',
                  color: selected ? 'var(--primary)' : 'var(--text)',
                  fontWeight: selected ? 600 : 400,
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={(e) => {
                  if (!selected) {
                    e.currentTarget.style.borderColor = 'var(--primary-light)'
                    e.currentTarget.style.background = 'var(--surface)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--bg)'
                  }
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: selected ? '#4f46e5' : 'var(--border-light)',
                  color: selected ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {['①','②','③','④','⑤'][i]}
                </span>
                {c}
              </button>
            )
          })}
        </div>

        {/* Action buttons */}
        {isLastProblem ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 마지막 문제 미제출 시 제출 버튼 */}
            {!hasResult || isModifying ? (
              <Button fullWidth size="lg" onClick={handleSubmit} disabled={!answer}>
                {isModifying ? '수정하여 제출하기' : '제출하기'}
              </Button>
            ) : null}
            {/* 모든 문제 완료 시 결과 보기 버튼 */}
            {allAnswered && !isModifying && (
              <Button fullWidth size="lg" onClick={handleFinish}
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                🎓 결과 보기
              </Button>
            )}
            {!allAnswered && hasResult && !isModifying && (
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--bg-warning)', border: '1px solid var(--border-warning)',
                fontSize: 13, color: 'var(--warning)', textAlign: 'center',
              }}>
                ⚠️ 아직 {problems.length - answeredCount}문제를 풀지 않았어요. 이전 문제로 돌아가서 완료해주세요.
              </div>
            )}
          </div>
        ) : (
          <Button fullWidth size="lg" onClick={handleSubmit} disabled={!answer}>
            {isModifying ? '수정하여 제출하기' : hasResult ? '다음 문제 →' : '제출하기'}
          </Button>
        )}
      </div>

      {/* 문제 퀵 네비게이션 */}
      {totalCount > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16, justifyContent: 'center' }}>
          {Array.from({ length: totalCount }).map((_, i) => {
            const answered = results[i] !== undefined
            const isCurrent = i === currentIdx
            const isLoaded = i < problems.length
            return (
              <button
                key={i}
                onClick={() => isLoaded && setCurrentIdx(i)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `2px solid ${isCurrent ? '#4f46e5' : answered ? '#0ea5e9' : isLoaded ? 'var(--border)' : 'var(--border-light)'}`,
                  background: isCurrent ? '#4f46e5' : answered ? 'var(--accent-light)' : 'var(--surface)',
                  color: isCurrent ? '#fff' : answered ? 'var(--accent)' : isLoaded ? 'var(--text-muted)' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 700,
                  cursor: isLoaded ? 'pointer' : 'default',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}

export default LearningSessionPage
