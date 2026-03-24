import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import { generatePlacementProblems } from '../api/learning'

const LEVEL_LABEL = { 1: '기초', 2: '중급', 3: '고급' }
const LEVEL_COLOR = { 1: 'var(--success)', 2: 'var(--warning)', 3: '#ef4444' }
const SUBJECT_ICON = { 영어: '🇺🇸', 국사: '📜', 파이썬: '🐍', 자바스크립트: '🟨', 'C++': '⚡', 일본어: '🇯🇵', 데이터베이스: '🗄️', 자바: '☕', 스프링: '🍃' }

function getRecommendedDifficulty(score, total) {
  const pct = score / total
  if (pct >= 0.75) return 'HARD'
  if (pct >= 0.4) return 'MEDIUM'
  return 'EASY'
}

const DIFF = {
  EASY:   { label: '쉬움',   color: 'var(--success)', bg: 'var(--bg-success)', comment: '기초 개념을 탄탄히 다지는 것이 중요합니다. 쉬운 문제부터 차근차근 시작해봐요!' },
  MEDIUM: { label: '보통',   color: 'var(--warning)', bg: 'var(--bg-warning)', comment: '기본기는 갖추셨네요! 조금 더 심화 내용을 공부하면 실력이 크게 늘 거예요.' },
  HARD:   { label: '어려움', color: '#ef4444', bg: 'var(--bg-error)', comment: '상당한 실력을 갖추셨습니다! 어려운 문제로 실력을 더욱 높여봐요.' },
}

function WrongAnswerList({ answers }) {
  const wrong = answers.filter((a) => !a.correct)
  if (wrong.length === 0) return null
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
        틀린 문제 ({wrong.length}개)
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {wrong.map((a, i) => (
          <div key={i} style={{
            background: 'var(--surface)', borderRadius: 12, padding: '16px 18px',
            border: '1px solid var(--border-error)', borderLeft: '3px solid var(--danger)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ background: `${LEVEL_COLOR[a.level]}15`, color: LEVEL_COLOR[a.level], fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                {SUBJECT_ICON[a.subject]} {a.subject} · {LEVEL_LABEL[a.level]}
              </span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10, whiteSpace: 'pre-line' }}>
              {a.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-error)', borderRadius: 7, padding: '7px 10px' }}>
                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>✕ 내 답변</span>
                <span style={{ fontSize: 13, color: 'var(--danger)' }}>{a.selected}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-success)', borderRadius: 7, padding: '7px 10px' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 12 }}>✓ 정답</span>
                <span style={{ fontSize: 13, color: 'var(--success)' }}>{a.answer}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlacementTestPage() {
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [answers, setAnswers] = useState([])
  const [showWrong, setShowWrong] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    setStarted(false)
    try {
      const { data } = await generatePlacementProblems(20)
      setQuestions(data.data?.problems || [])
    } catch {
      setQuestions([])
    } finally {
      setLoading(false)
      setStarted(true)
    }
  }

  const q = questions[currentIdx]
  const maxScore = questions.reduce((s, q) => s + q.level, 0)
  const difficulty = getRecommendedDifficulty(score, maxScore)

  const handleNext = () => {
    if (!selected) { alert('답을 선택해주세요.'); return }
    const correct = selected === q.answer
    const newScore = correct ? score + q.level : score
    const newAnswers = [...answers, { question: q.question, answer: q.answer, selected, correct, subject: q.subject, level: q.level }]
    setScore(newScore)
    setAnswers(newAnswers)
    setSelected('')
    if (currentIdx + 1 >= questions.length) {
      setDone(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }

  const handleStartLearning = (subject) => {
    localStorage.setItem('placementDifficulty', difficulty)
    localStorage.setItem('placementDone', 'true')
    navigate('/learning/session', { state: { subject, difficulty, count: 6 } })
  }

  if (!started) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', paddingTop: 20 }}>
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: 20, padding: '48px 40px', color: '#fff', marginBottom: 20,
          boxShadow: '0 12px 40px rgba(79,70,229,0.3)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>수준 진단 테스트</h1>
          <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.7 }}>
            총 <strong>20문제</strong>로 구성된 진단 테스트입니다.<br />
            결과에 따라 AI가 최적 난이도를 설정합니다.
          </p>
        </div>

        <div style={{
          background: 'var(--surface)', borderRadius: 14, padding: '24px',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
          textAlign: 'left', marginBottom: 20,
        }}>
          {[
            { icon: '📝', text: '객관식 4지선다 20문제 (AI 실시간 생성)' },
            { icon: '⏱', text: '제한 시간 없음 — 천천히 풀어도 됩니다' },
            { icon: '🤖', text: '결과에 따라 AI가 난이도 자동 설정' },
            { icon: '📋', text: '마지막에 틀린 문제를 확인할 수 있습니다' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 14, color: 'var(--text-secondary)', alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <Button fullWidth size="lg" onClick={handleStart} loading={loading}>
          {loading ? 'AI가 문제를 생성하고 있습니다...' : '테스트 시작하기 →'}
        </Button>
        <button
          onClick={() => navigate('/learning')}
          style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          건너뛰기
        </button>
      </div>
    )
  }

  if (started && questions.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <p style={{ fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>문제를 불러오지 못했습니다.</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>AI 서버 또는 네트워크 상태를 확인해주세요.</p>
        <Button onClick={() => { setStarted(false) }}>다시 시도</Button>
      </div>
    )
  }

  if (done) {
    const SUBJECTS = ['영어', '국사', '파이썬', '자바스크립트', 'C++', '일본어', '데이터베이스', '자바', '스프링']
    const d = DIFF[difficulty]
    const correctCount = answers.filter((a) => a.correct).length
    const wrongCount = answers.length - correctCount

    return (
      <div style={{ maxWidth: 580, margin: '0 auto', paddingTop: 10 }}>
        {/* Result card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 18, padding: '36px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)',
          textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📊</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>테스트 완료!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
            {questions.length}문제 중{' '}
            <strong style={{ color: 'var(--success)' }}>{correctCount}개 정답</strong>
            &nbsp;·&nbsp;
            <strong style={{ color: '#ef4444' }}>{wrongCount}개 오답</strong>
          </p>

          <div style={{
            background: d.bg, borderRadius: 12, padding: '20px', marginBottom: 22,
            border: `1px solid ${d.color}30`,
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>AI 추천 난이도</p>
            <div style={{ fontSize: 32, fontWeight: 800, color: d.color, marginBottom: 8 }}>{d.label}</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{d.comment}</p>
          </div>

          {wrongCount > 0 && (
            <Button variant="subtle" onClick={() => setShowWrong((v) => !v)} style={{ marginBottom: 8 }}>
              {showWrong ? '오답 닫기' : `오답 확인 (${wrongCount}문제)`}
            </Button>
          )}
        </div>

        {/* Wrong answers */}
        {showWrong && <WrongAnswerList answers={answers} />}

        {/* Subject selection */}
        <div style={{
          background: 'var(--surface)', borderRadius: 14, padding: '24px',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
          marginTop: 16,
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 14, textAlign: 'center' }}>
            어떤 과목부터 시작할까요?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => handleStartLearning(s)}
                style={{
                  padding: '16px 8px', borderRadius: 12, border: '2px solid var(--border)',
                  background: 'var(--surface)', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = 'var(--bg-indigo)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
              >
                <div style={{ fontSize: 26, marginBottom: 5 }}>{SUBJECT_ICON[s]}</div>
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/learning')}
            style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}
          >
            나중에 설정하기
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.round(currentIdx / questions.length * 100)

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>수준 진단 테스트</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{currentIdx + 1} / {questions.length}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, marginBottom: 24 }}>
        <div style={{ height: '100%', background: '#4f46e5', borderRadius: 99, width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: '28px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <span style={{ background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
            {SUBJECT_ICON[q.subject]} {q.subject}
          </span>
          <span style={{
            background: `${LEVEL_COLOR[q.level]}15`, color: LEVEL_COLOR[q.level],
            fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
          }}>
            {LEVEL_LABEL[q.level]}
          </span>
        </div>

        <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.75, color: 'var(--text)', marginBottom: 22, whiteSpace: 'pre-line' }}>
          {q.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
          {q.choices.map((c, i) => {
            const isSel = selected === c
            return (
              <button
                key={c}
                onClick={() => setSelected(c)}
                style={{
                  padding: '13px 16px', borderRadius: 10, textAlign: 'left',
                  cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                  border: `2px solid ${isSel ? '#4f46e5' : 'var(--border)'}`,
                  background: isSel ? 'var(--bg-indigo)' : 'var(--bg)',
                  color: isSel ? 'var(--primary)' : 'var(--text)',
                  fontWeight: isSel ? 600 : 400,
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.borderColor = 'var(--primary-light)'; e.currentTarget.style.background = 'var(--surface)' } }}
                onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)' } }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: isSel ? '#4f46e5' : 'var(--border-light)',
                  color: isSel ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {['①','②','③','④'][i]}
                </span>
                {c}
              </button>
            )
          })}
        </div>

        <Button fullWidth size="lg" onClick={handleNext} disabled={!selected}>
          {currentIdx + 1 >= questions.length ? '결과 보기 →' : '다음 문제 →'}
        </Button>
      </div>
    </div>
  )
}

export default PlacementTestPage
