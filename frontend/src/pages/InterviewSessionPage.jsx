import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useBlocker } from 'react-router-dom'
import { createPortal } from 'react-dom'
import * as interviewApi from '../api/interview'
import Button from '../components/Button'
import { getStats, saveStats, updateStreak, checkAndUnlock } from '../utils/achievements'

const INTERVIEW_TIPS = [
  '두괄식으로 답변하세요 — 결론부터 말하면 논리적인 인상을 남깁니다.',
  'STAR 기법을 활용하세요 — 상황·과제·행동·결과 순서로 구성하세요.',
  '모르는 질문엔 솔직하게 — "현재 공부 중입니다"가 최선입니다.',
  '답변은 1~2분 내로 — 핵심만 담아 간결하게 말하세요.',
  '긍정적인 표현을 사용하세요 — 약점도 성장 스토리로 전환하세요.',
]

function InterviewLoadingScreen() {
  const [tipIdx, setTipIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setTipIdx(i => (i + 1) % INTERVIEW_TIPS.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 440,
        animation: 'slideUpSm 0.3s ease both',
      }}>
        {/* 아이콘 */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, boxShadow: '0 0 0 16px rgba(79,70,229,0.1), 0 0 0 32px rgba(79,70,229,0.05)',
            animation: 'interviewPulse 2s ease-in-out infinite',
          }}>🎤</div>
          {/* 회전하는 링 */}
          <div style={{
            position: 'absolute', inset: -8,
            borderRadius: '50%',
            border: '2px dashed rgba(79,70,229,0.25)',
            animation: 'spin 8s linear infinite',
          }} />
        </div>

        <h2 style={{
          fontSize: 24, fontWeight: 800, color: 'var(--text)',
          marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          면접을 준비하고 있어요
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
          AI 면접관이 맞춤 질문을 생성 중입니다
        </p>

        {/* 면접 팁 카드 */}
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1.5px solid var(--border-light)',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 28,
          minHeight: 90,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: 'var(--primary)',
            letterSpacing: '0.08em', marginBottom: 10,
            textTransform: 'uppercase',
          }}>💡 면접 팁</p>
          <p style={{
            fontSize: 14, color: 'var(--text)', lineHeight: 1.7, fontWeight: 500,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>
            {INTERVIEW_TIPS[tipIdx]}
          </p>
        </div>

        {/* 로딩 dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--primary)',
              animation: `bounceDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes interviewPulse {
          0%, 100% { box-shadow: 0 0 0 16px rgba(79,70,229,0.1), 0 0 0 32px rgba(79,70,229,0.05); }
          50%       { box-shadow: 0 0 0 22px rgba(79,70,229,0.14), 0 0 0 44px rgba(79,70,229,0.06); }
        }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function InterviewSessionPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const sessionId = state?.sessionId

  const [question, setQuestion] = useState('')
  const [questionId, setQuestionId] = useState(null)
  const [questionNum, setQuestionNum] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [answerText, setAnswerText] = useState('')
  const [done, setDone] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // 면접 중 네비게이션 차단
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !done && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (done) return
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [done])

  useEffect(() => {
    if (!sessionId) { navigate('/interview/setup'); return }
    loadNextQuestion()
  }, [])

  useEffect(() => {
    if (question) speakQuestion(question)
  }, [question])

  const loadNextQuestion = async () => {
    try {
      const { data } = await interviewApi.getSession(sessionId)
      const questions = data.data?.questions || []
      const pending = questions.find((q) => !q.answer)
      if (pending) {
        setQuestion(pending.questionText)
        setQuestionId(pending.id)
        setQuestionNum(pending.sequenceNumber || questions.indexOf(pending) + 1)
      } else {
        // 모든 질문에 답변 완료
        // Track interview achievement stats
        const now = new Date()
        const today = now.toISOString().slice(0, 10)
        const dow = now.getDay()
        const stats = getStats()
        let updated = { ...stats }
        updated.totalInterviews = (updated.totalInterviews || 0) + 1
        updated.lastInterviewDate = today

        // Weekend activity
        if (dow === 0 || dow === 6) updated.weekendActivity = true

        // Check if both interview and study done same day
        if (updated.lastStudyDate === today) {
          updated.didBothSameDay = true
        }

        updated = updateStreak(updated)
        saveStats(updated)
        checkAndUnlock(updated)

        setDone(true)
        await interviewApi.endSession(sessionId)
      }
    } catch {
      setQuestion('자기소개 부탁드립니다.')
    } finally {
      setInitialLoading(false)
    }
  }

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    window.speechSynthesis.speak(utterance)
  }

  const handleSubmit = async () => {
    if (!answerText.trim()) { alert('답변을 입력하세요.'); return }
    setSubmitting(true)
    try {
      await interviewApi.submitAnswer(sessionId, {
        questionId,
        answerText: answerText.trim(),
      })
      setAnswerText('')
      await loadNextQuestion()
    } catch {
      alert('답변 제출에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }



  if (initialLoading) {
    return <InterviewLoadingScreen />
  }

  if (done) {
    return (
      <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center' }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 20, padding: '52px 40px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>면접 완료!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
            AI가 답변을 분석하고 있습니다. 잠시 후 피드백을 확인하세요.
          </p>
          <Button fullWidth size="lg" onClick={() => navigate(`/interview/result/${sessionId}`)}>
            피드백 보기 →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {blocker.state === 'blocked' && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 20, padding: '36px 40px',
            width: 360, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e1a18', marginBottom: 8 }}>
              면접을 중단할까요?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
              지금 나가면 진행 중인 면접이<br />저장되지 않습니다.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => blocker.reset()}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: 'var(--bg-warm)', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >계속 면접하기</button>
              <button
                onClick={() => blocker.proceed()}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: '#ef4444', border: 'none', color: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >나가기</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/interview')}
            style={{
              background: 'none', border: '1.5px solid var(--border)', borderRadius: 8,
              padding: '6px 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >← 나가기</button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>AI 모의 면접</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: n < questionNum ? '#4f46e5' : n === questionNum ? '#7c3aed' : 'var(--border)',
              transition: 'all 0.3s',
            }} />
          ))}
          <span style={{
            marginLeft: 8, background: 'var(--bg-indigo)', color: 'var(--primary)',
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          }}>
            {questionNum} / 5
          </span>
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: 16, padding: '32px', marginBottom: 16, color: '#fff',
        boxShadow: '0 8px 32px rgba(79,70,229,0.3)',
      }}>
        <p style={{ fontSize: 11, opacity: 0.65, marginBottom: 14, letterSpacing: '0.15em', fontWeight: 600 }}>
          QUESTION {questionNum}
        </p>
        <p style={{ fontSize: 19, lineHeight: 1.75, fontWeight: 500 }}>
          {question || '질문을 불러오는 중...'}
        </p>
        <button
          onClick={() => speakQuestion(question)}
          style={{
            marginTop: 18, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 7, padding: '7px 14px', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
          }}
        >
          🔊 다시 듣기
        </button>
      </div>

      {/* Answer text input card */}
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: '32px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
      }}>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="답변을 입력하세요..."
          rows={6}
          style={{
            width: '100%', padding: '14px 16px', fontSize: 15, lineHeight: 1.7,
            border: '1.5px solid var(--border-light)', borderRadius: 12,
            resize: 'vertical', fontFamily: 'inherit', outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
          onBlur={(e) => e.target.style.borderColor = ''}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {answerText.length} / 5,000자
          </span>
          <Button loading={submitting} onClick={handleSubmit} disabled={!answerText.trim()}>
            답변 제출 →
          </Button>
        </div>
      </div>
    </div>
    </>
  )
}

export default InterviewSessionPage
