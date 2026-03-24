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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#111' }}>회원가입</h1>
        <p style={{ color: '#6b7280', marginBottom: '28px', fontSize: '14px' }}>계정을 만들고 AI 면접을 시작하세요</p>

        {errors.submit && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input label="이름" placeholder="홍길동" error={errors.name} {...f('name')} required />
          <Input label="이메일" type="email" placeholder="example@email.com" error={errors.email} {...f('email')} required />
          <Input label="비밀번호" type="password" placeholder="8자 이상" error={errors.password} {...f('password')} required />
          <Input label="비밀번호 확인" type="password" placeholder="비밀번호 재입력" error={errors.passwordConfirm} {...f('passwordConfirm')} required />
          <Input label="연락처 (선택)" placeholder="010-0000-0000" {...f('phone')} />
          <Button type="submit" fullWidth loading={loading}>회원가입</Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
          이미 계정이 있으신가요?{' '}
          <Link to="/auth/login" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>로그인</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
