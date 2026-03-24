import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as interviewApi from '../api/interview'

const PRIMARY = 'var(--primary)'

function ScoreBadge({ score }) {
  if (score == null) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>분석 중</span>
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : '#ef4444'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{score}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>점</div>
    </div>
  )
}

function ScoreBar({ label, value }) {
  if (value == null) return null
  const color = value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--warning)' : '#ef4444'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}점</span>
      </div>
      <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function SessionCard({ session, onClick }) {
  const date = new Date(session.startedAt || session.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const status = session.status === 'COMPLETED' ? { label: '완료', color: 'var(--success)', bg: 'var(--bg-success)' }
               : session.status === 'IN_PROGRESS' ? { label: '진행 중', color: 'var(--warning)', bg: 'var(--bg-warning)' }
               : { label: '미완료', color: 'var(--text-muted)', bg: 'var(--bg-slate)' }

  return (
    <div onClick={onClick} style={{ background: 'var(--surface)', borderRadius: 16, padding: '18px 22px', border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18, transition: 'all 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,106,240,0.12)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(124,106,240,0.15), rgba(14,165,233,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎤</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.title || '면접 세션'}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {session.positionTitle && <span style={{ fontSize: 12, color: PRIMARY, fontWeight: 600 }}>{session.positionTitle}</span>}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{date}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: status.bg, borderRadius: 99, padding: '2px 8px' }}>{status.label}</span>
        </div>
      </div>
      {(session.feedback?.overallScore ?? session.overallScore) != null && <ScoreBadge score={session.feedback?.overallScore ?? session.overallScore} />}
      <span style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>›</span>
    </div>
  )
}

function WeakPointAnalysis({ sessions }) {
  const scored = sessions.filter((s) => s.overallScore != null)
  if (scored.length === 0) return null

  const avg = (key) => {
    const vals = sessions
      .filter((s) => (s.feedback?.[key] ?? s[key]) != null)
      .map((s) => s.feedback?.[key] ?? s[key])
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }

  const avgOverall      = avg('overallScore')
  const avgRelevance    = avg('relevanceScore')
  const avgLogic        = avg('logicScore')
  const avgSpecificity  = avg('specificityScore')

  const metrics = [
    { label: '연관성', value: avgRelevance },
    { label: '논리성', value: avgLogic },
    { label: '구체성', value: avgSpecificity },
  ].filter((m) => m.value != null)

  const weakest = metrics.length > 0 ? [...metrics].sort((a, b) => a.value - b.value)[0] : null

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '24px 28px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)', marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>📊 취약 항목 분석</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>총 면접 횟수</span>
            <span style={{ float: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{sessions.length}회</span>
          </div>
          <div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>평균 점수</span>
            <span style={{ float: 'right', fontSize: 13, fontWeight: 700, color: avgOverall >= 80 ? 'var(--success)' : avgOverall >= 60 ? 'var(--warning)' : '#ef4444' }}>{avgOverall}점</span>
          </div>
          {weakest && (
            <div style={{ marginTop: 16, background: 'var(--bg-warning)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border-warning)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', margin: '0 0 4px' }}>⚠ 취약 영역</p>
              <p style={{ fontSize: 13, color: 'var(--warning)', margin: 0 }}><strong>{weakest.label}</strong>이 {weakest.value}점으로 가장 낮습니다. 해당 영역을 집중 연습해보세요.</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ScoreBar label="연관성" value={avgRelevance} />
          <ScoreBar label="논리성" value={avgLogic} />
          <ScoreBar label="구체성" value={avgSpecificity} />
        </div>
      </div>
    </div>
  )
}

function InterviewHistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    interviewApi.getSessions()
      .then((res) => setSessions(res.data?.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const completed = sessions.filter((s) => s.status === 'COMPLETED')

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>면접 기록</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>지금까지 진행한 AI 면접 세션과 취약 항목을 확인하세요.</p>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>불러오는 중...</p>}

      {error && (
        <div style={{ background: 'var(--bg-error)', border: '1.5px solid var(--border-error)', borderRadius: 14, padding: '16px 20px', color: 'var(--danger)', fontSize: 14, fontWeight: 600 }}>
          면접 기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      )}

      {!loading && !error && (
        <>
          {completed.length > 0 && <WeakPointAnalysis sessions={completed} />}

          <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '24px 28px', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: 0 }}>전체 기록</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sessions.length}개</span>
            </div>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎤</div>
                <p style={{ fontSize: 15, marginBottom: 16 }}>아직 진행한 면접이 없습니다.</p>
                <button onClick={() => navigate('/interview/setup')} style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  첫 면접 시작하기
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...sessions].sort((a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt)).map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => session.status === 'COMPLETED' && navigate(`/interview/result/${session.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default InterviewHistoryPage
