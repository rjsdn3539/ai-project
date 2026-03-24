import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../api/auth'
import Input from '../components/Input'
import Button from '../components/Button'

function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.name) e.name = '이름을 입력하세요'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다'
    if (form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다'
    if (form.password !== form.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }
    setErrors({})
    setLoading(true)
    try {
      await authApi.register({ name: form.name, email: form.email, password: form.password, phone: form.phone })
      navigate('/auth/login')
    } catch (err) {
      setErrors({ submit: err.response?.data?.error?.message || '회원가입에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const f = (field) => ({ value: form[field], onChange: (e) => setForm({ ...form, [field]: e.target.value }) })

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>회원가입</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>계정을 만들고 AI 면접을 무료로 시작하세요</p>

          {errors.submit && (
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
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input label="이름" placeholder="홍길동" error={errors.name} {...f('name')} required />
            <Input label="이메일" type="email" placeholder="example@email.com" error={errors.email} {...f('email')} required />
            <Input label="비밀번호" type="password" placeholder="8자 이상 입력" error={errors.password} hint="영문, 숫자를 포함한 8자 이상" {...f('password')} required />
            <Input label="비밀번호 확인" type="password" placeholder="비밀번호 재입력" error={errors.passwordConfirm} {...f('passwordConfirm')} required />
            <Input label="연락처 (선택)" placeholder="010-0000-0000" {...f('phone')} />
            <Button type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: 4 }}>
              가입하기
            </Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>로그인</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
