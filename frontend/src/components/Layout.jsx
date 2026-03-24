import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import { AchievementToastProvider } from './AchievementToast'

const NAV_MAIN = [
  { to: '/home',            icon: '🏠', label: '홈',         auth: false },
  { to: '/interview/setup', icon: '🎤', label: '면접 시작',  auth: true  },
  { to: '/learning',        icon: '📚', label: 'AI 학습',    auth: true  },
  { to: '/books',           icon: '🛍', label: '도서 스토어', auth: false },
  { to: '/subscription',    icon: '✦',  label: '구독 플랜',  auth: false },
]

const NAV_GUEST = [
  { to: '/faq', icon: '❓', label: 'FAQ' },
]

const PROFILE_MENU = [
  { to: '/profile',           icon: '👤', label: '내 프로필' },
  { to: '/interview/history', icon: '📋', label: '면접 기록' },
  { to: '/schedule',          icon: '📅', label: '면접 일정' },
  { to: '/dashboard',         icon: '📊', label: '내 통계'   },
  { to: '/achievements',      icon: '🏆', label: '업적 & 뱃지' },
  { to: '/faq',               icon: '❓', label: 'FAQ'        },
  { to: '/inquiry',           icon: '✉️', label: '문의하기'   },
]

const TIER_COLOR = { FREE: '#b3a99e', STANDARD: '#7c6af0', PRO: '#9b5de5', PREMIUM: 'var(--warning)' }
const TIER_BG    = { FREE: 'rgba(179,169,158,0.15)', STANDARD: 'rgba(124,106,240,0.2)', PRO: 'rgba(155,93,229,0.2)', PREMIUM: 'rgba(224,148,32,0.2)' }

const navLinkStyle = ({ isActive }) => ({
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 9, marginBottom: 2,
  color: isActive ? '#fff' : '#8c7f74',
  background: isActive
    ? 'linear-gradient(135deg, rgba(124,106,240,0.7) 0%, rgba(14,165,233,0.5) 100%)'
    : 'transparent',
  fontWeight: isActive ? 600 : 400, fontSize: 14,
  transition: 'all 0.15s', textDecoration: 'none',
  border: isActive ? '1px solid rgba(124,106,240,0.4)' : '1px solid transparent',
  boxShadow: isActive ? '0 2px 8px rgba(124,106,240,0.25)' : 'none',
})

function Layout() {
  const { accessToken, user, logout } = useAuthStore()
  const { items } = useCartStore()
  const navigate = useNavigate()

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const tier = user?.subscriptionTier || 'FREE'

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  // 초기 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    setTimeout(() => navigate('/auth/login'), 1500)
  }

  return (
    <AchievementToastProvider>
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* 로그아웃 확인 모달 */}
      {(showLogoutModal || loggingOut) && (
        <div
          onClick={() => { if (!loggingOut) setShowLogoutModal(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: 20, padding: '36px 40px',
              width: 360, boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              animation: 'fadeIn 0.18s ease', textAlign: 'center',
            }}
          >
            {loggingOut ? (
              <>
                <div style={{ fontSize: 52, marginBottom: 16 }}>👋</div>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                  로그아웃 되었어요
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>이용해주셔서 감사합니다</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚪</div>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                  로그아웃 하시겠어요?
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
                  {user?.name}님, 면접 연습은 언제든 다시 시작할 수 있어요
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                      background: 'var(--bg)', border: '1.5px solid var(--border)',
                      color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >취소</button>
                  <button
                    onClick={handleLogout}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: 'var(--danger)', border: 'none',
                      color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >로그아웃</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)', flexShrink: 0,
        background: 'var(--sidebar-bg)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        borderRight: '1px solid rgba(255,255,255,0.04)',
        overflow: 'visible',
      }}>
        {/* Logo */}
        <div style={{
          padding: '22px 16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(160deg, rgba(124,106,240,0.18) 0%, rgba(14,165,233,0.08) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #7c6af0 0%, #0ea5e9 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0, boxShadow: '0 4px 14px rgba(124,106,240,0.5)',
              }}>🤖</div>
              <div>
                <div style={{ color: '#f5f0eb', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>AI 면접</div>
                <div style={{ color: '#5c5248', fontSize: 11, fontWeight: 500 }}>플랫폼</div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: theme === 'dark' ? 'rgba(157,141,248,0.15)' : 'rgba(255,255,255,0.06)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme === 'dark' ? 'rgba(157,141,248,0.25)' : 'rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme === 'dark' ? 'rgba(157,141,248,0.15)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#4a413b', letterSpacing: '0.1em', padding: '4px 12px 8px' }}>INTERVIEW</div>
          {NAV_MAIN.filter(({ auth }) => !auth || accessToken).map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={navLinkStyle} end={to === '/home'}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}

          {accessToken && (
            <NavLink to="/cart" style={navLinkStyle}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>🛒</span>
              장바구니
              {items.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>
                  {items.length}
                </span>
              )}
            </NavLink>
          )}

          {!accessToken && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#4a413b', letterSpacing: '0.1em', padding: '14px 12px 8px' }}>SUPPORT</div>
              {NAV_GUEST.map(({ to, icon, label }) => (
                <NavLink key={to} to={to} style={navLinkStyle}>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>
                  {label}
                </NavLink>
              ))}
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#4a413b', letterSpacing: '0.1em', padding: '14px 12px 8px' }}>ADMIN</div>
              <NavLink to="/admin" style={({ isActive }) => ({
                ...navLinkStyle({ isActive }),
                color: isActive ? '#fbbf24' : '#fbbf24',
                background: isActive ? 'rgba(251,191,36,0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(251,191,36,0.2)' : '1px solid transparent',
              })}>
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>⚙</span>
                관리자 패널
              </NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          {accessToken ? (
            <>
              {/* 드롭업 메뉴 */}
              {showProfileMenu && (
                <div
                  style={{
                    position: 'absolute', bottom: '100%', left: 10, right: 10,
                    background: '#1e1a18', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '6px', zIndex: 100,
                    boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
                    marginBottom: 4,
                  }}
                >
                  {PROFILE_MENU.map(({ to, icon, label }) => (
                    <div
                      key={to}
                      onClick={() => { navigate(to); setShowProfileMenu(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '9px 10px', borderRadius: 7, cursor: 'pointer',
                        color: '#8c7f74', fontSize: 13, transition: 'all 0.12s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#f0ebe4' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8c7f74' }}
                    >
                      <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>
              )}

              {/* 프로필 카드 */}
              <div
                onClick={() => setShowProfileMenu((v) => !v)}
                style={{
                  background: showProfileMenu ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '12px', marginBottom: 8,
                  cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { if (!showProfileMenu) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c6af0, #9b5de5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ color: '#f0ebe4', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                    <div style={{ color: '#5c5248', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>
                </div>
                <div onClick={(e) => { e.stopPropagation(); navigate('/subscription') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: TIER_BG[tier], color: TIER_COLOR[tier], borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '3px 9px' }}>
                  ✦ {tier}
                </div>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                style={{ width: '100%', padding: '9px', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#5c5248', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8c7f74' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5c5248' }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <button
                onClick={() => navigate('/auth/login')}
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #7c6af0, #0ea5e9)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/auth/register')}
                style={{ width: '100%', padding: '9px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8c7f74', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#b3a99e' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8c7f74' }}
              >
                회원가입
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', padding: '36px 40px' }}>
        <div className="page-anim">
          <Outlet />
        </div>
      </main>
    </div>
    </AchievementToastProvider>
  )
}

export default Layout
