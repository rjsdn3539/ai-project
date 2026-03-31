import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as learningApi from '../api/learning'
import Button from '../components/Button'

function FeedbackPopup({ result, problem, onNext }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px' }}>{result.isCorrect ? '✅' : '❌'}</div>
          <h2 style={{ fontWeight: '700', marginTop: '8px', color: result.isCorrect ? '#22c55e' : '#ef4444' }}>
            {result.isCorrect ? '정답!' : '오답'}
          </h2>
        </div>
        <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>정답</p>
          <p style={{ fontWeight: '600' }}>{problem.answer}</p>
        </div>
        {result.aiFeedback && (
          <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: '#4f46e5', fontWeight: '600', marginBottom: '6px' }}>AI 해설</p>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#374151' }}>{result.aiFeedback}</p>
          </div>
        )}
        <Button fullWidth onClick={onNext}>다음 문제</Button>
      </div>
    </div>
  )
}

function LearningSessionPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [problems, setProblems] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!state) { navigate('/learning'); return }
    learningApi.generateProblems({ subject: state.subject, difficulty: state.difficulty, count: state.count })
      .then(({ data }) => setProblems(data.data || mockProblems()))
      .catch(() => setProblems(mockProblems()))
      .finally(() => setLoading(false))
  }, [])

  const mockProblems = () => [
    { type: 'MULTIPLE', question: '다음 중 올바른 영어 문장은?', choices: ['I am a student', 'I is a student', 'I are a student', 'I be a student'], answer: 'I am a student', explanation: 'be 동사는 주어에 따라 am/is/are를 사용합니다.' },
    { type: 'SHORT', question: '조선을 건국한 인물은?', answer: '이성계', explanation: '이성계(태조)는 1392년 고려를 무너뜨리고 조선을 건국했습니다.' },
  ]

  const problem = problems[currentIdx]

  const handleSubmit = async () => {
    if (!answer) { alert('답을 입력하거나 선택하세요.'); return }
    setSubmitting(true)
    try {
      const { data } = await learningApi.submitAttempt({ problemId: problem.id, userAnswer: answer })
      const r = data.data || { isCorrect: answer === problem.answer, aiFeedback: problem.explanation }
      setResult(r)
      if (r.isCorrect) setScore((s) => s + 1)
    } catch {
      const isCorrect = answer === problem.answer
      setResult({ isCorrect, aiFeedback: problem.explanation })
      if (isCorrect) setScore((s) => s + 1)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    setResult(null)
    setAnswer('')
    setCurrentIdx((i) => i + 1)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>문제 생성 중...</div>

  if (currentIdx >= problems.length) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '60px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎓</div>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>학습 완료!</h2>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          {problems.length}문제 중 <strong style={{ color: '#4f46e5' }}>{score}문제</strong> 정답
          ({Math.round(score / problems.length * 100)}%)
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button variant="outline" onClick={() => navigate('/learning')}>다시 학습</Button>
          <Button onClick={() => navigate('/dashboard')}>대시보드로</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>{state?.subject} 학습</h1>
        <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
          {currentIdx + 1} / {problems.length}
        </span>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.6', marginBottom: '24px' }}>{problem.question}</p>

        {problem.type === 'MULTIPLE' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {problem.choices.map((c) => (
              <button
                key={c}
                onClick={() => setAnswer(c)}
                style={{
                  padding: '14px 16px', borderRadius: '10px', textAlign: 'left', cursor: 'pointer', fontSize: '14px',
                  border: `2px solid ${answer === c ? '#4f46e5' : '#e5e7eb'}`,
                  background: answer === c ? '#eef2ff' : '#f9fafb',
                  color: '#111', fontWeight: answer === c ? '600' : '400',
                  transition: 'all 0.15s',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          <input
            style={{ width: '100%', padding: '12px', border: '1.5px solid #d1d5db', borderRadius: '10px', fontSize: '15px', marginBottom: '24px', boxSizing: 'border-box', color: '#111', background: '#fff' }}
            placeholder="답을 입력하세요"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        )}

        <Button fullWidth loading={submitting} onClick={handleSubmit}>제출</Button>
      </div>

      {result && <FeedbackPopup result={result} problem={problem} onNext={handleNext} />}
    </div>
  )
}

export default LearningSessionPage
