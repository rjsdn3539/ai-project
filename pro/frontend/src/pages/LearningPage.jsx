import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'

const SUBJECTS = [
  { id: '영어', label: '영어', icon: '🇺🇸' },
  { id: '국사', label: '국사', icon: '📜' },
  { id: '수학', label: '수학', icon: '📐' },
  { id: '과학', label: '과학', icon: '🔬' },
  { id: '사회', label: '사회', icon: '🌍' },
  { id: '국어', label: '국어', icon: '📖' },
]
const DIFFICULTIES = [
  { id: 'EASY', label: '쉬움', color: '#22c55e' },
  { id: 'MEDIUM', label: '보통', color: '#f59e0b' },
  { id: 'HARD', label: '어려움', color: '#ef4444' },
]

function LearningPage() {
  const [subject, setSubject] = useState('')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [count, setCount] = useState(4)
  const navigate = useNavigate()

  const handleStart = () => {
    if (!subject) { alert('과목을 선택해주세요.'); return }
    navigate('/learning/session', { state: { subject, difficulty, count } })
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>AI 학습</h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>AI가 맞춤 문제를 생성하고 상세한 해설을 제공합니다.</p>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* 과목 선택 */}
        <h2 style={{ fontWeight: '700', marginBottom: '16px' }}>과목 선택</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {SUBJECTS.map((s) => (
            <div
              key={s.id}
              onClick={() => setSubject(s.id)}
              style={{
                padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                border: `2px solid ${subject === s.id ? '#4f46e5' : '#e5e7eb'}`,
                background: subject === s.id ? '#eef2ff' : '#f9fafb',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 난이도 */}
        <h2 style={{ fontWeight: '700', marginBottom: '16px' }}>난이도</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                border: `2px solid ${difficulty === d.id ? d.color : '#e5e7eb'}`,
                background: difficulty === d.id ? d.color : '#f9fafb',
                color: difficulty === d.id ? '#fff' : '#374151',
                transition: 'all 0.15s',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* 문제 수 */}
        <h2 style={{ fontWeight: '700', marginBottom: '16px' }}>문제 수</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[2, 4, 6, 8].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                width: '52px', height: '52px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700',
                border: `2px solid ${count === n ? '#4f46e5' : '#e5e7eb'}`,
                background: count === n ? '#4f46e5' : '#f9fafb',
                color: count === n ? '#fff' : '#374151',
                transition: 'all 0.15s',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <Button fullWidth onClick={handleStart}>학습 시작</Button>
      </div>
    </div>
  )
}

export default LearningPage
