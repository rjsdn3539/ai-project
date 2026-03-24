import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip, ResponsiveContainer, Area, AreaChart, XAxis, YAxis, ReferenceLine } from 'recharts'
import useAuthStore from '../store/authStore'
import * as interviewApi from '../api/interview'
import * as subscriptionApi from '../api/subscription'

const MOCK_SESSIONS = [
  { id: 1, title: '카카오', positionTitle: '백엔드', feedback: { overallScore: 65 }, endedAt: '2026-03-10' },
  { id: 2, title: '네이버', positionTitle: '프론트엔드', feedback: { overallScore: 72 }, endedAt: '2026-03-13' },
  { id: 3, title: '라인', positionTitle: '풀스택', feedback: { overallScore: 80 }, endedAt: '2026-03-16' },
]
const MOCK_CHART = [
  { date: '3/10', score: 65 }, { date: '3/13', score: 72 }, { date: '3/16', score: 80 },
]

// Mock AI coaching — in production this would come from the last session's feedback
const MOCK_COACHING = [
  {
    type: 'weak',
    icon: '💬',
    title: '답변이 추상적이에요',
    desc: '"노력했습니다" 같은 표현보다 구체적인 수치와 결과를 넣어보세요.',
    tip: 'STAR 기법: 상황 → 과제 → 행동 → 결과 순으로 구성하세요',
  },
  {
    type: 'weak',
    icon: '📌',
    title: '사례가 부족해요',
    desc: '직무 관련 경험을 구체적으로 2~3개 준비해두면 설득력이 높아집니다.',
    tip: '경험 키워드: 협업 / 문제해결 / 성과 / 리더십',
  },
]

const GOAL_SCORE = 85
const TIER_COLOR = { FREE: '#b3a99e', STANDARD: '#7c6af0', PRO: '#9b5de5', PREMIUM: 'var(--warning)' }

function getPercentile(score) {
  if (!score) return null
  if (score >= 90) return 5
  if (score >= 80) return 20
  if (score >= 70) return 35
  if (score >= 60) return 52
  return 70
}

// ── Custom dot: last point is larger & glowing
function CustomDot(props) {
  const { cx, cy, index, data } = props
  if (index !== data.length - 1) {
    return <circle cx={cx} cy={cy} r={3.5} fill="#7c6af0" stroke="#fff" strokeWidth={2} />
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="rgba(124,106,240,0.12)" />
      <circle cx={cx} cy={cy} r={6} fill="#7c6af0" stroke="#fff" strokeWidth={2.5} />
    </g>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow)' }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>{payload[0].value}점</p>
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuthStore()
  const [sessions, setSessions]     = useState([])
  const [chartData, setChartData]   = useState(MOCK_CHART)
  const [subStatus, setSubStatus]   = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    subscriptionApi.getMySubscription().then(({ data }) => setSubStatus(data.data)).catch(() => {})
    interviewApi.getSessions()
      .then(({ data }) => {
        const list = data.data || []
        setSessions(list.slice(0, 5))
        const scored = list.filter(s => s.feedback?.overallScore != null)
        if (scored.length > 0) {
          const chartList = [...scored].reverse()
          setChartData(chartList.map((s) => ({ date: s.endedAt?.slice(5, 10), score: s.feedback.overallScore })))
        }
      })
      .catch(() => setSessions(MOCK_SESSIONS))
  }, [])

  const tier        = subStatus?.tier || user?.subscriptionTier || 'FREE'
  const scored      = sessions.filter(s => s.feedback?.overallScore != null)
  const avgScore    = scored.length > 0 ? Math.round(scored.reduce((sum, x) => sum + x.feedback.overallScore, 0) / scored.length) : null
  const latestScore = scored.length > 0 ? scored[0].feedback.overallScore : null
  const prevScore   = scored.length > 1 ? scored[1].feedback.overallScore : null
  const scoreTrend  = latestScore != null && prevScore != null ? latestScore - prevScore : null
  const percentile  = getPercentile(avgScore)
  const toGoal      = avgScore != null ? GOAL_SCORE - avgScore : null
  const goalPct     = avgScore != null ? Math.min(100, Math.round((avgScore / GOAL_SCORE) * 100)) : 0

  return (
    <div style={{ width: '100%' }}>

      {/* ══ A. 인사 헤더 ══ */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
          내 통계
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>면접 성과와 성장 지표를 한눈에 확인하세요.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 3 }}>
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
            안녕하세요, {user?.name || '사용자'}님 👋
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {avgScore && percentile && (
            <div style={{
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 99, padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: 'var(--shadow-sm)', fontSize: 13,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: avgScore >= 70 ? 'var(--success)' : 'var(--warning)', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{avgScore}점</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>상위 {percentile}%</span>
            </div>
          )}
          <div
            onClick={() => navigate('/subscription')}
            style={{
              background: 'var(--primary-light)', borderRadius: 99, padding: '6px 14px',
              fontSize: 12, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer',
              border: '1.5px solid var(--primary-border)',
            }}
          >✦ {tier}</div>
        </div>
      </div>

      {/* ══ B. 핵심 지표 요약 카드 4개 ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        {[
          {
            icon: '📊',
            label: '평균 점수',
            value: avgScore != null ? `${avgScore}점` : '—',
            sub: avgScore != null ? (avgScore >= 80 ? '우수한 수준이에요' : avgScore >= 60 ? '평균 수준이에요' : '개선이 필요해요') : '면접을 시작해보세요',
            color: avgScore != null ? (avgScore >= 80 ? 'var(--success)' : avgScore >= 60 ? 'var(--warning)' : '#e05252') : 'var(--text-muted)',
            bg: avgScore != null ? (avgScore >= 80 ? 'var(--bg-success)' : avgScore >= 60 ? 'var(--bg-warning)' : 'var(--bg-error)') : 'var(--bg)',
            border: avgScore != null ? (avgScore >= 80 ? 'var(--bg-success)' : avgScore >= 60 ? 'var(--border-warning)' : 'var(--border-error)') : 'var(--border-light)',
          },
          {
            icon: '🎯',
            label: '총 면접 횟수',
            value: `${sessions.length}회`,
            sub: sessions.length === 0 ? '첫 면접을 시작해보세요' : `최근 ${sessions.length}개 기록 분석 중`,
            color: 'var(--primary)',
            bg: 'var(--primary-light)',
            border: 'var(--primary-border)',
          },
          {
            icon: '📈',
            label: '지난 면접 대비',
            value: scoreTrend != null ? `${scoreTrend > 0 ? '+' : ''}${scoreTrend}점` : '—',
            sub: scoreTrend != null ? (scoreTrend > 0 ? '상승 중이에요 🎉' : scoreTrend < 0 ? '하락했어요, 힘내세요' : '유지 중이에요') : '데이터 부족',
            color: scoreTrend != null ? (scoreTrend > 0 ? 'var(--success)' : scoreTrend < 0 ? '#e05252' : 'var(--text)') : 'var(--text-muted)',
            bg: scoreTrend != null ? (scoreTrend > 0 ? 'var(--bg-success)' : scoreTrend < 0 ? 'var(--bg-error)' : 'var(--bg)') : 'var(--bg)',
            border: scoreTrend != null ? (scoreTrend > 0 ? 'var(--bg-success)' : scoreTrend < 0 ? 'var(--border-error)' : 'var(--border-light)') : 'var(--border-light)',
          },
          {
            icon: '🏆',
            label: '전체 랭킹',
            value: percentile ? `상위 ${percentile}%` : '—',
            sub: percentile ? (percentile <= 10 ? '최상위권이에요!' : percentile <= 30 ? '상위권에 있어요' : '꾸준히 올라가고 있어요') : '면접 후 집계됩니다',
            color: 'var(--accent)',
            bg: 'var(--bg-indigo)',
            border: 'var(--bg-indigo)',
          },
        ].map(({ icon, label, value, sub, color, bg, border }) => (
          <div key={label} style={{
            background: bg, borderRadius: 16, padding: '20px 22px',
            border: `1.5px solid ${border}`, boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--surface)', border: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{icon}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>{value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ══ C. 목표 진행 바 ══ */}
      {avgScore != null && (
        <div style={{
          background: 'var(--surface)', borderRadius: 16, padding: '20px 24px', marginBottom: 16,
          border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
          display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 20,
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>목표 달성도</span>
                <span style={{
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
                }}>목표 {GOAL_SCORE}점</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: toGoal <= 0 ? 'var(--success)' : 'var(--text)' }}>
                {toGoal <= 0 ? '🎉 목표 달성!' : `+${toGoal}점 남았어요`}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 10, background: 'var(--bg-warm)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: goalPct >= 100
                  ? 'linear-gradient(90deg, #2da65e, #4ade80)'
                  : 'linear-gradient(90deg, var(--primary), var(--accent))',
                width: `${goalPct}%`,
                transition: 'width 0.8s ease',
                boxShadow: '0 2px 6px rgba(124,106,240,0.4)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>현재 평균 {avgScore}점</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{GOAL_SCORE}점 ({goalPct}%)</span>
            </div>
          </div>
          {/* Trend badge */}
          {scoreTrend != null && (
            <div style={{
              background: scoreTrend > 0 ? 'var(--bg-success)' : scoreTrend < 0 ? 'var(--bg-error)' : '#f5f0eb',
              border: `1.5px solid ${scoreTrend > 0 ? 'var(--bg-success)' : scoreTrend < 0 ? 'var(--border-error)' : 'var(--border)'}`,
              borderRadius: 14, padding: '12px 18px', textAlign: 'center', flexShrink: 0,
            }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: scoreTrend > 0 ? 'var(--success)' : scoreTrend < 0 ? '#e05252' : 'var(--text-secondary)', lineHeight: 1 }}>
                {scoreTrend > 0 ? '▲' : scoreTrend < 0 ? '▼' : '='} {scoreTrend > 0 ? '+' : ''}{scoreTrend}점
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>지난 면접 대비</p>
            </div>
          )}
        </div>
      )}

      {/* ══ D+E. AI 코칭 + 성장 요약 ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 16 }}>

        {/* D. AI 코칭 카드 */}
        <div style={{
          background: 'var(--surface)', borderRadius: 16, padding: '22px 24px',
          border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary-light), #e0f6ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>🤖</div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>AI 코칭 리포트</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>최근 면접 분석 기반</p>
            </div>
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              background: 'var(--bg-error)', color: 'var(--danger)',
              padding: '3px 9px', borderRadius: 99, border: '1px solid var(--border-error)',
            }}>개선 필요 2가지</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MOCK_COACHING.map((item, i) => (
              <div key={i} style={{
                background: 'var(--bg)', borderRadius: 12, padding: '14px 16px',
                border: '1px solid var(--border-light)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{item.desc}</p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: 'var(--primary-light)', borderRadius: 7, padding: '5px 10px',
                    }}>
                      <span style={{ fontSize: 10 }}>💡</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>{item.tip}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/interview/setup')}
            style={{
              width: '100%', marginTop: 14, padding: '11px',
              background: 'var(--primary-light)', color: 'var(--primary)',
              border: '1.5px solid var(--primary-border)', borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'var(--surface)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)' }}
          >
            이 피드백 반영해서 다시 도전 →
          </button>
        </div>

        {/* E. 성장 요약 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Growth card */}
          <div style={{
            background: scoreTrend != null && scoreTrend > 0
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              : '#fff',
            borderRadius: 16, padding: '20px 22px', flex: 1,
            border: `1.5px solid ${scoreTrend != null && scoreTrend > 0 ? 'var(--bg-success)' : 'var(--border-light)'}`,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 10 }}>성장 지표</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>지난 면접 대비</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: scoreTrend != null && scoreTrend > 0 ? 'var(--success)' : scoreTrend != null && scoreTrend < 0 ? '#e05252' : 'var(--text)' }}>
                  {scoreTrend != null
                    ? `${scoreTrend > 0 ? '▲ +' : scoreTrend < 0 ? '▼ ' : ''}${scoreTrend}점`
                    : sessions.length === 0 ? '—' : '첫 기록'
                  }
                </p>
                {scoreTrend != null && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {prevScore}점 → {latestScore}점
                  </p>
                )}
              </div>
              <div style={{ height: 1, background: 'var(--border-light)' }} />
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>전체 랭킹</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--accent)' }}>
                  {percentile ? `상위 ${percentile}%` : '—'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {percentile ? '꾸준히 상위권에 있어요' : '면접 후 집계됩니다'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick stat: total */}
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '16px 22px',
            border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>총 면접 횟수</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{sessions.length}회</p>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🎯</div>
          </div>
        </div>
      </div>

      {/* ══ F. 차트 + 기록 ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>

        {/* Chart */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '22px 24px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>점수 추이</h3>
              {scoreTrend != null && (
                <p style={{ fontSize: 12, color: scoreTrend > 0 ? 'var(--success)' : '#e05252' }}>
                  {scoreTrend > 0 ? `▲ +${scoreTrend}점 상승 중` : `▼ ${scoreTrend}점 하락`}
                </p>
              )}
            </div>
            {latestScore && (
              <div style={{
                background: 'var(--primary-light)', borderRadius: 10, padding: '6px 12px', textAlign: 'right',
              }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 1 }}>최근</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{latestScore}점</p>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 10, right: 4, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c6af0" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#7c6af0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={26} />
              <Tooltip content={<CustomTooltip />} />
              {/* Goal line */}
              <ReferenceLine y={GOAL_SCORE} stroke="#7c6af0" strokeDasharray="4 3" strokeOpacity={0.4}
                label={{ value: `목표 ${GOAL_SCORE}`, position: 'right', fontSize: 10, fill: '#7c6af0' }} />
              <Area
                type="monotone" dataKey="score"
                stroke="var(--primary)" strokeWidth={2.5}
                fill="url(#scoreGrad)"
                dot={(props) => <CustomDot {...props} data={chartData} />}
                activeDot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent interviews */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '22px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>최근 면접 기록</h3>
            <button onClick={() => navigate('/interview/setup')}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                padding: '3px 9px', borderRadius: 6, transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >+ 새 면접</button>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎤</div>
              <p style={{ fontSize: 13 }}>아직 면접 기록이 없어요</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>첫 면접을 시작해보세요!</p>
            </div>
          ) : sessions.map((s, i) => (
            <div key={s.id}
              onClick={() => navigate(`/interview/result/${s.id}`)}
              onMouseEnter={() => setHoveredRow(s.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 8px', cursor: 'pointer',
                borderBottom: i < sessions.length - 1 ? '1px solid var(--border-light)' : 'none',
                borderRadius: 8, margin: '0 -8px',
                background: hoveredRow === s.id ? 'var(--bg)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 1 }}>{s.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.positionTitle} · {s.endedAt?.slice(0, 10)}</p>
              </div>
              <span style={{
                fontSize: 15, fontWeight: 800,
                color: s.feedback?.overallScore >= 80 ? 'var(--success)' : s.feedback?.overallScore >= 60 ? 'var(--warning)' : '#e05252',
              }}>{s.feedback?.overallScore ?? '—'}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>점</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
