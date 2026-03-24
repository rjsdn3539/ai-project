import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as interviewApi from '../api/interview'
import Button from '../components/Button'

function ScoreGauge({ label, score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 8px',
        background: `conic-gradient(${color} ${score * 3.6}deg, #e5e7eb 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color }}>
          {score}
        </div>
      </div>
      <p style={{ fontSize: '12px', color: '#6b7280' }}>{label}</p>
    </div>
  )
}

function InterviewResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    interviewApi.getFeedback(id)
      .then(({ data }) => setFeedback(data.data))
      .catch(() => setFeedback({
        logicScore: 75, relevanceScore: 82, specificityScore: 68, overallScore: 75,
        weakPoints: '구체적인 수치나 사례가 부족했습니다.',
        improvements: '경험을 STAR 기법(상황-과제-행동-결과)으로 구체화해보세요.',
        recommendedAnswer: '저는 ~프로젝트에서 ~문제를 해결했습니다. 구체적으로는...',
      }))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>피드백 불러오는 중...</div>

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>면접 결과</h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>AI 면접관의 종합 피드백입니다.</p>

      {/* 종합 점수 */}
      <div style={{ background: '#4f46e5', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '24px', color: '#fff' }}>
        <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>종합 점수</p>
        <p style={{ fontSize: '64px', fontWeight: '800' }}>{feedback.overallScore}</p>
        <p style={{ fontSize: '14px', opacity: 0.7 }}>/ 100</p>
      </div>

      {/* 항목별 점수 */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontWeight: '700', marginBottom: '24px' }}>항목별 점수</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <ScoreGauge label="논리성" score={feedback.logicScore} />
          <ScoreGauge label="적절성" score={feedback.relevanceScore} />
          <ScoreGauge label="구체성" score={feedback.specificityScore} />
        </div>
      </div>

      {/* 상세 피드백 */}
      {[
        { title: '부족한 부분', content: feedback.weakPoints, icon: '⚠️', bg: '#fef3c7' },
        { title: '개선 방향', content: feedback.improvements, icon: '💡', bg: '#eff6ff' },
        { title: '추천 답변 예시', content: feedback.recommendedAnswer, icon: '✨', bg: '#f0fdf4' },
      ].map(({ title, content, icon, bg }) => (
        <div key={title} style={{ background: bg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>{icon} {title}</h3>
          <p style={{ color: '#374151', lineHeight: '1.7', fontSize: '14px' }}>{content}</p>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <Button variant="outline" onClick={() => navigate('/interview/setup')}>다시 면접하기</Button>
        <Button onClick={() => navigate('/dashboard')}>대시보드로</Button>
      </div>
    </div>
  )
}

export default InterviewResultPage
