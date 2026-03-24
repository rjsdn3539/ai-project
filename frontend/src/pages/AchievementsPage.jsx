import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ACHIEVEMENTS,
  TIER_COLORS,
  getStats,
  saveStats,
  getBookmarks,
  removeBookmark,
} from '../utils/achievements'

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  ALL: '전체',
  INTERVIEW: '면접',
  STUDY: '학습',
  STREAK: '스트릭',
  BOOKMARK: '북마크',
  SPECIAL: '특별 🌟',
}

const TIER_LABEL = {
  bronze: 'BRONZE',
  silver: 'SILVER',
  gold: 'GOLD',
  diamond: 'DIAMOND',
}

const STREAK_MILESTONES = [3, 7, 30, 100]

function getNextMilestone(streak) {
  return STREAK_MILESTONES.find((m) => m > streak) || null
}

function formatDate(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}.${m}.${day}`
  } catch {
    return ''
  }
}

// ── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({ achievement, unlockedAt }) {
  const isUnlocked = !!unlockedAt
  const color = TIER_COLORS[achievement.tier] || '#9ea8b3'
  const tierLabel = TIER_LABEL[achievement.tier] || achievement.tier?.toUpperCase()

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 16,
      padding: '24px 20px',
      border: isUnlocked
        ? `1.5px solid ${color}50`
        : '1.5px solid var(--border-light)',
      boxShadow: isUnlocked
        ? `0 4px 20px ${color}18, 0 1px 4px rgba(0,0,0,0.06)`
        : 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 10,
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      position: 'relative',
      overflow: 'hidden',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = isUnlocked
          ? `0 8px 32px ${color}28, 0 2px 8px rgba(0,0,0,0.08)`
          : '0 4px 16px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = isUnlocked
          ? `0 4px 20px ${color}18, 0 1px 4px rgba(0,0,0,0.06)`
          : 'var(--shadow-sm)'
      }}
    >
      {/* Top accent bar for unlocked */}
      {isUnlocked && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${color}60, ${color}, ${color}60)`,
          borderRadius: '16px 16px 0 0',
        }} />
      )}

      {/* Icon */}
      <div style={{
        fontSize: 36,
        filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.35)',
        lineHeight: 1,
        marginTop: 4,
      }}>
        {achievement.icon}
      </div>

      {/* Tier badge */}
      <span style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.08em',
        color: isUnlocked ? color : 'var(--text-muted)',
        background: isUnlocked ? `${color}18` : 'var(--bg)',
        border: `1px solid ${isUnlocked ? color + '40' : 'var(--border)'}`,
        borderRadius: 99,
        padding: '3px 9px',
      }}>
        {tierLabel}
      </span>

      {/* Title */}
      <p style={{
        fontSize: 14,
        fontWeight: 700,
        color: isUnlocked ? 'var(--text)' : 'var(--text-muted)',
        margin: 0,
        lineHeight: 1.3,
      }}>
        {achievement.title}
      </p>

      {/* Description */}
      <p style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
        margin: 0,
        lineHeight: 1.5,
      }}>
        {achievement.description}
      </p>

      {/* Footer */}
      {isUnlocked ? (
        <p style={{
          fontSize: 11,
          color,
          fontWeight: 700,
          margin: 0,
          marginTop: 2,
        }}>
          ✓ {formatDate(unlockedAt)} 달성
        </p>
      ) : (
        <p style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          margin: 0,
          marginTop: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          🔒 {achievement.hint}
        </p>
      )}
    </div>
  )
}

// ── Stat Item ─────────────────────────────────────────────────────────────────
function StatItem({ label, value, icon }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 12,
      padding: '14px 18px',
      border: '1px solid var(--border-light)',
      textAlign: 'center',
      flex: 1,
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function AchievementsPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(getStats())
  const [bookmarks, setBookmarks] = useState(getBookmarks())
  const [activeTab, setActiveTab] = useState('ALL')

  // Reload on focus (in case stats updated from another page)
  useEffect(() => {
    const onFocus = () => {
      setStats(getStats())
      setBookmarks(getBookmarks())
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const unlockedAt = stats.unlockedAt || {}
  const unlockedCount = Object.keys(unlockedAt).length
  const totalCount = ACHIEVEMENTS.length

  const currentStreak = stats.currentStreak || 0
  const longestStreak = stats.longestStreak || 0
  const nextMilestone = getNextMilestone(currentStreak)
  const streakProgress = nextMilestone
    ? Math.min(100, Math.round((currentStreak / nextMilestone) * 100))
    : 100

  const tabs = ['ALL', 'INTERVIEW', 'STUDY', 'STREAK', 'BOOKMARK', 'SPECIAL']

  const filteredAchievements = activeTab === 'ALL'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === activeTab)

  const handleRemoveBookmark = (id) => {
    removeBookmark(id)
    const newBookmarks = getBookmarks()
    setBookmarks(newBookmarks)
    // Update totalBookmarks in stats
    const s = getStats()
    s.totalBookmarks = newBookmarks.length
    saveStats(s)
    setStats(getStats())
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 32 }}>🏆</span>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
              업적 &amp; 뱃지
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, marginTop: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{unlockedCount}</span>
              <span style={{ color: 'var(--text-muted)' }}> / {totalCount} 달성</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatItem label="총 면접" value={`${stats.totalInterviews}회`} icon="🎤" />
        <StatItem label="학습 문제" value={`${stats.totalStudyProblems}개`} icon="📚" />
        <StatItem label="현재 스트릭" value={`${currentStreak}일`} icon="🔥" />
        <StatItem label="북마크" value={`${bookmarks.length}개`} icon="📌" />
      </div>

      {/* ── Streak Section ── */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '20px 24px',
        border: '1.5px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>🔥 연속 학습 스트릭</h2>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          {/* Current streak badge */}
          <div style={{
            background: currentStreak > 0
              ? 'linear-gradient(135deg, #ff6b00 0%, #ffa500 100%)'
              : 'var(--bg)',
            borderRadius: 14,
            padding: '14px 22px',
            textAlign: 'center',
            border: currentStreak > 0 ? 'none' : '1.5px solid var(--border)',
            boxShadow: currentStreak > 0 ? '0 4px 14px rgba(255,107,0,0.3)' : 'none',
          }}>
            <div style={{
              fontSize: 28,
              fontWeight: 900,
              color: currentStreak > 0 ? '#fff' : 'var(--text-muted)',
              lineHeight: 1,
            }}>
              🔥 {currentStreak}일
            </div>
            <div style={{
              fontSize: 11,
              color: currentStreak > 0 ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
              marginTop: 4,
              fontWeight: 600,
            }}>
              현재 스트릭
            </div>
          </div>

          {/* Longest streak */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f5c518', lineHeight: 1 }}>
              🏅 {longestStreak}일
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
              최장 스트릭
            </div>
          </div>

          {/* Milestones */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {STREAK_MILESTONES.map((m) => {
              const reached = longestStreak >= m
              return (
                <div key={m} style={{
                  borderRadius: 8,
                  padding: '6px 12px',
                  border: `1.5px solid ${reached ? '#f5c518' : 'var(--border)'}`,
                  background: reached ? 'rgba(245,197,24,0.12)' : 'var(--bg)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: reached ? '#f5c518' : 'var(--text-muted)',
                }}>
                  {reached ? '✓' : '○'} {m}일
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress bar to next milestone */}
        {nextMilestone && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                다음 목표: {nextMilestone}일 스트릭
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                {currentStreak} / {nextMilestone}
              </span>
            </div>
            <div style={{ height: 7, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${streakProgress}%`,
                background: 'linear-gradient(90deg, #ff6b00, #ffa500)',
                borderRadius: 99,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )}
        {!nextMilestone && currentStreak >= 100 && (
          <p style={{ fontSize: 13, color: '#9d8df8', fontWeight: 700, textAlign: 'center', margin: 0 }}>
            💎 모든 스트릭 목표 달성! 전설적인 학습자입니다!
          </p>
        )}
      </div>

      {/* ── Overall Progress Bar ── */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 14,
        padding: '16px 20px',
        border: '1px solid var(--border-light)',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>전체 달성률</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>
            {Math.round((unlockedCount / totalCount) * 100)}%
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(unlockedCount / totalCount) * 100}%`,
            background: 'linear-gradient(90deg, #7c6af0, #0ea5e9)',
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          {Object.entries(TIER_COLORS).map(([tier, color]) => {
            const tierAchievements = ACHIEVEMENTS.filter((a) => a.tier === tier)
            const tierUnlocked = tierAchievements.filter((a) => unlockedAt[a.id]).length
            return (
              <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <span style={{ color: 'var(--text-muted)' }}>
                  {TIER_LABEL[tier]}: {tierUnlocked}/{tierAchievements.length}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          const tabAchievements = tab === 'ALL' ? ACHIEVEMENTS : ACHIEVEMENTS.filter((a) => a.category === tab)
          const tabUnlocked = tabAchievements.filter((a) => unlockedAt[a.id]).length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                border: `1.5px solid ${isActive ? '#7c6af0' : 'var(--border)'}`,
                background: isActive ? '#7c6af0' : 'var(--surface)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {CATEGORY_LABELS[tab]}
              <span style={{
                marginLeft: 5,
                fontSize: 11,
                opacity: 0.75,
              }}>
                {tabUnlocked}/{tabAchievements.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Badge Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
        marginBottom: 32,
      }}>
        {filteredAchievements.map((achievement) => (
          <BadgeCard
            key={achievement.id}
            achievement={achievement}
            unlockedAt={unlockedAt[achievement.id] || null}
          />
        ))}
      </div>

      {/* ── Bookmarked Questions Section ── */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            📌 북마크한 질문
          </h2>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 99,
            padding: '3px 10px',
          }}>
            {bookmarks.length}개
          </span>
        </div>

        {bookmarks.length === 0 ? (
          <div style={{
            background: 'var(--surface)',
            borderRadius: 14,
            padding: '40px 24px',
            textAlign: 'center',
            border: '1.5px dashed var(--border)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📌</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              아직 북마크한 질문이 없어요
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              면접 결과 페이지에서 질문 옆의 📌 버튼으로 저장해보세요
            </p>
            <button
              onClick={() => navigate('/interview/setup')}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: '#7c6af0',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              면접 시작하기 →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 14,
                  padding: '18px 20px',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div style={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(124,106,240,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}>
                  📌
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text)',
                    margin: '0 0 6px',
                    lineHeight: 1.5,
                  }}>
                    {bm.questionText}
                  </p>
                  {bm.answerText && (
                    <div style={{
                      background: 'var(--bg)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      marginBottom: 6,
                      border: '1px solid var(--border-light)',
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#7c6af0', marginBottom: 4 }}>내 답변</p>
                      <p style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {bm.answerText}
                      </p>
                    </div>
                  )}
                  {bm.date && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      {formatDate(bm.date)} 저장
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveBookmark(bm.id)}
                  title="북마크 제거"
                  style={{
                    flexShrink: 0,
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                    e.currentTarget.style.borderColor = '#ef4444'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                >
                  제거
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default AchievementsPage
