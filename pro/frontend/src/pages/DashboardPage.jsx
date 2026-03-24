import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useAuthStore from '../store/authStore'
import * as interviewApi from '../api/interview'
import Button from '../components/Button'

const MOCK_SESSIONS = [
  { id: 1, company: '카카오', position: '백엔드', overallScore: 65, endedAt: '2026-03-10' },
  { id: 2, company: '네이버', position: '프론트엔드', overallScore: 72, endedAt: '2026-03-13' },
  { id: 3, company: '라인', position: '풀스택', overallScore: 80, endedAt: '2026-03-16' },
]
const MOCK_CHART = [
  { date: '3/10', score: 65 }, { date: '3/13', score: 72 }, { date: '3/16', score: 80 },
]

function DashboardPage() {
  const { user, fetchMe } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [chartData, setChartData] = useState(MOCK_CHART)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) fetchMe().catch(() => {})
    interviewApi.getSessions()
      .then(({ data }) => {
        const list = data.data || []
        setSessions(list.slice(0, 5))
        if (list.length > 0) {
          setChartData(list.map((s, i) => ({ date: s.endedAt?.slice(5) || `#${i + 1}`, score: 0 })))
        }
      })
      .catch(() => setSessions(MOCK_SESSIONS))
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
        안녕하세요, {user?.name || '사용자'}님! 👋
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>오늘도 AI 면접 연습으로 목표에 한 걸음 더 가까워져요.</p>

      {/* 바로가기 버튼 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        <Button onClick={() => navigate('/interview/setup')}>🎤 면접 시작하기</Button>
        <Button variant="outline" onClick={() => navigate('/learning')}>📚 학습 시작하기</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 면접 점수 추이 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', gridColumn: '1 / -1' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '20px' }}>면접 점수 추이</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 최근 면접 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px' }}>최근 면접</h2>
          {sessions.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>아직 면접 기록이 없습니다.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id}
                onClick={() => navigate(`/interview/result/${s.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>면접 #{s.id}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{s.endedAt ?? s.startedAt}</p>
                </div>
                <span style={{ fontWeight: '700', color: '#6b7280', fontSize: '14px' }}>
                  {s.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* 학습 통계 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '16px' }}>학습 통계</h2>
          {[
            { label: '총 풀이 수', value: '24문제', color: '#4f46e5' },
            { label: '평균 정답률', value: '78%', color: '#22c55e' },
            { label: '약한 과목', value: '국사', color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>{label}</span>
              <span style={{ fontWeight: '700', color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
