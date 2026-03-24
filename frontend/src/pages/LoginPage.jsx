import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import Input from '../components/Input'
import Button from '../components/Button'

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.error?.message || '이메일 또는 비밀번호를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
    }}>
      {/* Left decorative panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        display: 'none',
      }} className="auth-left">
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>AI 면접 플랫폼</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interview Assistant</div>
            </div>
          </div>

          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: '36px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>로그인</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>계정에 로그인하여 면접 연습을 시작하세요</p>

            {error && (
              <div style={{
                background: 'var(--bg-error)', border: '1px solid var(--border-error)', borderRadius: 10,
                padding: '12px 16px', marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--danger)', fontSize: 13,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="이메일"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="비밀번호"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Button
                type="submit"
                fullWidth
                loading={loading}
                size="lg"
                style={{
                  marginTop: 8,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 15,
                  letterSpacing: '0.01em',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.5)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(79, 70, 229, 0.35)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                로그인
              </Button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            계정이 없으신가요?{' '}
            <Link to="/auth/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>회원가입</Link>
          </p>

          <button
            onClick={() => navigate('/home')}
            style={{
              width: '100%', marginTop: 10, padding: '12px',
              background: '#fff',
              border: '1.5px solid #c7d2fe',
              borderRadius: 12, color: '#4f46e5',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
              boxShadow: '0 1px 4px rgba(79,70,229,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#eef2ff'
              e.currentTarget.style.borderColor = '#a5b4fc'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.borderColor = '#c7d2fe'
            }}
          >
            🏠 로그인 없이 둘러보기
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
