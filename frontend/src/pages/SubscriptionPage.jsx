import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import * as subscriptionApi from '../api/subscription'

const PLANS = [
  {
    tier: 'FREE', name: '무료', monthlyPrice: 0, yearlyPrice: 0,
    color: 'var(--text-secondary)', accentBg: 'var(--bg-slate)',
    features: ['면접 월 1회', '학습 퀴즈 일 20문제', '피드백 요약 제공', '프로필 문서 각 1개', '도서 구매 가능'],
    icon: '🌱',
  },
  {
    tier: 'STANDARD', name: 'Standard', monthlyPrice: 9900, yearlyPrice: 99000,
    color: 'var(--primary)', accentBg: 'var(--bg-indigo)',
    badge: null,
    features: ['면접 월 10회', '질문 수 최대 3개', 'AI 피드백 전체 제공', '학습 퀴즈 무제한', '면접 기록 3개월 보관', '프로필 문서 각 3개'],
    icon: '⚡',
  },
  {
    tier: 'PRO', name: 'Pro', monthlyPrice: 19900, yearlyPrice: 189000,
    color: 'var(--primary)', accentBg: 'var(--bg-purple)',
    badge: '인기',
    features: ['면접 무제한', '질문 수 최대 10개', '맞춤형 AI 질문', '면접 기록 무기한', '프로필 문서 무제한', '성과 분석 리포트', '도서 5% 할인'],
    icon: '🚀',
  },
  {
    tier: 'PREMIUM', name: 'Premium', monthlyPrice: 39900, yearlyPrice: 359000,
    color: 'var(--warning)', accentBg: 'var(--bg-warning)',
    badge: '프리미엄',
    features: ['Pro 모든 기능', '음성 발음 분석', '모범 답안 제공', '면접 음성 다운로드', '도서 10% 할인', '우선 고객 지원'],
    icon: '👑',
  },
]

const TIER_ORDER = { FREE: 0, STANDARD: 1, PRO: 2, PREMIUM: 3 }

const fmt = (d) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

function SubscriptionPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [billing, setBilling] = useState('monthly')
  const [status, setStatus] = useState(null)
  const [downgradeTarget, setDowngradeTarget] = useState(null)
  const [downgrading, setDowngrading] = useState(false)
  const [downgradeError, setDowngradeError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    subscriptionApi.getMySubscription()
      .then(({ data }) => setStatus(data.data))
      .catch(() => {})
  }, [])

  const currentTier = status?.tier || user?.subscriptionTier || 'FREE'
  const currentPlan = PLANS.find(p => p.tier === currentTier)
  const pendingPlan = status?.pendingDowngradeTier ? PLANS.find(p => p.tier === status.pendingDowngradeTier) : null

  const [loginToast, setLoginToast] = useState(false)

  const handleUpgradeClick = (plan) => {
    if (!user) {
      setLoginToast(true)
      setTimeout(() => setLoginToast(false), 3000)
      return
    }
    const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
    const periodLabel = billing === 'monthly' ? '월간' : '연간'
    navigate('/payment', {
      state: {
        orderName: `${plan.name} ${periodLabel} 구독`,
        totalAmount: price,
        type: 'subscription',
        planName: plan.name,
        planTier: plan.tier,
        billing,
        backTo: '/subscription',
      },
    })
  }

  const refreshStatus = async () => {
    try {
      const { data } = await subscriptionApi.getMySubscription()
      setStatus(data.data)
    } catch {}
  }

  const handleDowngradeConfirm = async () => {
    if (!downgradeTarget) return
    setDowngrading(true)
    setDowngradeError('')
    try {
      await subscriptionApi.scheduleDowngrade(downgradeTarget.tier)
      await refreshStatus()
      setDowngradeTarget(null)
    } catch (err) {
      setDowngradeError(err?.response?.data?.error?.message || '변경에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setDowngrading(false)
    }
  }

  const handleCancelDowngrade = async () => {
    setCancelling(true)
    try {
      await subscriptionApi.cancelDowngrade()
      await refreshStatus()
    } catch (err) {
      alert(err?.response?.data?.error?.message || '취소에 실패했습니다.')
    } finally {
      setCancelling(false)
    }
  }

  const getDiscountPct = (plan) => {
    if (!plan.monthlyPrice) return null
    return Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
  }

  const formatPrice = (p) => p === 0 ? '무료' : p.toLocaleString('ko-KR') + '원'

  return (
    <div style={{ maxWidth: 940, margin: '0 auto' }}>

      {/* 로그인 필요 토스트 */}
      {loginToast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#1e1e2e', color: '#fff', borderRadius: 14,
          padding: '14px 24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>구독하려면 로그인이 필요합니다</span>
          <button
            onClick={() => navigate('/auth/login', { state: { from: '/subscription' } })}
            style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >로그인</button>
        </div>
      )}

      {/* ── 다운그레이드 확인 모달 ── */}
      {downgradeTarget && (
        <div
          onClick={() => { if (!downgrading) { setDowngradeTarget(null); setDowngradeError('') } }}
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 20, padding: '36px 40px', width: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.18)' }}>
            <p style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>플랜 변경 예약</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>
              {status?.expiresAt
                ? `현재 결제 기간이 끝나면 자동으로 변경됩니다.`
                : '플랜이 즉시 변경됩니다.'}
            </p>

            {/* 플랜 전환 카드 */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 24 }}>
              <div style={{ flex: 1, background: currentPlan?.accentBg, borderRadius: 12, padding: '16px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: currentPlan?.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>현재 플랜</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{currentPlan?.icon} {currentPlan?.name}</p>
                {status?.expiresAt && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(status.expiresAt)}까지</p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 18, fontWeight: 300, flexShrink: 0 }}>→</div>

              <div style={{ flex: 1, background: downgradeTarget.accentBg, borderRadius: 12, padding: '16px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: downgradeTarget.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>변경될 플랜</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{downgradeTarget.icon} {downgradeTarget.name}</p>
                {status?.expiresAt && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(status.expiresAt)}부터</p>
                )}
              </div>
            </div>

            {/* 안내 사항 */}
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
              {[
                status?.expiresAt
                  ? `${fmt(status.expiresAt)}까지 ${currentPlan?.name}의 모든 기능을 이용할 수 있습니다.`
                  : `${currentPlan?.name}의 모든 기능을 계속 이용할 수 있습니다.`,
                '변경 전까지 언제든지 취소하거나 다른 플랜으로 업그레이드할 수 있습니다.',
              ].map((t, i) => (
                <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', margin: i > 0 ? '8px 0 0' : 0, display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0 }}>✓</span>{t}
                </p>
              ))}
            </div>

            {downgradeError && (
              <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>{downgradeError}</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setDowngradeTarget(null); setDowngradeError('') }}
                disabled={downgrading}
                style={{ flex: 1, padding: '12px', borderRadius: 11, fontSize: 14, fontWeight: 600, background: 'var(--bg-slate)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                취소
              </button>
              <button
                onClick={handleDowngradeConfirm}
                disabled={downgrading}
                style={{ flex: 1, padding: '12px', borderRadius: 11, fontSize: 14, fontWeight: 700, background: '#27272a', border: 'none', color: '#fff', cursor: downgrading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: downgrading ? 0.6 : 1 }}
              >
                {downgrading ? '처리 중...' : '플랜 변경 예약'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>구독 플랜</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          현재 플랜: <strong style={{ color: currentPlan?.color }}>{currentPlan?.name}</strong>
          {status?.expiresAt && !pendingPlan && (
            <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
              ({fmt(status.expiresAt)} 갱신)
            </span>
          )}
        </p>
      </div>

      {/* ── 예정된 플랜 변경 카드 ── */}
      {pendingPlan && (
        <div style={{
          background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16,
          padding: '20px 24px', marginBottom: 28,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                📋
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>플랜 변경이 예약되었습니다</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {status?.expiresAt
                    ? <><strong style={{ color: pendingPlan.color }}>{pendingPlan.name}</strong> 플랜으로 변경됩니다. {fmt(status.expiresAt)}까지 <strong>{currentPlan?.name}</strong>의 모든 기능을 이용할 수 있습니다.</>
                    : <><strong style={{ color: pendingPlan.color }}>{pendingPlan.name}</strong> 플랜으로 변경됩니다.</>
                  }
                </p>
                {status?.expiresAt && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentPlan?.color }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentPlan?.name} ~ {fmt(status.expiresAt)}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: pendingPlan.color }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pendingPlan.name} {fmt(status.expiresAt)}부터</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleCancelDowngrade}
              disabled={cancelling}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 9, border: '1.5px solid var(--border)',
                fontSize: 13, fontWeight: 600, background: 'var(--surface)', color: 'var(--text-secondary)',
                cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: cancelling ? 0.6 : 1, whiteSpace: 'nowrap',
              }}
            >
              {cancelling ? '취소 중...' : '변경 취소'}
            </button>
          </div>
        </div>
      )}

      {/* ── Usage info ── */}
      {status && currentTier !== 'FREE' && !pendingPlan && (
        <div style={{
          background: 'var(--bg-indigo)', border: '1px solid var(--border-indigo)', borderRadius: 12,
          padding: '13px 18px', marginBottom: 28, fontSize: 14, color: 'var(--primary)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>📊</span>
          이번 달 면접 {status.usedInterviewsThisMonth}회 사용
          {status.monthlyInterviewLimit !== -1 && ` / ${status.monthlyInterviewLimit}회`}
          {status.remainingInterviews !== -1 && ` (${status.remainingInterviews}회 남음)`}
        </div>
      )}

      {/* ── Billing toggle ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
          {[
            { key: 'monthly', label: '월간 결제' },
            { key: 'yearly', label: '연간 결제', badge: '최대 17% 할인' },
          ].map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setBilling(key)}
              style={{
                padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s',
                background: billing === key ? 'var(--surface)' : 'transparent',
                color: billing === key ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: billing === key ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {label}
              {badge && billing !== key && (
                <span style={{ background: 'var(--bg-success)', color: 'var(--success)', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier
          const isUpgrade = TIER_ORDER[plan.tier] > TIER_ORDER[currentTier]
          const isDowngrade = TIER_ORDER[plan.tier] < TIER_ORDER[currentTier]
          const isPendingDowngrade = plan.tier === status?.pendingDowngradeTier
          const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
          const discount = billing === 'yearly' ? getDiscountPct(plan) : null

          return (
            <div
              key={plan.tier}
              style={{
                background: 'var(--surface)', borderRadius: 16,
                padding: isCurrent ? '26px 22px' : '24px 22px',
                boxShadow: isCurrent
                  ? `0 0 0 2px ${plan.color}, var(--shadow)`
                  : isPendingDowngrade
                    ? '0 0 0 2px #e2e8f0, var(--shadow-sm)'
                    : 'var(--shadow-sm)',
                border: (isCurrent || isPendingDowngrade) ? 'none' : '1px solid var(--border-light)',
                position: 'relative', display: 'flex', flexDirection: 'column',
                transition: 'all 0.2s',
                opacity: isDowngrade && !isPendingDowngrade ? 0.85 : 1,
              }}
            >
              {/* 뱃지 */}
              {plan.badge && !isPendingDowngrade && (
                <div style={{
                  position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: '#fff',
                  borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}
              {isPendingDowngrade && (
                <div style={{
                  position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--text-secondary)', color: '#fff',
                  borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  다음 플랜
                </div>
              )}

              {/* 현재 플랜 / 만료일 뱃지 */}
              {isCurrent && (
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <div style={{ background: plan.color + '20', color: plan.color, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
                    현재
                  </div>
                  {status?.expiresAt && pendingPlan && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                      {fmt(status.expiresAt)}까지
                    </div>
                  )}
                </div>
              )}

              {/* 플랜 헤더 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: plan.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 10,
                }}>{plan.icon}</div>
                <div style={{ color: plan.color, fontWeight: 700, fontSize: 12, marginBottom: 3, letterSpacing: '0.05em' }}>
                  {plan.name.toUpperCase()}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
                  {formatPrice(price)}
                </div>
                {billing === 'yearly' && plan.monthlyPrice > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                    월 {formatPrice(Math.round(price / 12))}
                    {discount && <span style={{ color: 'var(--success)', fontWeight: 700, marginLeft: 5 }}>-{discount}%</span>}
                  </div>
                )}
                {billing === 'monthly' && plan.monthlyPrice > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>/ 월</div>
                )}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0 0 16px' }} />

              {/* 기능 목록 */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                    <span style={{ color: plan.color, flexShrink: 0, fontWeight: 700, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA 버튼 */}
              {isPendingDowngrade ? (
                <div style={{
                  width: '100%', padding: '11px', borderRadius: 9, boxSizing: 'border-box',
                  background: 'var(--bg-slate)', textAlign: 'center',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                }}>
                  {status?.expiresAt ? `${new Date(status.expiresAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}부터 시작` : '변경 예정'}
                </div>
              ) : (
                <button
                  disabled={isCurrent}
                  onClick={() => {
                    if (isUpgrade) handleUpgradeClick(plan)
                    else if (isDowngrade) setDowngradeTarget(plan)
                  }}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 9, border: 'none',
                    fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: 'all 0.15s',
                    cursor: isCurrent ? 'default' : 'pointer',
                    background: isCurrent ? plan.accentBg : isUpgrade ? plan.color : 'var(--bg-slate)',
                    color: isCurrent ? plan.color : isUpgrade ? '#fff' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  {isCurrent ? '현재 플랜' : isUpgrade ? '업그레이드 →' : '다운그레이드'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Info footer ── */}
      <div style={{
        background: 'var(--surface)', borderRadius: 12, padding: '18px 22px',
        border: '1px solid var(--border-light)', fontSize: 13, color: 'var(--text-secondary)',
      }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>이용 안내</p>
        {['카카오페이, 토스페이, 토스페이먼츠로 결제 가능합니다.', '구독은 매월 자동 갱신되며, 언제든 해지할 수 있습니다.', '연간 구독은 결제 시점부터 1년간 유효합니다.'].map((t) => (
          <p key={t} style={{ marginBottom: 5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>·</span> {t}
          </p>
        ))}
      </div>
    </div>
  )
}

export default SubscriptionPage
