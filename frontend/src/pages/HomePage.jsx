import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import * as interviewApi from '../api/interview'
import * as userApi from '../api/user'
import * as bookApi from '../api/book'
import { getStats, ACHIEVEMENTS, TIER_COLORS, ensureAchievementStateLoaded } from '../utils/achievements'
import { readScopedString, writeScopedString } from '../utils/userScopedStorage'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return { text: '밤늦게도 열심이시네요', sub: '꾸준함이 합격을 만들어요' }
  if (h < 12) return { text: '좋은 아침이에요', sub: '오늘 면접 연습으로 하루를 시작해봐요' }
  if (h < 18) return { text: '오늘 하루도 파이팅', sub: '잠깐 연습하면 실력이 쌓여요' }
  return             { text: '저녁 시간에도 열심이네요', sub: '오늘의 마지막 연습, 해볼까요?' }
}

const AI_TIPS = [
  { tag: 'STAR 기법', text: '상황 → 과제 → 행동 → 결과 순서로 답변을 구성하면 면접관의 신뢰를 얻을 수 있습니다.' },
  { tag: '자기소개', text: '"저는 ~를 잘합니다"보다 "저는 ~를 통해 ~를 이뤄냈습니다"로 성과 중심으로 말해보세요.' },
  { tag: '모르는 질문', text: '"없습니다", "모르겠습니다"는 금물. "현재 배우고 있습니다"로 전환하는 습관을 들이세요.' },
  { tag: '두괄식 답변', text: '결론부터 말하고 이유를 설명하면 논리적이고 명확한 인상을 남깁니다.' },
]

const PRACTICE_QUESTIONS = [
  '자기소개를 1분 내로 해주세요.',
  '지원 동기와 입사 후 포부를 말해주세요.',
  '본인의 가장 큰 강점과 약점은 무엇인가요?',
  '팀 프로젝트에서 갈등이 생겼을 때 어떻게 해결했나요?',
  '가장 어려웠던 기술적 문제와 해결 과정을 설명해주세요.',
  '5년 후 본인의 모습을 어떻게 그리고 있나요?',
  '왜 이 회사여야 하는지 구체적으로 말해주세요.',
  '실패 경험과 그것에서 배운 점을 이야기해주세요.',
  '업무 중 우선순위가 충돌할 때 어떻게 처리하나요?',
  '최신 기술 트렌드에 대해 어떻게 학습하고 있나요?',
  '직전 직장(또는 프로젝트)에서 가장 잘한 일은 무엇인가요?',
  '리더십 경험이 있다면 구체적으로 설명해주세요.',
  '고객/사용자의 요구사항이 기술적으로 불가능할 때 어떻게 대처하나요?',
  '새로운 기술을 빠르게 습득한 경험을 말해주세요.',
  '협업 도구나 방법론 중 선호하는 것이 있나요?',
  '코드 리뷰나 피드백을 받았을 때 어떻게 반응하나요?',
  '대규모 트래픽 또는 장애 상황에서의 대처 경험을 말해주세요.',
  '이직 이유가 무엇인가요?',
  '현재 업계에서 가장 주목하는 기술/트렌드는 무엇이라고 생각하나요?',
  '마지막으로 면접관에게 하고 싶은 질문이 있나요?',
]

// cols: 3컬럼 그리드에서 차지하는 칸 수
const WIDGET_DEFS = [
  { id: 'cta',       label: '면접 시작',      icon: '🎤', desc: '메인 면접 시작 카드',            cols: 2 },
  { id: 'history',   label: '최근 면접 기록', icon: '📋', desc: '최근 4개의 면접 세션',            cols: 1 },
  { id: 'tip',       label: 'AI 코칭 팁',    icon: '🤖', desc: '오늘의 면접 팁',                 cols: 2 },
  { id: 'quickmenu', label: '빠른 메뉴',     icon: '⚡', desc: 'AI 학습, 도서, 통계 바로가기',    cols: 1 },
  { id: 'dday',      label: 'D-Day 카운터',   icon: '📅', desc: '면접 목표일 카운트다운',           cols: 1 },
  { id: 'memo',      label: '메모장',          icon: '📝', desc: '간단한 메모 작성',               cols: 1 },
  { id: 'mystats',   label: '내 통계',         icon: '📈', desc: '점수 추이 및 세션 분석',          cols: 2 },
  { id: 'bookpick',  label: '추천 도서',        icon: '📚', desc: '오늘의 추천 면접 준비 도서',      cols: 1 },
  { id: 'question',  label: '오늘의 연습 질문', icon: '❓', desc: '랜덤 면접 연습 질문',            cols: 1 },
  { id: 'streak',       label: '학습 스트릭',  icon: '🔥', desc: '연속 학습 일수 추적',       cols: 1 },
  { id: 'achievements', label: '나의 업적',    icon: '🏆', desc: '달성한 뱃지와 업적 현황',    cols: 1 },
]

const DEFAULT_WIDGETS = ['cta', 'history', 'tip', 'quickmenu']

function normalizeInterviewSession(session) {
  const feedback = session?.feedback || {}

  return {
    ...session,
    company: session?.title || '제목 없음',
    position: session?.positionTitle || '직무 미지정',
    overallScore: feedback?.overallScore ?? null,
    deliveryScore: feedback?.relevanceScore ?? null,
    logicScore: feedback?.logicScore ?? null,
    expertiseScore: feedback?.specificityScore ?? null,
  }
}

// ── 스트릭 위젯 ───────────────────────────────────────────────────────────────
function StreakWidget() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(() => getStats())

  useEffect(() => {
    const onFocus = async () => {
      await ensureAchievementStateLoaded(true)
      setStats(getStats())
    }
    const onUnlocked = () => setStats(getStats())
    onFocus()
    window.addEventListener('focus', onFocus)
    window.addEventListener('achievement-unlocked', onUnlocked)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('achievement-unlocked', onUnlocked)
    }
  }, [])

  const currentStreak = stats.currentStreak || 0
  const longestStreak = stats.longestStreak || 0
  const unlockedAt = stats.unlockedAt || {}

  // Recent unlocked badge
  const recentBadge = ACHIEVEMENTS
    .filter((a) => unlockedAt[a.id])
    .sort((a, b) => new Date(unlockedAt[b.id]) - new Date(unlockedAt[a.id]))[0] || null

  // Next streak milestone
  const MILESTONES = [3, 7, 30, 100]
  const nextMilestone = MILESTONES.find((m) => m > currentStreak) || null
  const progress = nextMilestone
    ? Math.min(100, Math.round((currentStreak / nextMilestone) * 100))
    : 100

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 20,
      padding: '22px 24px',
      border: '1.5px solid var(--border-light)',
      boxShadow: 'var(--shadow-sm)',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>🔥 학습 스트릭</h3>
        <button
          onClick={() => navigate('/achievements')}
          style={{
            background: 'none', border: 'none',
            color: 'var(--primary)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            padding: '4px 10px', borderRadius: 7,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          업적 보기 →
        </button>
      </div>

      {/* Current streak */}
      <div style={{
        background: currentStreak > 0
          ? 'linear-gradient(135deg, #ff6b00 0%, #ffa500 100%)'
          : 'var(--bg)',
        borderRadius: 14,
        padding: '16px',
        textAlign: 'center',
        border: currentStreak > 0 ? 'none' : '1.5px solid var(--border)',
        boxShadow: currentStreak > 0 ? '0 4px 14px rgba(255,107,0,0.28)' : 'none',
      }}>
        <div style={{
          fontSize: 30,
          fontWeight: 900,
          color: currentStreak > 0 ? '#fff' : 'var(--text-muted)',
          lineHeight: 1,
          marginBottom: 4,
        }}>
          🔥 {currentStreak}일
        </div>
        <div style={{
          fontSize: 11,
          color: currentStreak > 0 ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)',
          fontWeight: 600,
        }}>
          {currentStreak === 0 ? '오늘 학습을 시작해보세요!' : '연속 학습 중'}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f5c518', lineHeight: 1 }}>
            {longestStreak}일
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
            최장 기록
          </div>
        </div>
        <div style={{ width: 1, background: 'var(--border-light)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
            {Object.keys(unlockedAt).length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
            업적 달성
          </div>
        </div>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>다음 목표: {nextMilestone}일</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ff6b00, #ffa500)',
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, textAlign: 'center', color: '#9d8df8', fontWeight: 700 }}>
          💎 최고 기록 달성!
        </div>
      )}

      {/* Recent badge */}
      {recentBadge && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          background: 'var(--bg)',
          border: '1px solid var(--border-light)',
        }}>
          <span style={{ fontSize: 20 }}>{recentBadge.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: TIER_COLORS[recentBadge.tier], margin: 0 }}>
              최근 달성
            </p>
            <p style={{
              fontSize: 12,
              color: 'var(--text)',
              margin: 0,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {recentBadge.title}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 업적 위젯 ─────────────────────────────────────────────────────────────────
function AchievementsWidget() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(() => getStats())

  useEffect(() => {
    const refresh = async () => {
      await ensureAchievementStateLoaded(true)
      setStats(getStats())
    }
    const onUnlocked = () => setStats(getStats())
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('achievement-unlocked', onUnlocked)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('achievement-unlocked', onUnlocked)
    }
  }, [])

  const unlockedAt = stats.unlockedAt || {}
  const unlockedCount = Object.keys(unlockedAt).length
  const totalCount = ACHIEVEMENTS.length
  const percent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  // Last 3 recently unlocked
  const recent = ACHIEVEMENTS
    .filter((a) => unlockedAt[a.id])
    .sort((a, b) => new Date(unlockedAt[b.id]) - new Date(unlockedAt[a.id]))
    .slice(0, 3)

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 20,
      padding: '22px 24px',
      border: '1.5px solid var(--border-light)',
      boxShadow: 'var(--shadow-sm)',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>🏆 나의 업적</h3>
        <button
          onClick={() => navigate('/achievements')}
          style={{
            background: 'none', border: 'none',
            color: 'var(--primary)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            padding: '4px 10px', borderRadius: 7,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          전체 보기 →
        </button>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {unlockedCount} / {totalCount} 달성
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)' }}>{percent}%</span>
        </div>
        <div style={{ height: 7, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #7c6af0, #0ea5e9)',
            borderRadius: 99,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Tier breakdown */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Object.entries(TIER_COLORS).map(([tier, color]) => {
          const tierTotal = ACHIEVEMENTS.filter((a) => a.tier === tier).length
          const tierDone = ACHIEVEMENTS.filter((a) => a.tier === tier && unlockedAt[a.id]).length
          return (
            <div key={tier} style={{
              flex: 1,
              textAlign: 'center',
              background: tierDone > 0 ? `${color}12` : 'var(--bg)',
              borderRadius: 10,
              padding: '8px 4px',
              border: `1px solid ${tierDone > 0 ? color + '35' : 'var(--border-light)'}`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: tierDone > 0 ? color : 'var(--text-muted)' }}>
                {tierDone}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                {tier.toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recently unlocked */}
      {recent.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {recent.map((a) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--border-light)',
            }}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: TIER_COLORS[a.tier], margin: 0 }}>
                  {a.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            면접·학습을 완료하면<br />업적이 잠금 해제돼요
          </p>
        </div>
      )}
    </div>
  )
}

// ── D-Day 위젯 ───────────────────────────────────────────────────────────────
function DDayWidget() {
  const [targetDate, setTargetDate] = useState(() => readScopedString('ddayTarget'))
  const [label, setLabel]           = useState(() => readScopedString('ddayLabel', '목표 면접'))
  const [editing, setEditing]       = useState(!readScopedString('ddayTarget'))
  const [focused, setFocused]       = useState(null)

  const daysLeft = targetDate
    ? Math.ceil((new Date(targetDate) - new Date().setHours(0, 0, 0, 0)) / 86400000)
    : null

  const save = () => {
    if (!targetDate) return
    writeScopedString('ddayTarget', targetDate)
    writeScopedString('ddayLabel', label)
    setEditing(false)
  }

  const color = daysLeft == null ? 'var(--primary)'
    : daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? 'var(--warning)' : 'var(--primary)'

  const iStyle = (f) => ({
    width: '100%', padding: '9px 12px', borderRadius: 9, boxSizing: 'border-box',
    border: `1.5px solid ${focused === f ? 'var(--primary)' : 'var(--border)'}`,
    fontSize: 13, outline: 'none', fontFamily: 'inherit', color: 'var(--text)',
    boxShadow: focused === f ? '0 0 0 3px rgba(124,106,240,0.1)' : 'none',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '22px 24px', border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>📅 D-Day 카운터</h3>
        {!editing && <button onClick={() => setEditing(true)} style={{ background: 'none', border: '1px solid var(--border-light)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: '3px 8px', borderRadius: 6 }}>편집</button>}
      </div>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="라벨 (예: 카카오 최종 면접)" value={label} onChange={(e) => setLabel(e.target.value)} onFocus={() => setFocused('l')} onBlur={() => setFocused(null)} style={iStyle('l')} />
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} onFocus={() => setFocused('d')} onBlur={() => setFocused(null)} style={iStyle('d')} />
          <div style={{ display: 'flex', gap: 8 }}>
            {targetDate && <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>}
            <button onClick={save} style={{ flex: 1, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
          </div>
        </div>
      ) : daysLeft == null ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>목표 날짜를 설정해보세요</p>
          <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ 날짜 설정</button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
          <div style={{ fontSize: 52, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>
            {daysLeft === 0 ? 'D-Day' : daysLeft > 0 ? `D-${daysLeft}` : `D+${Math.abs(daysLeft)}`}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{targetDate}</p>
          {daysLeft >= 0 && daysLeft <= 7 && (
            <p style={{ fontSize: 12, fontWeight: 700, color, marginTop: 8 }}>{daysLeft === 0 ? '🔥 오늘이에요! 파이팅!' : `🔥 ${daysLeft}일 남았어요!`}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── 메모 위젯 ────────────────────────────────────────────────────────────────
function MemoWidget() {
  const [memo, setMemo]       = useState(() => readScopedString('homeMemo'))
  const [focused, setFocused] = useState(false)
  useEffect(() => { writeScopedString('homeMemo', memo) }, [memo])
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, padding: '22px 24px', border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>📝 메모장</h3>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{memo.length} / 500</span>
      </div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value.slice(0, 500))}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder="면접 준비 메모, 키워드, 아이디어를 적어두세요..."
        style={{
          flex: 1, minHeight: 120, resize: 'none',
          border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 10, padding: '10px 13px', fontSize: 13, lineHeight: 1.7, outline: 'none',
          fontFamily: 'inherit', color: 'var(--text)', background: 'var(--bg)',
          boxShadow: focused ? '0 0 0 3px rgba(124,106,240,0.1)' : 'none', transition: 'all 0.15s',
        }}
      />
    </div>
  )
}

// ── 위젯 추가 패널 ────────────────────────────────────────────────────────────
function AddWidgetPanel({ inactiveIds, onAdd, onClose }) {
  const inactive = WIDGET_DEFS.filter((w) => inactiveIds.includes(w.id))
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, background: 'var(--surface)', zIndex: 201, boxShadow: '-8px 0 40px rgba(0,0,0,0.13)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0 }}>위젯 추가</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)', lineHeight: 1, padding: '2px 6px' }}>×</button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>추가할 위젯을 선택하세요.</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {inactive.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>모든 위젯이 추가됐어요</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>× 버튼으로 위젯을 제거할 수 있어요.</p>
            </div>
          ) : inactive.map(({ id, label, icon, desc }) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--border-light)', background: 'var(--surface)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: 'var(--bg)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{desc}</p>
              </div>
              <button onClick={() => onAdd(id)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 9, background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>닫기</button>
        </div>
      </div>
    </>
  )
}

// ── 메인 홈 ──────────────────────────────────────────────────────────────────
function HomePage() {
  const { user, accessToken } = useAuthStore()
  const navigate  = useNavigate()
  const [sessions, setSessions]     = useState([])
  const [ctaHovered, setCtaHovered] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [showAddPanel, setShowAddPanel] = useState(false)

  const [activeWidgets, setActiveWidgets] = useState([...DEFAULT_WIDGETS])
  const [widgetsReady, setWidgetsReady]   = useState(false)

  const [featuredBook, setFeaturedBook]   = useState(null)
  const [questionIdx, setQuestionIdx]     = useState(() => new Date().getDate() % PRACTICE_QUESTIONS.length)

  // 드래그 상태
  const [dragId, setDragId]     = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const saveTimer = useRef(null)

  const greeting = getGreeting()
  const tip = AI_TIPS[new Date().getDate() % AI_TIPS.length]

  // 로그인 유저 → 서버에서 로드, 비로그인 → localStorage
  useEffect(() => {
    if (!accessToken) {
      try {
        const saved = localStorage.getItem('homeWidgets_guest')
        setActiveWidgets(saved ? JSON.parse(saved) : [...DEFAULT_WIDGETS])
      } catch { setActiveWidgets([...DEFAULT_WIDGETS]) }
      setWidgetsReady(true)
      return
    }
    userApi.getWidgetConfig()
      .then(({ data }) => {
        const raw = data.data
        setActiveWidgets(raw ? JSON.parse(raw) : [...DEFAULT_WIDGETS])
      })
      .catch(() => setActiveWidgets([...DEFAULT_WIDGETS]))
      .finally(() => setWidgetsReady(true))
  }, [accessToken])

  // 위젯 변경 시 저장 (debounce 800ms)
  useEffect(() => {
    if (!widgetsReady) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const json = JSON.stringify(activeWidgets)
      if (accessToken) {
        userApi.saveWidgetConfig(json).catch(() => {})
      } else {
        localStorage.setItem('homeWidgets_guest', json)
      }
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [activeWidgets, widgetsReady, accessToken])

  useEffect(() => {
    if (!accessToken) return
    interviewApi.getSessions()
      .then(({ data }) => {
        const rawSessions = Array.isArray(data?.data) ? data.data : []
        setSessions(rawSessions.slice(0, 4).map(normalizeInterviewSession))
      })
      .catch(() => setSessions([]))
  }, [accessToken])

  useEffect(() => {
    bookApi.getBooks('', 0)
      .then(({ data }) => {
        const list = data.data?.content || data.data || []
        if (list.length > 0) {
          const idx = new Date().getDate() % list.length
          setFeaturedBook(list[idx])
        }
      })
      .catch(() => {})
  }, [])

  const latestScore = sessions.length > 0 ? sessions[sessions.length - 1]?.overallScore : null
  const prevScore   = sessions.length > 1 ? sessions[sessions.length - 2]?.overallScore : null
  const scoreTrend  = latestScore != null && prevScore != null ? latestScore - prevScore : null
  const avgScore    = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + (x.overallScore || 0), 0) / sessions.length)
    : null

  const handleCtaClick = () => navigate(accessToken ? '/interview/setup' : '/auth/login')

  const removeWidget = (id) => setActiveWidgets((prev) => prev.filter((w) => w !== id))
  const addWidget    = (id) => setActiveWidgets((prev) => [...prev, id])
  const inactiveIds  = WIDGET_DEFS.map((w) => w.id).filter((id) => !activeWidgets.includes(id))

  // ── 드래그 핸들러 ──
  const onDragStart = (e, id) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragEnd = () => { setDragId(null); setDragOver(null) }
  const onDragOver = (e, id) => { e.preventDefault(); if (id !== dragId) setDragOver(id) }
  const onDrop = (e, targetId) => {
    e.preventDefault()
    if (!dragId || dragId === targetId) return
    setActiveWidgets((prev) => {
      const arr = [...prev]
      const from = arr.indexOf(dragId)
      const to   = arr.indexOf(targetId)
      arr.splice(from, 1)
      arr.splice(to, 0, dragId)
      return arr
    })
    setDragId(null)
    setDragOver(null)
  }

  // ── 위젯 렌더 맵 ──
  const renderContent = (id) => {
    switch (id) {

      case 'cta': return (
        <div
          onMouseEnter={() => setCtaHovered(true)}
          onMouseLeave={() => setCtaHovered(false)}
          onClick={handleCtaClick}
          style={{
            borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
            boxShadow: ctaHovered ? '0 24px 60px rgba(61,46,224,0.4)' : '0 10px 36px rgba(61,46,224,0.24)',
            transform: ctaHovered ? 'translateY(-3px)' : 'none',
            transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <div style={{ background: 'linear-gradient(130deg, #3d2ee0 0%, #7c6af0 52%, #0ea5e9 100%)', padding: '38px 40px 34px', position: 'relative', overflow: 'hidden', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', top: -60, right: -20, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.055)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -80, left: 60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', borderRadius: 99, padding: '6px 14px', marginBottom: 22, border: '1px solid rgba(255,255,255,0.22)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 3px rgba(74,222,128,0.3)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>AI 면접관 대기 중</span>
              </div>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 14, letterSpacing: '-0.02em' }}>지금 면접을<br />시작할까요?</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, maxWidth: 360 }}>
                {latestScore ? `지난 면접 ${latestScore}점, 오늘은 더 높이 갈 수 있어요.` : 'AI가 실제 면접관처럼 질문하고, 답변을 분석해 구체적인 피드백을 드립니다.'}
              </p>
            </div>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
              <button onClick={(e) => { e.stopPropagation(); handleCtaClick() }} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--surface)', color: '#3d2ee0', border: 'none', borderRadius: 14, padding: '15px 32px', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(0,0,0,0.22)', transition: 'transform 0.18s ease', transform: ctaHovered ? 'scale(1.05)' : 'none' }}>
                {accessToken ? '🚀 지금 시작하기' : '🔑 로그인하고 시작하기'}
              </button>
              <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎤</div>
            </div>
          </div>
          <div style={{ background: '#231c5a', padding: '14px 40px', display: 'flex', gap: 24, alignItems: 'center' }}>
            {(accessToken ? [
              { label: '총 면접', value: `${sessions.length}회` },
              ...(latestScore != null ? [{ label: '최근 점수', value: `${latestScore}점` }] : []),
              ...(scoreTrend != null ? [{ label: '추세', value: scoreTrend > 0 ? `▲ +${scoreTrend}점` : scoreTrend < 0 ? `▼ ${scoreTrend}점` : '= 유지', color: scoreTrend > 0 ? '#4ade80' : scoreTrend < 0 ? '#f87171' : 'var(--text-muted)' }] : []),
              ...(avgScore ? [{ label: '평균', value: `${avgScore}점`, color: '#7dd3fc' }] : []),
            ] : [
              { label: '누적 면접 횟수', value: '무제한' },
              { label: 'AI 피드백', value: '실시간' },
              { label: '분석 항목', value: '10가지+' },
            ]).map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: color || 'rgba(255,255,255,0.9)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )

      case 'history': return (
        <div style={{ background: 'var(--surface)', borderRadius: 22, border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>최근 면접 기록</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{!accessToken ? '로그인 후 확인 가능' : sessions.length > 0 ? `총 ${sessions.length}회 완료` : '아직 기록이 없어요'}</p>
            </div>
            {accessToken && <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px', borderRadius: 7 }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>전체 보기 →</button>}
          </div>
          <div style={{ flex: 1, padding: '10px 16px' }}>
            {!accessToken ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', marginBottom: 16, background: 'var(--bg-warm)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🔒</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>로그인이 필요해요</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.65 }}>면접 기록은 로그인 후<br />확인하실 수 있어요</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button onClick={() => navigate('/auth/login')} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>로그인</button>
                  <button onClick={() => navigate('/auth/register')} style={{ background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary-border)', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>회원가입</button>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 0' }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🎤</div>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>첫 면접을 시작해보세요</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>AI가 실전처럼 질문하고<br />상세한 피드백을 드려요</p>
                <button onClick={() => navigate('/interview/setup')} style={{ marginTop: 20, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>시작하기 →</button>
              </div>
            ) : sessions.map((s, i) => (
              <div key={s.id} onClick={() => navigate(`/interview/result/${s.id}`)} onMouseEnter={() => setHoveredRow(s.id)} onMouseLeave={() => setHoveredRow(null)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 10px', borderRadius: 12, cursor: 'pointer', background: hoveredRow === s.id ? 'var(--bg)' : 'transparent', borderBottom: i < sessions.length - 1 ? '1px solid var(--border-light)' : 'none', transition: 'background 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'var(--bg-warm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'var(--text-secondary)' }}>{s.company?.[0] || '?'}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{s.company}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.position} · {s.endedAt}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: s.overallScore >= 80 ? 'var(--success)' : s.overallScore >= 60 ? 'var(--warning)' : '#e05252' }}>{s.overallScore}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>점</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

      case 'tip': return (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1.5px solid var(--primary-border)', padding: '22px 24px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid var(--primary-border)' }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>AI 오늘의 코칭 팁</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 9px', borderRadius: 99 }}>{tip.tag}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border)', marginLeft: 'auto' }}>{new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.75 }}>💡 {tip.text}</p>
            </div>
          </div>
          <button onClick={handleCtaClick} style={{ marginTop: 16, width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 11, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}>
            {accessToken ? '이 팁 적용해서 면접 연습하기 →' : '로그인하고 면접 연습하기 →'}
          </button>
        </div>
      )

      case 'quickmenu': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
          {[
            { icon: '📚', label: 'AI 학습', desc: '맞춤 문제로 지식 쌓기', path: '/learning', bg: 'var(--bg-purple)', border: 'var(--primary-border)' },
            { icon: '🛍', label: '도서 스토어', desc: '취업 도서 구경하기', path: '/books', bg: 'var(--surface)', border: 'var(--border)' },
            { icon: '📊', label: '내 통계', desc: '점수 추이 분석', path: accessToken ? '/dashboard' : '/auth/login', bg: 'var(--bg-indigo)', border: 'var(--accent-border)' },
          ].map(({ icon, label, desc, path, bg, border }) => (
            <div key={path} onClick={() => navigate(path)} style={{ background: bg, borderRadius: 14, padding: '14px 18px', cursor: 'pointer', border: `1.5px solid ${border}`, flex: 1, display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.18s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div><p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{label}</p><p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</p></div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>
      )

      case 'dday':         return <DDayWidget />
      case 'memo':         return <MemoWidget />
      case 'streak':       return <StreakWidget />
      case 'achievements': return <AchievementsWidget />

      case 'mystats': {
        const allScores = sessions.filter(s => s.overallScore != null)
        const maxScore  = allScores.length > 0 ? Math.max(...allScores.map(s => s.overallScore)) : null
        const categories = allScores.length > 0 ? [
          { label: '전달력', key: 'deliveryScore' },
          { label: '논리성', key: 'logicScore' },
          { label: '전문성', key: 'expertiseScore' },
        ].filter(c => sessions[0]?.[c.key] != null) : []
        return (
          <div style={{ background: 'var(--surface)', borderRadius: 22, border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', padding: '22px 24px', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>📈 내 통계</h3>
              {accessToken && <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px', borderRadius: 7 }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>전체 보기 →</button>}
            </div>
            {!accessToken ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>로그인 후 통계를 볼 수 있어요</p>
                <button onClick={() => navigate('/auth/login')} style={{ marginTop: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>로그인</button>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>면접을 완료하면 통계가 표시돼요</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 24 }}>
                {/* 요약 수치 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 140 }}>
                  {[
                    { label: '총 면접 횟수', value: `${sessions.length}회` },
                    { label: '평균 점수', value: avgScore ? `${avgScore}점` : '-' },
                    { label: '최고 점수', value: maxScore ? `${maxScore}점` : '-' },
                    ...(scoreTrend != null ? [{ label: '전회 대비', value: scoreTrend > 0 ? `▲ +${scoreTrend}점` : scoreTrend < 0 ? `▼ ${scoreTrend}점` : '= 유지', color: scoreTrend > 0 ? 'var(--success)' : scoreTrend < 0 ? '#e05252' : 'var(--text-muted)' }] : []),
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value}</p>
                    </div>
                  ))}
                </div>
                {/* 점수 막대 차트 */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>최근 면접 점수 추이</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
                    {[...sessions].reverse().map((s, i) => {
                      const score = s.overallScore || 0
                      const barH  = `${Math.max(8, (score / 100) * 90)}px`
                      const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : '#e05252'
                      return (
                        <div key={s.id} title={`${s.company} · ${score}점`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color }}>{score}</span>
                          <div style={{ width: '100%', height: barH, background: color, borderRadius: '4px 4px 0 0', opacity: 0.85, transition: 'height 0.3s' }} />
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 40 }}>{s.company?.[0] || '?'}</span>
                        </div>
                      )
                    })}
                  </div>
                  {categories.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>최근 세션 카테고리 점수</p>
                      {categories.map(({ label, key }) => {
                        const score = sessions[sessions.length - 1]?.[key] || 0
                        return (
                          <div key={key} style={{ marginBottom: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{score}점</span>
                            </div>
                            <div style={{ height: 5, borderRadius: 99, background: 'var(--bg)' }}>
                              <div style={{ height: '100%', borderRadius: 99, width: `${score}%`, background: 'var(--primary)', transition: 'width 0.4s' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      }

      case 'bookpick': return (
        <div style={{ background: 'var(--surface)', borderRadius: 22, border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', padding: '22px 24px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>📚 오늘의 추천 도서</h3>
            <button onClick={() => navigate('/books')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px', borderRadius: 7 }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>더 보기 →</button>
          </div>
          {!featuredBook ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>추천 도서를 불러오는 중이에요</p>
              <button onClick={() => navigate('/books')} style={{ marginTop: 14, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>도서 스토어 →</button>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bg-indigo)', borderRadius: 14, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
                <span style={{ fontSize: 52 }}>📗</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>{featuredBook.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{featuredBook.author}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>{featuredBook.price?.toLocaleString()}원</p>
              </div>
              <button onClick={() => navigate('/books')} style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}>도서 스토어에서 보기</button>
            </div>
          )}
        </div>
      )

      case 'question': return (
        <div style={{ background: 'var(--surface)', borderRadius: 22, border: '1.5px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', padding: '22px 24px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>❓ 오늘의 연습 질문</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 8px' }}>{questionIdx + 1} / {PRACTICE_QUESTIONS.length}</span>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-purple)', borderRadius: 14, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.7, textAlign: 'center' }}>💬 {PRACTICE_QUESTIONS[questionIdx]}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={() => setQuestionIdx((prev) => (prev - 1 + PRACTICE_QUESTIONS.length) % PRACTICE_QUESTIONS.length)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >← 이전</button>
            <button
              onClick={() => navigate(accessToken ? '/interview/setup' : '/auth/login')}
              style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}
            >이 질문으로 연습 →</button>
            <button
              onClick={() => setQuestionIdx((prev) => (prev + 1) % PRACTICE_QUESTIONS.length)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >다음 →</button>
          </div>
        </div>
      )

      default: return null
    }
  }

  return (
    <div style={{ width: '100%' }}>

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 5 }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          {accessToken ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>{user?.name}님, {greeting.text} 👋</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{greeting.sub}</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>AI 면접 플랫폼에 오신 걸 환영해요 👋</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>로그인하고 AI와 함께 실전 면접을 준비해보세요</p>
            </>
          )}
        </div>
        {accessToken && avgScore && (
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '14px 24px', textAlign: 'right', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>내 평균 점수</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{avgScore}점</p>
            {scoreTrend != null && (
              <p style={{ fontSize: 12, fontWeight: 700, color: scoreTrend > 0 ? 'var(--success)' : '#e05252', marginTop: 5 }}>
                {scoreTrend > 0 ? `▲ +${scoreTrend}` : `▼ ${scoreTrend}`}점 (지난 면접比)
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── 위젯 그리드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, gridAutoFlow: 'row dense', marginBottom: 16 }}>
        {activeWidgets.map((id) => {
          const def  = WIDGET_DEFS.find((w) => w.id === id)
          const cols = def?.cols ?? 1
          const isDragging = dragId === id
          const isOver     = dragOver === id

          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => onDragStart(e, id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onDragOver(e, id)}
              onDrop={(e) => onDrop(e, id)}
              style={{
                gridColumn: `span ${cols}`,
                opacity: isDragging ? 0.4 : 1,
                outline: isOver ? '2.5px dashed var(--primary)' : 'none',
                outlineOffset: 4,
                borderRadius: 22,
                transition: 'opacity 0.15s, outline 0.1s',
                position: 'relative',
              }}
            >
              {/* 드래그 핸들 + 제거 버튼 */}
              <div
                className="widget-overlay"
                style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 10,
                  display: 'flex', alignItems: 'center', gap: 4,
                  opacity: 0, transition: 'opacity 0.15s',
                  pointerEvents: 'none',
                }}
              >
                <span title="드래그하여 이동" style={{ cursor: 'grab', padding: '3px 5px', borderRadius: 6, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 12, lineHeight: 1 }}>⠿</span>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); removeWidget(id) }}
                  title="위젯 제거"
                  style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, pointerEvents: 'all' }}
                >×</button>
              </div>

              {renderContent(id)}
            </div>
          )
        })}
      </div>

      {/* ── + 위젯 추가 버튼 ── */}
      <div
        onClick={() => setShowAddPanel(true)}
        style={{ border: '2px dashed var(--border)', borderRadius: 18, padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, transition: 'all 0.18s', background: 'transparent', userSelect: 'none' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ fontSize: 18 }}>+</span>
        위젯 추가
        {inactiveIds.length > 0 && (
          <span style={{ fontSize: 12, background: 'var(--primary)', color: '#fff', borderRadius: 99, padding: '1px 8px' }}>{inactiveIds.length}</span>
        )}
      </div>

      {showAddPanel && (
        <AddWidgetPanel
          inactiveIds={inactiveIds}
          onAdd={(id) => { addWidget(id); if (inactiveIds.length === 1) setShowAddPanel(false) }}
          onClose={() => setShowAddPanel(false)}
        />
      )}
    </div>
  )
}

export default HomePage
