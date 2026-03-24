import { useState, useEffect, useCallback } from 'react'
import { TIER_COLORS } from '../utils/achievements'

const TOAST_DURATION = 4000

// ── Single Toast Item ─────────────────────────────────────────────────────────
function ToastItem({ achievement, onRemove }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const color = TIER_COLORS[achievement.tier] || '#7c6af0'

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 20)
    // Start leave animation before removal
    const leaveTimer = setTimeout(() => {
      setLeaving(true)
    }, TOAST_DURATION - 400)
    // Remove after animation
    const removeTimer = setTimeout(() => {
      onRemove()
    }, TOAST_DURATION)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(leaveTimer)
      clearTimeout(removeTimer)
    }
  }, [onRemove])

  const tierLabel = {
    bronze: 'BRONZE',
    silver: 'SILVER',
    gold: 'GOLD',
    diamond: 'DIAMOND',
  }[achievement.tier] || achievement.tier?.toUpperCase()

  const opacity = leaving ? 0 : visible ? 1 : 0
  const translateY = leaving ? 16 : visible ? 0 : 24

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px ${color}30, 0 4px 0 0 ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minWidth: 280,
        maxWidth: 360,
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${color}25`,
      }}
    >
      {/* Shimmer accent */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}80, ${color}, ${color}80)`,
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Icon */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: `${color}18`,
        border: `2px solid ${color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        flexShrink: 0,
      }}>
        {achievement.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            color,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            borderRadius: 99,
            padding: '2px 7px',
            letterSpacing: '0.06em',
          }}>
            {tierLabel}
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#22c55e',
            background: 'rgba(34,197,94,0.12)',
            borderRadius: 99,
            padding: '2px 7px',
          }}>
            🏅 업적 달성!
          </span>
        </div>
        <p style={{
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--text)',
          margin: 0,
          marginBottom: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {achievement.title}
        </p>
        <p style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: 1.4,
        }}>
          {achievement.description}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={() => { setLeaving(true); setTimeout(onRemove, 350) }}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
          marginTop: 2,
          lineHeight: 1,
          fontFamily: 'inherit',
        }}
      >
        ×
      </button>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        background: `${color}60`,
        borderRadius: '0 0 16px 16px',
        animation: `toastProgress ${TOAST_DURATION}ms linear forwards`,
      }} />

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────────────────
let _toastIdCounter = 0

export function AchievementToastProvider({ children }) {
  const [queue, setQueue] = useState([])

  const handleEvent = useCallback((e) => {
    const achievement = e.detail
    if (!achievement) return
    _toastIdCounter += 1
    setQueue((prev) => [...prev, { ...achievement, _toastId: _toastIdCounter }])
  }, [])

  useEffect(() => {
    window.addEventListener('achievement-unlocked', handleEvent)
    return () => window.removeEventListener('achievement-unlocked', handleEvent)
  }, [handleEvent])

  const removeToast = useCallback((toastId) => {
    setQueue((prev) => prev.filter((t) => t._toastId !== toastId))
  }, [])

  return (
    <>
      {children}
      {/* Toast container — bottom-right */}
      {queue.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}>
          {queue.map((achievement) => (
            <div key={achievement._toastId} style={{ pointerEvents: 'all' }}>
              <ToastItem
                achievement={achievement}
                onRemove={() => removeToast(achievement._toastId)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default AchievementToastProvider
